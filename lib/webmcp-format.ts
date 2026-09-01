import { CATALOG, PALETTE_GROUPS, PALETTE_ORDER } from "./catalog";
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
      selected: false,
      message: "No block is selected. Ask the human to click a node on the canvas, then call get_selected_node again.",
    };
  }
  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) {
    return {
      selected: false,
      message: `Selection ${selectedNodeId} is no longer on the canvas.`,
    };
  }
  const spec = CATALOG[node.data.kind];
  const group = PALETTE_GROUPS.find((g) => g.kinds.includes(node.data.kind));
  const incoming = edges.filter((e) => e.target === node.id);
  const outgoing = edges.filter((e) => e.source === node.id);
  return {
    selected: true,
    node: {
      id: node.id,
      kind: node.data.kind,
      label: node.data.label,
      replicas: node.data.replicas,
      rpsCapacity: node.data.rpsCapacity,
      capacity:
        node.data.kind === "client" || node.data.rpsCapacity <= 0
          ? "unlimited"
          : node.data.replicas * node.data.rpsCapacity,
      baseLatencyMs: node.data.baseLatencyMs,
      hitRate: node.data.hitRate ?? null,
      locked: Boolean(node.data.locked),
      findings: node.data.findings,
      position: node.position,
    },
    meaning: {
      kind: spec.kind,
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
    simulation: sim?.nodes[node.id] ?? null,
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