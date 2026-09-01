import { CATALOG, PALETTE_GROUPS, PALETTE_ORDER, specOf } from "./catalog";
import { callTrees, isBrokenNode, normalizeNode, sanitizeGraph, type ArchEdge, type ArchNode } from "./graph";
import type { Challenge, SimResult } from "./types";

export function formatArchitecture(
  challenge: Challenge,
  nodes: ArchNode[],
  edges: ArchEdge[],
  sim: SimResult | null,
) {
  const graph = sanitizeGraph(nodes, edges);
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
    nodes: graph.nodes.map((n) => ({
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
      broken: isBrokenNode(n),
    })),
    edges: graph.edges.map((e) => ({
      id: e.id,
      from: e.source,
      to: e.target,
      protocol: e.data?.protocol ?? "sync",
    })),
    callTrees: callTrees(graph.nodes, graph.edges),
    issues: graph.issues,
    lastSimulation: sim,
  };
}

function ruleText(max: number | null, direction: "incoming" | "outgoing"): string {
  if (max === 0) return `No ${direction} edges.`;
  if (max == null) return `Any number of ${direction} edges.`;
  return `At most ${max} ${direction} edge${max === 1 ? "" : "s"}.`;
}

/** The block the human has selected, plus catalog meaning so an agent can explain it. */
export function formatSelectedNode(
  nodes: ArchNode[],
  edges: ArchEdge[],
  selectedNodeId: string | null,
  sim: SimResult | null,
) {
  if (!selectedNodeId) {
    return {
      selected: false as const,
      message: "No block is selected. Ask the human to click a node on the canvas, then call get_selected_node again.",
    };
  }
  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) {
    return {
      selected: false as const,
      message: `Selection ${selectedNodeId} is no longer on the canvas.`,
    };
  }
  const view = normalizeNode(node);
  const spec = specOf(view.data.kind);
  const group = PALETTE_GROUPS.find((g) => g.kinds.includes(view.data.kind as (typeof g.kinds)[number]));
  const incoming = edges.filter((e) => e.target === view.id);
  const outgoing = edges.filter((e) => e.source === view.id);
  return {
    selected: true as const,
    node: {
      id: view.id,
      kind: view.data.kind,
      label: view.data.label,
      replicas: view.data.replicas,
      rpsCapacity: view.data.rpsCapacity,
      capacity:
        view.data.kind === "client" || view.data.rpsCapacity <= 0
          ? "unlimited"
          : view.data.replicas * view.data.rpsCapacity,
      baseLatencyMs: view.data.baseLatencyMs,
      hitRate: view.data.hitRate ?? null,
      locked: Boolean(view.data.locked),
      findings: view.data.findings,
      position: view.position,
      broken: isBrokenNode(view),
    },
    meaning: {
      kind: view.data.kind,
      label: spec.label,
      group: group?.title ?? "Other",
      short: spec.short,
      blurb: spec.blurb,
      inbound: ruleText(spec.maxIn, "incoming"),
      outbound: ruleText(spec.maxOut, "outgoing"),
      absorbsHits: spec.hitRate != null,
      defaultHitRate: spec.hitRate ?? null,
    },
    neighbors: {
      incoming: incoming.map((e) => ({
        edgeId: e.id,
        from: e.source,
        protocol: e.data?.protocol ?? "sync",
      })),
      outgoing: outgoing.map((e) => ({
        edgeId: e.id,
        to: e.target,
        protocol: e.data?.protocol ?? "sync",
      })),
    },
    simulation: sim?.nodes[view.id] ?? null,
  };
}

export function formatCatalog() {
  return {
    groups: PALETTE_GROUPS.map((g) => g.title),
    blocks: PALETTE_ORDER.map((kind) => {
      const spec = CATALOG[kind];
      return {
        kind: spec.kind,
        label: spec.label,
        group: PALETTE_GROUPS.find((g) => g.kinds.includes(kind))?.title ?? "Other",
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
    }),
  };
}