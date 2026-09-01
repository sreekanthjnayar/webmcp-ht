import { capacityOf } from "./catalog";
import { evaluateSlo } from "./slo";
import { emptyRobustness, scoreRobustness } from "./robustness";
import type { ArchEdge, ArchNode } from "./graph";
import type { SimNodeResult, SimResult, Slo } from "./types";

export const EMPTY_NODE: SimNodeResult = {
  incomingRps: 0,
  processedRps: 0,
  overflowRps: 0,
  forwardedRps: 0,
  utilization: 0,
  addedLatencyMs: 0,
  queueLagMs: 0,
};

export function finish(
  nodes: ArchNode[],
  edges: ArchEdge[],
  base: Omit<SimResult, "sloPassed" | "robustness" | "delta">,
  slo: Slo,
): SimResult {
  const sloPassed = evaluateSlo(base, slo);
  const robustness = base.error
    ? emptyRobustness("The graph cannot run.", [base.error])
    : scoreRobustness(nodes, edges, base, slo);
  return { ...base, sloPassed, robustness, delta: null };
}

export function latencyMs(base: number, util: number): number {
  return base * (1 + 1.5 * Math.max(0, util - 0.7));
}

export function drainCapacity(
  queueId: string,
  outgoing: Map<string, ArchEdge[]>,
  nodeById: Map<string, ArchNode>,
): number {
  const outs = outgoing.get(queueId) ?? [];
  if (outs.length === 0) return 0;
  let cap = 0;
  for (const e of outs) {
    const n = nodeById.get(e.target);
    if (!n) continue;
    cap += capacityOf(n.data.kind, n.data.replicas, n.data.rpsCapacity);
  }
  return cap;
}

export function hottestSyncPath(
  clients: ArchNode[],
  outgoing: Map<string, ArchEdge[]>,
  nodeById: Map<string, ArchNode>,
  nodeResult: Record<string, SimNodeResult>,
): string[] {
  let best: string[] = [];
  let bestCost = -1;

  function walk(id: string, path: string[], cost: number) {
    const next = (outgoing.get(id) ?? []).filter((e) => (e.data?.protocol ?? "sync") === "sync");
    const here = [...path, id];
    const r = nodeResult[id];
    const nextCost = cost + (r?.addedLatencyMs ?? 0) + (r?.queueLagMs ?? 0);
    if (next.length === 0) {
      if (nextCost > bestCost) {
        bestCost = nextCost;
        best = here;
      }
      return;
    }
    for (const e of next) {
      if (path.includes(e.target)) continue;
      walk(e.target, here, nextCost);
    }
  }

  for (const c of clients) walk(c.id, [], 0);
  return best;
}
