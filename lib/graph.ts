import type { Edge, Node } from "@xyflow/react";
import { isBlockKind, specOf } from "./catalog";
import type { BlockData, BlockKind, EdgeData, Finding, Protocol } from "./types";

export type ArchNode = Node<BlockData>;
export type ArchEdge = Edge<EdgeData>;

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
    if (n.data && (n.data.replicas != null && !Number.isFinite(Number(n.data.replicas)))) {
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

export function wouldCreateCycle(
  nodes: ArchNode[],
  edges: ArchEdge[],
  from: string,
  to: string,
): boolean {
  const adj = new Map<string, string[]>();
  for (const n of nodes) adj.set(n.id, []);
  for (const e of edges) adj.get(e.source)?.push(e.target);
  adj.get(from)?.push(to);

  const seen = new Set<string>();
  const stack = [to];
  while (stack.length) {
    const cur = stack.pop()!;
    if (cur === from) return true;
    if (seen.has(cur)) continue;
    seen.add(cur);
    for (const next of adj.get(cur) ?? []) stack.push(next);
  }
  return false;
}

export function connectError(
  nodes: ArchNode[],
  edges: ArchEdge[],
  from: string,
  to: string,
): string | null {
  if (from === to) return "Cannot connect a block to itself.";
  const src = nodes.find((n) => n.id === from);
  const tgt = nodes.find((n) => n.id === to);
  if (!src || !tgt) return "Unknown block id. Call get_architecture for current ids.";
  if (isBrokenNode(src)) return `${from} is a broken block. Remove or repair it before connecting.`;
  if (isBrokenNode(tgt)) return `${to} is a broken block. Remove or repair it before connecting.`;
  const srcSpec = specOf(src.data.kind);
  const tgtSpec = specOf(tgt.data.kind);
  if (srcSpec.maxOut === 0) {
    return `${srcSpec.label} cannot have outbound edges.`;
  }
  if (tgtSpec.maxIn === 0) {
    return `${tgtSpec.label} cannot have inbound edges.`;
  }
  if (edges.some((e) => e.source === from && e.target === to)) {
    return "Those blocks are already connected.";
  }
  if (wouldCreateCycle(nodes, edges, from, to)) {
    return "That connection would create a cycle. Architectures must be a DAG.";
  }
  return null;
}

export function topologicalOrder(nodes: ArchNode[], edges: ArchEdge[]): string[] | null {
  const incoming = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const n of nodes) {
    incoming.set(n.id, 0);
    adj.set(n.id, []);
  }
  for (const e of edges) {
    if (!incoming.has(e.source) || !incoming.has(e.target)) continue;
    adj.get(e.source)!.push(e.target);
    incoming.set(e.target, (incoming.get(e.target) ?? 0) + 1);
  }
  const queue = [...incoming.entries()].filter(([, c]) => c === 0).map(([id]) => id);
  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    for (const next of adj.get(id) ?? []) {
      const left = (incoming.get(next) ?? 0) - 1;
      incoming.set(next, left);
      if (left === 0) queue.push(next);
    }
  }
  if (order.length !== nodes.length) return null;
  return order;
}

export function callTrees(nodes: ArchNode[], edges: ArchEdge[]): string[][] {
  const adj = new Map<string, string[]>();
  for (const n of nodes) adj.set(n.id, []);
  for (const e of edges) adj.get(e.source)?.push(e.target);
  const clients = nodes.filter((n) => n.data.kind === "client");
  const paths: string[][] = [];

  function walk(id: string, path: string[]) {
    const next = adj.get(id) ?? [];
    const here = [...path, id];
    if (next.length === 0) {
      paths.push(here);
      return;
    }
    for (const n of next) {
      if (path.includes(n)) continue;
      walk(n, here);
    }
  }

  for (const c of clients) walk(c.id, []);
  return paths;
}

export function defaultProtocol(targetKind: BlockKind): Protocol {
  return targetKind === "queue" || targetKind === "pubsub" || targetKind === "notification"
    ? "async"
    : "sync";
}

export function newBlockId(kind: BlockKind, existing: string[]): string {
  const prefix = kind.replaceAll("_", "-");
  let i = 1;
  while (existing.includes(`${prefix}-${i}`)) i += 1;
  return `${prefix}-${i}`;
}