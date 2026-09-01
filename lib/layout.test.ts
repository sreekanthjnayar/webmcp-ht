import { describe, expect, it } from "vitest";
import { challengeById } from "./challenges";
import { CATALOG } from "./catalog";
import type { ArchNode } from "./graph";
import { beside, findFreePosition, hasOverlaps, layoutLayers, NODE_H, NODE_W } from "./layout";
import type { BlockData, BlockKind } from "./types";

function n(id: string, kind: BlockKind, x: number, y: number): ArchNode {
  const spec = CATALOG[kind];
  const data: BlockData = {
    kind,
    label: spec.label,
    replicas: spec.replicas,
    rpsCapacity: spec.rpsCapacity,
    baseLatencyMs: spec.baseLatencyMs,
    hitRate: spec.hitRate,
    findings: [],
  };
  return { id, type: "block", position: { x, y }, data };
}

describe("layoutLayers", () => {
  it("places starter graphs without overlap", () => {
    const c = challengeById("url-shortener");
    const laid = layoutLayers(c.starter.nodes, c.starter.edges);
    expect(hasOverlaps(laid)).toBe(false);
    expect(laid[0].position.x).toBeLessThan(laid[1].position.x);
  });

  it("keeps challenge starters spaced apart before arrange", () => {
    for (const id of ["url-shortener", "news-feed", "realtime-chat", "video-streaming"] as const) {
      expect(hasOverlaps(challengeById(id).starter.nodes)).toBe(false);
    }
  });

  it("stacks overlapping nodes into columns by hop", () => {
    const nodes = [
      n("a", "client", 0, 0),
      n("b", "api", 10, 10),
      n("c", "database", 12, 12),
    ];
    const edges = [
      { id: "a-b", source: "a", target: "b", data: { protocol: "sync" as const } },
      { id: "b-c", source: "b", target: "c", data: { protocol: "sync" as const } },
    ];
    const laid = layoutLayers(nodes, edges);
    expect(hasOverlaps(laid)).toBe(false);
    const xs = laid.map((node) => node.position.x);
    expect(new Set(xs).size).toBe(3);
  });
});

describe("findFreePosition", () => {
  it("nudges a node off an occupied slot", () => {
    const existing = [n("a", "api", 0, 0)];
    const pos = findFreePosition(existing, { x: 0, y: 0 });
    expect(pos.y).toBeGreaterThanOrEqual(NODE_H);
  });

  it("does not land a near-node insert on top of the next hop", () => {
    const c = challengeById("url-shortener");
    const api = c.starter.nodes.find((node) => node.data.kind === "api")!;
    const pos = findFreePosition(c.starter.nodes, beside(api.position));
    const collision = c.starter.nodes.some((node) =>
      Math.abs(node.position.x - pos.x) < NODE_W && Math.abs(node.position.y - pos.y) < NODE_H,
    );
    expect(collision).toBe(false);
  });
});

describe("catalog accents", () => {
  it("gives every block kind a unique color", () => {
    const accents = Object.values(CATALOG).map((spec) => spec.accent.toLowerCase());
    expect(new Set(accents).size).toBe(accents.length);
  });
});
