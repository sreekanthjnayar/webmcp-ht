import { describe, expect, it } from "vitest";
import { CATALOG, specOf } from "./catalog";
import {
  connectError,
  isBrokenNode,
  normalizeNode,
  repairBrokenGraph,
  sanitizeGraph,
  type ArchEdge,
  type ArchNode,
} from "./graph";
import type { BlockData, BlockKind } from "./types";

function n(id: string, kind: BlockKind): ArchNode {
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
  return { id, type: "block", position: { x: 10, y: 10 }, data };
}

describe("broken nodes", () => {
  it("specOf never throws for unknown kinds", () => {
    expect(specOf("not-a-block").label).toBe("Broken");
    expect(specOf(undefined).accent).toBe("#e07070");
  });

  it("normalizes missing findings and NaN replicas", () => {
    const raw = {
      id: "api-1",
      type: "block",
      position: { x: Number.NaN, y: 8 },
      data: { kind: "api", label: "API", replicas: Number.NaN, rpsCapacity: 2000, baseLatencyMs: 15 },
    } as unknown as ArchNode;
    const next = normalizeNode(raw);
    expect(next.data.replicas).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(next.data.findings)).toBe(true);
    expect(Number.isFinite(next.position.x)).toBe(true);
  });

  it("flags unknown kinds and drops dangling edges", () => {
    const nodes: ArchNode[] = [
      n("client-1", "client"),
      {
        id: "ghost-1",
        type: "block",
        position: { x: 40, y: 40 },
        data: {
          kind: "spaceship" as BlockKind,
          label: "UFO",
          replicas: 1,
          rpsCapacity: 10,
          baseLatencyMs: 1,
          findings: [],
        },
      },
    ];
    const edges: ArchEdge[] = [
      { id: "ok", source: "client-1", target: "ghost-1", data: { protocol: "sync" } },
      { id: "dangling", source: "client-1", target: "missing", data: { protocol: "sync" } },
    ];
    const { nodes: next, edges: kept, issues } = sanitizeGraph(nodes, edges);
    expect(next).toHaveLength(2);
    expect(isBrokenNode(next[1])).toBe(true);
    expect(kept.map((e) => e.id)).toEqual(["ok"]);
    expect(issues.some((i) => i.code === "unknown_kind")).toBe(true);
    expect(issues.some((i) => i.code === "dangling_edge")).toBe(true);
  });

  it("refuses to connect through a broken block", () => {
    const nodes: ArchNode[] = [
      n("client-1", "client"),
      {
        id: "ghost-1",
        type: "block",
        position: { x: 40, y: 40 },
        data: {
          kind: "spaceship" as BlockKind,
          label: "UFO",
          replicas: 1,
          rpsCapacity: 10,
          baseLatencyMs: 1,
          findings: [],
        },
      },
    ];
    expect(connectError(nodes, [], "client-1", "ghost-1")).toMatch(/broken/i);
  });

  it("repair removes unknown kinds and dangling edges", () => {
    const nodes: ArchNode[] = [
      n("client-1", "client"),
      {
        id: "ghost-1",
        type: "block",
        position: { x: 40, y: 40 },
        data: {
          kind: "spaceship" as BlockKind,
          label: "UFO",
          replicas: 1,
          rpsCapacity: 10,
          baseLatencyMs: 1,
          findings: [],
        },
      },
    ];
    const { nodes: next, removed } = repairBrokenGraph(nodes, [
      { id: "dangle", source: "client-1", target: "nope", data: { protocol: "sync" } },
    ]);
    expect(removed).toEqual(["ghost-1"]);
    expect(next.map((n) => n.id)).toEqual(["client-1"]);
  });
});
