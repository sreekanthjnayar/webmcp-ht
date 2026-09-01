import type { Edge, Node } from "@xyflow/react";
import { CATALOG } from "./catalog";
import type { BlockData, BlockKind, EdgeData, Protocol } from "./types";

export type ArchNode = Node<BlockData>;
export type ArchEdge = Edge<EdgeData>;

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
  const srcSpec = CATALOG[src.data.kind];
  const tgtSpec = CATALOG[tgt.data.kind];
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