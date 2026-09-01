import type { ArchEdge, ArchNode } from "./graph";

export const NODE_W = 220;
export const NODE_H = 124;
export const GAP_X = 96;
export const GAP_Y = 52;
export const ORIGIN_X = 48;
export const ORIGIN_Y = 64;

export function boxesOverlap(
  a: { x: number; y: number },
  b: { x: number; y: number },
  pad = 20,
): boolean {
  return !(
    a.x + NODE_W + pad <= b.x ||
    b.x + NODE_W + pad <= a.x ||
    a.y + NODE_H + pad <= b.y ||
    b.y + NODE_H + pad <= a.y
  );
}

export function beside(position: { x: number; y: number }): { x: number; y: number } {
  return { x: position.x + NODE_W + GAP_X, y: position.y };
}

export function defaultAddPosition(nodes: ArchNode[]): { x: number; y: number } {
  if (nodes.length === 0) return { x: ORIGIN_X, y: ORIGIN_Y };
  const maxX = nodes.reduce((m, n) => Math.max(m, n.position.x), ORIGIN_X);
  return { x: maxX + NODE_W + GAP_X, y: ORIGIN_Y };
}

export function findFreePosition(
  nodes: ArchNode[],
  preferred: { x: number; y: number },
  ignoreId?: string,
): { x: number; y: number } {
  const others = nodes.filter((n) => n.id !== ignoreId);
  let x = preferred.x;
  let y = preferred.y;
  for (let i = 0; i < 48; i++) {
    if (!others.some((n) => boxesOverlap({ x, y }, n.position))) {
      return { x, y };
    }
    y += NODE_H + GAP_Y;
    if (i > 0 && i % 6 === 0) {
      x += NODE_W + GAP_X;
      y = preferred.y;
    }
  }
  return { x, y };
}

function hopRanks(nodes: ArchNode[], edges: ArchEdge[]): Map<string, number> {
  const rank = new Map<string, number>();
  for (const n of nodes) rank.set(n.id, 0);
  const known = new Set(nodes.map((n) => n.id));
  const usable = edges.filter((e) => known.has(e.source) && known.has(e.target));
  for (let i = 0; i < nodes.length; i++) {
    for (const e of usable) {
      rank.set(e.target, Math.max(rank.get(e.target) ?? 0, (rank.get(e.source) ?? 0) + 1));
    }
  }
  return rank;
}

function placeColumn(nodes: ArchNode[], column: number, laid: ArchNode[]) {
  const col = nodes.slice().sort((a, b) => a.position.y - b.position.y);
  const totalH = col.length * NODE_H + Math.max(0, col.length - 1) * GAP_Y;
  let y = Math.max(ORIGIN_Y, ORIGIN_Y + (240 - totalH) / 2);
  const x = ORIGIN_X + column * (NODE_W + GAP_X);
  for (const n of col) {
    laid.push({ ...n, position: { x, y } });
    y += NODE_H + GAP_Y;
  }
}

/** Pack a DAG into hop columns so request-path layers don't sit on top of each other. */
export function layoutLayers(nodes: ArchNode[], edges: ArchEdge[]): ArchNode[] {
  if (nodes.length === 0) return nodes;

  const known = new Set(nodes.map((n) => n.id));
  const usable = edges.filter((e) => known.has(e.source) && known.has(e.target));

  if (usable.length === 0) {
    return nodes.map((n, i) => ({
      ...n,
      position: {
        x: ORIGIN_X + (i % 4) * (NODE_W + GAP_X),
        y: ORIGIN_Y + Math.floor(i / 4) * (NODE_H + GAP_Y),
      },
    }));
  }

  const rank = hopRanks(nodes, edges);
  const connected = new Set<string>();
  for (const e of usable) {
    connected.add(e.source);
    connected.add(e.target);
  }

  const columns = new Map<number, ArchNode[]>();
  const floating: ArchNode[] = [];
  for (const n of nodes) {
    if (!connected.has(n.id)) {
      floating.push(n);
      continue;
    }
    const r = rank.get(n.id) ?? 0;
    const col = columns.get(r) ?? [];
    col.push(n);
    columns.set(r, col);
  }

  const orderedRanks = [...columns.keys()].sort((a, b) => a - b);
  const laid: ArchNode[] = [];
  orderedRanks.forEach((r, index) => {
    placeColumn(columns.get(r) ?? [], index, laid);
  });
  if (floating.length) {
    placeColumn(floating, orderedRanks.length, laid);
  }
  return laid;
}

export function hasOverlaps(nodes: ArchNode[]): boolean {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (boxesOverlap(nodes[i].position, nodes[j].position, 8)) return true;
    }
  }
  return false;
}
