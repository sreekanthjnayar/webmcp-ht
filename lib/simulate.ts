import { capacityOf, isBufferKind, isCacheKind, isFanoutKind, specOf } from "./catalog";
import { sanitizeGraph, topologicalOrder, type ArchEdge, type ArchNode } from "./graph";
import { drainCapacity, EMPTY_NODE, finish, hottestSyncPath, latencyMs } from "./simulate-paths";
import type { SimEdgeResult, SimNodeResult, SimResult, Slo } from "./types";

export { evaluateSlo } from "./slo";

export function simulate(
  nodes: ArchNode[],
  edges: ArchEdge[],
  ingressRps: number,
  slo: Slo,
): SimResult {
  try {
    return simulateInner(nodes, edges, ingressRps, slo);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Simulation crashed.";
    return finish(
      nodes,
      edges,
      {
        ingressRps,
        p99Ms: 0,
        errorRate: 1,
        maxQueueLagMs: 0,
        hottestPath: [],
        bottlenecks: [],
        nodes: Object.fromEntries((nodes ?? []).map((n) => [n.id, { ...EMPTY_NODE }])),
        edges: Object.fromEntries((edges ?? []).map((e) => [e.id, { rps: 0 }])),
        error: `Simulation failed: ${message}`,
      },
      slo,
    );
  }
}

function simulateInner(
  rawNodes: ArchNode[],
  rawEdges: ArchEdge[],
  ingressRps: number,
  slo: Slo,
): SimResult {
  const { nodes, edges, issues } = sanitizeGraph(rawNodes, rawEdges);
  const broken = issues.filter((i) => i.code === "unknown_kind");
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
      nodes: Object.fromEntries(nodes.map((n) => [n.id, { ...EMPTY_NODE }])),
      edges: Object.fromEntries(edges.map((e) => [e.id, { rps: 0 }])),
      error: "Cycle detected. Disconnect a back-edge, then run again.",
    };
    return finish(nodes, edges, failed, slo);
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
    return finish(nodes, edges, failed, slo);
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
    const node = nodeById.get(id);
    if (!node) continue;
    const spec = specOf(node.data.kind);
    const inc = incoming.get(id) ?? 0;
    const cap = capacityOf(node.data.kind, node.data.replicas, node.data.rpsCapacity);
    const util = cap === Number.POSITIVE_INFINITY ? 0 : cap === 0 ? 1 : inc / cap;
    const overflow = cap === Number.POSITIVE_INFINITY ? 0 : Math.max(0, inc - cap);
    const available = inc - overflow;

    const isCache = isCacheKind(node.data.kind);
    const hitRate = isCache ? (node.data.hitRate ?? spec.hitRate ?? 0) : 0;
    const hits = isCache ? available * hitRate : 0;
    const forwarded = isCache ? available * (1 - hitRate) : available;
    const processed = isCache ? hits + forwarded : available;

    const outs = outgoing.get(id) ?? [];
    if (outs.length === 0 && forwarded > 0 && isCache) {
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
      const rps = isFanoutKind(node.data.kind) ? forwarded : share;
      edgeResult[e.id] = { rps };
      incoming.set(e.target, (incoming.get(e.target) ?? 0) + rps);
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
    if (!isBufferKind(node.data.kind)) continue;
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

  const result = finish(
    nodes,
    edges,
    {
      ingressRps,
      p99Ms,
      errorRate,
      maxQueueLagMs,
      hottestPath,
      bottlenecks,
      nodes: nodeResult,
      edges: edgeResult,
    },
    slo,
  );
  if (broken.length) {
    result.robustness = {
      ...result.robustness,
      notes: [
        `${broken.length} broken block${broken.length === 1 ? "" : "s"} on the canvas — traffic into them is dropped.`,
        ...result.robustness.notes,
      ],
    };
  }
  return result;
}
