import { CATALOG, capacityOf } from "./catalog";
import { topologicalOrder, type ArchEdge, type ArchNode } from "./graph";
import type { SimEdgeResult, SimNodeResult, SimResult, Slo } from "./types";

const EMPTY_NODE: SimNodeResult = {
  incomingRps: 0,
  processedRps: 0,
  overflowRps: 0,
  forwardedRps: 0,
  utilization: 0,
  addedLatencyMs: 0,
  queueLagMs: 0,
};

export function evaluateSlo(sim: Omit<SimResult, "sloPassed">, slo: Slo): boolean {
  if (sim.error) return false;
  if (sim.p99Ms > slo.maxP99Ms) return false;
  if (sim.errorRate > slo.maxErrorRate) return false;
  if (slo.maxQueueLagMs != null && sim.maxQueueLagMs > slo.maxQueueLagMs) return false;
  return true;
}

export function simulate(
  nodes: ArchNode[],
  edges: ArchEdge[],
  ingressRps: number,
  slo: Slo,
): SimResult {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const order = topologicalOrder(nodes, edges);
  if (!order) {
    const failed = {
      ingressRps,
      p99Ms: 0,
      errorRate: 1,
      maxQueueLagMs: 0,
      hottestPath: [] as string[],
      bottlenecks: [] as string[],
      nodes: {} as Record<string, SimNodeResult>,
      edges: {} as Record<string, SimEdgeResult>,
      error: "Cycle detected. Disconnect a back-edge, then run again.",
    };
    return { ...failed, sloPassed: false };
  }

  const clients = nodes.filter((n) => n.data.kind === "client");
  if (clients.length === 0) {
    const failed = {
      ingressRps,
      p99Ms: 0,
      errorRate: 1,
      maxQueueLagMs: 0,
      hottestPath: [] as string[],
      bottlenecks: [] as string[],
      nodes: Object.fromEntries(nodes.map((n) => [n.id, { ...EMPTY_NODE }])),
      edges: Object.fromEntries(edges.map((e) => [e.id, { rps: 0 }])),
      error: "Add a Client so traffic has somewhere to start.",
    };
    return { ...failed, sloPassed: false };
  }

  const incoming = new Map<string, number>();
  for (const n of nodes) incoming.set(n.id, 0);
  const perClient = ingressRps / clients.length;
  for (const c of clients) incoming.set(c.id, perClient);

  const outgoing = new Map<string, ArchEdge[]>();
  for (const n of nodes) outgoing.set(n.id, []);
  for (const e of edges) outgoing.get(e.source)?.push(e);

  const nodeResult: Record<string, SimNodeResult> = {};
  const edgeResult: Record<string, SimEdgeResult> = {};
  for (const e of edges) edgeResult[e.id] = { rps: 0 };

  for (const id of order) {
    const node = nodeById.get(id)!;
    const spec = CATALOG[node.data.kind];
    const inc = incoming.get(id) ?? 0;
    const cap = capacityOf(node.data.kind, node.data.replicas, node.data.rpsCapacity);
    const util = cap === Number.POSITIVE_INFINITY ? 0 : cap === 0 ? 1 : inc / cap;
    const overflow = cap === Number.POSITIVE_INFINITY ? 0 : Math.max(0, inc - cap);
    const available = inc - overflow;

    const isCache = node.data.kind === "cdn" || node.data.kind === "cache";
    const hitRate = isCache ? (node.data.hitRate ?? spec.hitRate ?? 0) : 0;
    const hits = isCache ? available * hitRate : 0;
    const forwarded = isCache ? available * (1 - hitRate) : available;
    const processed = isCache ? hits + forwarded : available;

    const outs = outgoing.get(id) ?? [];
    if (outs.length === 0 && forwarded > 0 && isCache) {
      // Misses with no origin are dropped.
      nodeResult[id] = {
        incomingRps: inc,
        processedRps: hits,
        overflowRps: overflow + forwarded,
        forwardedRps: 0,
        utilization: util,
        addedLatencyMs: latencyMs(node.data.baseLatencyMs, util),
        queueLagMs: 0,
      };
      continue;
    }

    const share = outs.length ? forwarded / outs.length : 0;
    for (const e of outs) {
      edgeResult[e.id] = { rps: share };
      incoming.set(e.target, (incoming.get(e.target) ?? 0) + share);
    }

    nodeResult[id] = {
      incomingRps: inc,
      processedRps: processed,
      overflowRps: overflow,
      forwardedRps: forwarded,
      utilization: util,
      addedLatencyMs: latencyMs(node.data.baseLatencyMs, util),
      queueLagMs: 0,
    };
  }

  for (const node of nodes) {
    if (node.data.kind !== "queue") continue;
    const inc = nodeResult[node.id]?.incomingRps ?? 0;
    const drain = drainCapacity(node.id, outgoing, nodeById);
    const lag = drain <= 0 ? (inc > 0 ? 10_000 : 0) : Math.max(0, inc - drain) / drain * 1000;
    if (nodeResult[node.id]) nodeResult[node.id].queueLagMs = lag;
  }

  const hottestPath = hottestSyncPath(clients, outgoing, nodeById, nodeResult);
  const p99Ms = hottestPath.reduce((sum, id) => {
    const r = nodeResult[id];
    return sum + (r?.addedLatencyMs ?? 0) + (r?.queueLagMs ?? 0);
  }, 0);
  const totalOverflow = Object.values(nodeResult).reduce((s, r) => s + r.overflowRps, 0);
  const errorRate = ingressRps <= 0 ? 0 : totalOverflow / ingressRps;
  const maxQueueLagMs = Math.max(0, ...nodes.map((n) => nodeResult[n.id]?.queueLagMs ?? 0));
  const bottlenecks = nodes
    .filter((n) => (nodeResult[n.id]?.utilization ?? 0) >= 1 || (nodeResult[n.id]?.overflowRps ?? 0) > 1)
    .map((n) => n.id);

  const base = {
    ingressRps,
    p99Ms,
    errorRate,
    maxQueueLagMs,
    hottestPath,
    bottlenecks,
    nodes: nodeResult,
    edges: edgeResult,
  };
  return { ...base, sloPassed: evaluateSlo(base, slo) };
}

function latencyMs(base: number, util: number): number {
  return base * (1 + 1.5 * Math.max(0, util - 0.7));
}

function drainCapacity(
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

function hottestSyncPath(
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