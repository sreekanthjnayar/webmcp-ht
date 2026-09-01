import { isBlockKind, specOf } from "./catalog";
import type { ArchEdge, ArchNode } from "./graph-types";
import type { BlockData, BlockKind, Finding } from "./types";

export interface GraphIssue {
  severity: "error" | "warn";
  code: "unknown_kind" | "dangling_edge" | "missing_data" | "invalid_numbers" | "duplicate_id" | "missing_position";
  message: string;
  nodeId?: string;
  edgeId?: string;
}

export function finiteNumber(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function isBrokenNode(node: ArchNode | undefined | null): boolean {
  return !node || !isBlockKind(String(node.data?.kind ?? ""));
}

export function normalizeNode(raw: ArchNode): ArchNode {
  const data = (raw?.data ?? {}) as BlockData;
  const spec = specOf(data.kind);
  const kindKnown = isBlockKind(String(data.kind ?? ""));
  const findings: Finding[] = Array.isArray(data.findings) ? data.findings.filter(Boolean) : [];
  if (!kindKnown) {
    const message = `Unknown block kind "${String(data.kind ?? "") || "missing"}". Remove this node or replace it from the palette.`;
    if (!findings.some((f) => f.message === message)) {
      findings.unshift({ id: "broken-kind", source: "sim", severity: "error", message });
    }
  }
  const x = finiteNumber(raw?.position?.x, 48);
  const y = finiteNumber(raw?.position?.y, 64);
  const hit =
    data.hitRate == null && spec.hitRate == null
      ? undefined
      : Math.min(1, Math.max(0, finiteNumber(data.hitRate, spec.hitRate ?? 0)));
  return {
    ...raw,
    id: String(raw?.id || "broken"),
    type: raw?.type || "block",
    position: { x, y },
    data: {
      ...data,
      kind: kindKnown ? data.kind : (String(data.kind ?? "unknown") as BlockKind),
      label: typeof data.label === "string" && data.label.trim() ? data.label : spec.label,
      replicas: Math.max(1, Math.round(finiteNumber(data.replicas, spec.replicas))),
      rpsCapacity: Math.max(0, finiteNumber(data.rpsCapacity, spec.rpsCapacity)),
      baseLatencyMs: Math.max(0, finiteNumber(data.baseLatencyMs, spec.baseLatencyMs)),
      hitRate: hit,
      findings,
    },
  };
}

export function sanitizeGraph(
  nodes: ArchNode[] | undefined | null,
  edges: ArchEdge[] | undefined | null,
): { nodes: ArchNode[]; edges: ArchEdge[]; issues: GraphIssue[] } {
  const issues: GraphIssue[] = [];
  const seen = new Set<string>();
  const nextNodes: ArchNode[] = [];
  for (const n of nodes ?? []) {
    if (!n || n.id == null || String(n.id) === "") {
      issues.push({ severity: "error", code: "missing_data", message: "Dropped a node with no id." });
      continue;
    }
    if (seen.has(n.id)) {
      issues.push({
        severity: "error",
        code: "duplicate_id",
        message: `Duplicate id ${n.id} was skipped.`,
        nodeId: n.id,
      });
      continue;
    }
    seen.add(n.id);
    if (!n.position || !Number.isFinite(n.position.x) || !Number.isFinite(n.position.y)) {
      issues.push({
        severity: "warn",
        code: "missing_position",
        message: `Block ${n.id} was missing a canvas position.`,
        nodeId: n.id,
      });
    }
    if (n.data && n.data.replicas != null && !Number.isFinite(Number(n.data.replicas))) {
      issues.push({
        severity: "warn",
        code: "invalid_numbers",
        message: `Block ${n.id} had invalid replicas and was reset.`,
        nodeId: n.id,
      });
    }
    const next = normalizeNode(n);
    if (isBrokenNode(next)) {
      issues.push({
        severity: "error",
        code: "unknown_kind",
        message: `Block ${next.id} is broken (unknown kind "${String(next.data.kind)}").`,
        nodeId: next.id,
      });
    }
    nextNodes.push(next);
  }
  const ids = new Set(nextNodes.map((n) => n.id));
  const nextEdges: ArchEdge[] = [];
  for (const e of edges ?? []) {
    if (!e?.source || !e?.target) {
      issues.push({
        severity: "warn",
        code: "dangling_edge",
        message: "Dropped an edge with no endpoints.",
        edgeId: e?.id,
      });
      continue;
    }
    if (!ids.has(e.source) || !ids.has(e.target)) {
      issues.push({
        severity: "warn",
        code: "dangling_edge",
        message: `Dropped dangling edge ${e.source} → ${e.target}.`,
        edgeId: e.id,
      });
      continue;
    }
    nextEdges.push({
      ...e,
      type: e.type || "packet",
      data: { protocol: e.data?.protocol === "async" ? "async" : "sync" },
    });
  }
  return { nodes: nextNodes, edges: nextEdges, issues };
}

export function repairBrokenGraph(
  nodes: ArchNode[],
  edges: ArchEdge[],
): { nodes: ArchNode[]; edges: ArchEdge[]; removed: string[] } {
  const clean = sanitizeGraph(nodes, edges);
  const removed = clean.nodes.filter(isBrokenNode).map((n) => n.id);
  const kept = clean.nodes.filter((n) => !isBrokenNode(n));
  const ids = new Set(kept.map((n) => n.id));
  return {
    nodes: kept,
    edges: clean.edges.filter((e) => ids.has(e.source) && ids.has(e.target)),
    removed,
  };
}
