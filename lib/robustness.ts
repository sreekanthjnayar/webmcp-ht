import { isCacheKind, isStatefulKind } from "./catalog";
import type { ArchEdge, ArchNode } from "./graph";
import type {
  MetricDelta,
  RobustnessGrade,
  RobustnessReport,
  RunDelta,
  SimResult,
  Slo,
} from "./types";
import { evaluateSlo } from "./slo";

const EMPTY_PARTS = { slo: 0, errors: 0, latency: 0, headroom: 0, redundancy: 0 };

export function emptyRobustness(headline: string, notes: string[] = []): RobustnessReport {
  return {
    score: 0,
    grade: "fragile",
    headline,
    notes,
    strengths: [],
    parts: { ...EMPTY_PARTS },
  };
}

export function gradeFromScore(score: number): RobustnessGrade {
  if (score >= 85) return "hardy";
  if (score >= 65) return "solid";
  if (score >= 50) return "fair";
  if (score >= 30) return "weak";
  return "fragile";
}

type SimCore = Omit<SimResult, "sloPassed" | "robustness" | "delta">;

export function scoreRobustness(
  nodes: ArchNode[],
  edges: ArchEdge[],
  sim: SimCore,
  slo: Slo,
): RobustnessReport {
  if (sim.error) return emptyRobustness("The graph cannot run.", [sim.error]);

  const sloPassed = evaluateSlo(sim, slo);
  const working = nodes.filter((n) => n.data.kind !== "client");
  const maxUtil = working.reduce((m, n) => Math.max(m, sim.nodes[n.id]?.utilization ?? 0), 0);
  const errorRatio = slo.maxErrorRate <= 0 ? sim.errorRate : sim.errorRate / slo.maxErrorRate;
  const latencyRatio = slo.maxP99Ms <= 0 ? 1 : sim.p99Ms / slo.maxP99Ms;

  const sloPts = sloPassed ? 30 : Math.max(0, 12 - Math.round(errorRatio * 4));
  const errorPts = clamp(Math.round(20 * (1 - Math.min(1, errorRatio / 4))));
  const latencyPts = clamp(Math.round(20 * (1 - Math.min(1, Math.max(0, latencyRatio - 0.45) / 1.05))));
  const headroomPts = clamp(Math.round(15 * (1 - Math.min(1, Math.max(0, maxUtil - 0.55) / 0.9))));

  const spofs = findSpofs(nodes, sim);
  const hotWithoutCache = hottestMissingCache(nodes, edges, sim);
  let redundancyPts = 15;
  redundancyPts -= Math.min(12, spofs.length * 6);
  if (hotWithoutCache) redundancyPts -= 4;
  if (sim.bottlenecks.length >= 3) redundancyPts -= 3;
  redundancyPts = clamp(redundancyPts);

  const parts = {
    slo: sloPts,
    errors: errorPts,
    latency: latencyPts,
    headroom: headroomPts,
    redundancy: redundancyPts,
  };
  const score = clamp(sloPts + errorPts + latencyPts + headroomPts + redundancyPts, 0, 100);
  const grade = gradeFromScore(score);

  const notes: string[] = [];
  const strengths: string[] = [];

  if (!sloPassed) {
    if (sim.errorRate > slo.maxErrorRate) {
      notes.push(
        `Error rate ${(sim.errorRate * 100).toFixed(1)}% exceeds the ${(slo.maxErrorRate * 100).toFixed(0)}% SLO.`,
      );
    }
    if (sim.p99Ms > slo.maxP99Ms) {
      notes.push(`p99 ${Math.round(sim.p99Ms)}ms exceeds the ${slo.maxP99Ms}ms SLO.`);
    }
    if (slo.maxQueueLagMs != null && sim.maxQueueLagMs > slo.maxQueueLagMs) {
      notes.push(`Queue lag ${Math.round(sim.maxQueueLagMs)}ms exceeds ${slo.maxQueueLagMs}ms.`);
    }
  } else {
    strengths.push("All SLOs hold on this run.");
  }

  for (const id of sim.bottlenecks.slice(0, 3)) {
    const n = nodes.find((x) => x.id === id);
    const util = sim.nodes[id]?.utilization ?? 0;
    if (n) notes.push(`${n.data.label} (${id}) is overloaded at ${Math.round(util * 100)}% utilization.`);
  }

  for (const spof of spofs.slice(0, 3)) {
    notes.push(`${spof} is a single point of failure — one replica carrying live traffic.`);
  }

  if (hotWithoutCache) {
    notes.push("The hottest path hits storage without a cache or CDN in front of it.");
  }

  const caches = nodes.filter((n) => isCacheKind(n.data.kind) && (sim.nodes[n.id]?.incomingRps ?? 0) > 0);
  if (caches.length) {
    strengths.push(
      `${caches.map((c) => c.data.label).join(", ")} absorbing hits off the origin.`,
    );
  }
  if (maxUtil > 0 && maxUtil < 0.7 && sloPassed) {
    strengths.push(`Peak utilization ${Math.round(maxUtil * 100)}% — spare headroom if traffic spikes.`);
  }

  const headline = headlineFor(grade, sloPassed, notes[0]);
  return { score, grade, headline, notes, strengths, parts };
}

export function compareRuns(previous: SimResult, current: SimResult): RunDelta {
  const scoreDelta = current.robustness.score - previous.robustness.score;
  const metrics: MetricDelta[] = [
    metric("Robustness", String(previous.robustness.score), String(current.robustness.score), true),
    metric("Errors", pct(previous.errorRate), pct(current.errorRate), false),
    metric("p99", `${Math.round(previous.p99Ms)}ms`, `${Math.round(current.p99Ms)}ms`, false),
    metric(
      "Bottlenecks",
      String(previous.bottlenecks.length),
      String(current.bottlenecks.length),
      false,
    ),
  ];
  if (previous.sloPassed !== current.sloPassed) {
    metrics.push(
      metric("SLO", previous.sloPassed ? "pass" : "miss", current.sloPassed ? "pass" : "miss", true),
    );
  }
  const direction: RunDelta["direction"] =
    scoreDelta >= 3 ? "better" : scoreDelta <= -3 ? "worse" : "unchanged";
  const summary =
    direction === "better"
      ? `Better than last run (+${scoreDelta}). ${current.robustness.headline}`
      : direction === "worse"
        ? `Worse than last run (${scoreDelta}). ${current.robustness.headline}`
        : `About the same as last run. ${current.robustness.headline}`;
  return { scoreDelta, direction, summary, metrics };
}

function metric(label: string, before: string, after: string, higherIsBetter: boolean): MetricDelta {
  const a = parseLoose(before);
  const b = parseLoose(after);
  let direction: MetricDelta["direction"] = "unchanged";
  if (Number.isFinite(a) && Number.isFinite(b) && Math.abs(b - a) > 0.001) {
    const improved = higherIsBetter ? b > a : b < a;
    direction = improved ? "better" : "worse";
  } else if (before !== after) {
    if (after === "pass" && before === "miss") direction = "better";
    else if (after === "miss" && before === "pass") direction = "worse";
  }
  return { label, before, after, direction };
}

function parseLoose(value: string): number {
  return Number.parseFloat(value.replace(/[^\d.-]/g, ""));
}

function pct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function findSpofs(nodes: ArchNode[], sim: SimCore): string[] {
  return nodes
    .filter((n) => {
      if (!isStatefulKind(n.data.kind) && n.data.kind !== "auth") return false;
      if (n.data.replicas > 1) return false;
      const r = sim.nodes[n.id];
      if (!r || r.incomingRps < 1) return false;
      return r.utilization >= 0.5 || r.overflowRps > 1;
    })
    .map((n) => `${n.data.label} (${n.id})`);
}

function hottestMissingCache(nodes: ArchNode[], edges: ArchEdge[], sim: SimCore): boolean {
  const path = sim.hottestPath;
  if (path.length < 2) return false;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const hasCache = path.some((id) => {
    const k = byId.get(id)?.data.kind;
    return k ? isCacheKind(k) : false;
  });
  const hitsStorage = path.some((id) => {
    const k = byId.get(id)?.data.kind;
    return k ? isStatefulKind(k) || k === "object_store" : false;
  });
  return hitsStorage && !hasCache && edges.length > 0;
}

function headlineFor(grade: RobustnessGrade, sloPassed: boolean, firstNote?: string): string {
  if (grade === "hardy") return "Hardy — SLOs hold and the graph has spare capacity.";
  if (grade === "solid") return "Solid — this design takes the load without obvious collapse.";
  if (grade === "fair") return sloPassed ? "Fair — it passes, but a spike would hurt." : "Fair — close, but the SLO still misses.";
  if (grade === "weak") return firstNote ?? "Weak — a few overloaded hops dominate the score.";
  return firstNote ?? "Fragile — most traffic never completes cleanly.";
}

function clamp(n: number, min = 0, max = 20): number {
  return Math.max(min, Math.min(max, n));
}