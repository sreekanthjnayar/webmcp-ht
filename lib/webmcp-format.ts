import { CATALOG, PALETTE_ORDER } from "./catalog";
import { callTrees, type ArchEdge, type ArchNode } from "./graph";
import type { Challenge, SimResult } from "./types";

export function formatArchitecture(
  challenge: Challenge,
  nodes: ArchNode[],
  edges: ArchEdge[],
  sim: SimResult | null,
) {
  return {
    challenge: {
      id: challenge.id,
      title: challenge.title,
      brief: challenge.brief,
      constraints: challenge.constraints,
      hints: challenge.hints,
      ingressRps: challenge.ingressRps,
      slo: challenge.slo,
    },
    nodes: nodes.map((n) => ({
      id: n.id,
      kind: n.data.kind,
      label: n.data.label,
      replicas: n.data.replicas,
      rpsCapacity: n.data.rpsCapacity,
      capacity: n.data.kind === "client" || n.data.rpsCapacity <= 0 ? "unlimited" : n.data.replicas * n.data.rpsCapacity,
      baseLatencyMs: n.data.baseLatencyMs,
      hitRate: n.data.hitRate ?? null,
      locked: Boolean(n.data.locked),
      findings: n.data.findings,
      position: n.position,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      from: e.source,
      to: e.target,
      protocol: e.data?.protocol ?? "sync",
    })),
    callTrees: callTrees(nodes, edges),
    lastSimulation: sim,
  };
}

export function formatCatalog() {
  return PALETTE_ORDER.map((kind) => {
    const spec = CATALOG[kind];
    return {
      kind: spec.kind,
      label: spec.label,
      blurb: spec.blurb,
      defaults: {
        replicas: spec.replicas,
        rpsCapacity: spec.rpsCapacity,
        baseLatencyMs: spec.baseLatencyMs,
        hitRate: spec.hitRate ?? null,
      },
      rules: {
        maxInbound: spec.maxIn,
        maxOutbound: spec.maxOut,
      },
    };
  });
}