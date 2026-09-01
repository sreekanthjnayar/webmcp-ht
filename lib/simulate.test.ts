import { describe, expect, it } from "vitest";
import { challengeById } from "./challenges";
import { simulate } from "./simulate";
import type { ArchEdge, ArchNode } from "./graph";
import { CATALOG } from "./catalog";
import type { BlockData, BlockKind } from "./types";

function n(id: string, kind: BlockKind, replicas?: number, hitRate?: number): ArchNode {
  const spec = CATALOG[kind];
  const data: BlockData = {
    kind,
    label: spec.label,
    replicas: replicas ?? spec.replicas,
    rpsCapacity: spec.rpsCapacity,
    baseLatencyMs: spec.baseLatencyMs,
    hitRate: hitRate ?? spec.hitRate,
    findings: [],
  };
  return { id, type: "block", position: { x: 0, y: 0 }, data };
}

function e(from: string, to: string, protocol: "sync" | "async" = "sync"): ArchEdge {
  return { id: `${from}->${to}`, source: from, target: to, data: { protocol } };
}

describe("URL shortener challenge", () => {
  it("fails on the naive starter graph", () => {
    const c = challengeById("url-shortener");
    const sim = simulate(c.starter.nodes, c.starter.edges, c.ingressRps, c.slo);
    expect(sim.sloPassed).toBe(false);
    expect(sim.errorRate).toBeGreaterThan(c.slo.maxErrorRate);
    expect(sim.bottlenecks.length).toBeGreaterThan(0);
  });

  it("passes with CDN + cache in front of the database", () => {
    const c = challengeById("url-shortener");
    const nodes: ArchNode[] = [
      n("client-1", "client"),
      n("cdn-1", "cdn"),
      n("api-1", "api", 2),
      n("cache-1", "cache"),
      n("database-1", "database"),
    ];
    const edges: ArchEdge[] = [
      e("client-1", "cdn-1"),
      e("cdn-1", "api-1"),
      e("api-1", "cache-1"),
      e("cache-1", "database-1"),
    ];
    const sim = simulate(nodes, edges, c.ingressRps, c.slo);
    expect(sim.error).toBeUndefined();
    expect(sim.errorRate).toBeLessThanOrEqual(c.slo.maxErrorRate);
    expect(sim.p99Ms).toBeLessThanOrEqual(c.slo.maxP99Ms);
    expect(sim.sloPassed).toBe(true);
  });
});

describe("News feed challenge", () => {
  it("fails on the starter (LB + API + DB)", () => {
    const c = challengeById("news-feed");
    const sim = simulate(c.starter.nodes, c.starter.edges, c.ingressRps, c.slo);
    expect(sim.sloPassed).toBe(false);
  });

  it("passes with scaled CDN, cache, and API replicas", () => {
    const c = challengeById("news-feed");
    const nodes: ArchNode[] = [
      n("client-1", "client"),
      n("cdn-1", "cdn", 2),
      n("lb-1", "load_balancer"),
      n("api-1", "api", 10),
      n("cache-1", "cache"),
      n("database-1", "database"),
    ];
    const edges: ArchEdge[] = [
      e("client-1", "cdn-1"),
      e("cdn-1", "lb-1"),
      e("lb-1", "api-1"),
      e("api-1", "cache-1"),
      e("cache-1", "database-1"),
    ];
    const sim = simulate(nodes, edges, c.ingressRps, c.slo);
    expect(sim.sloPassed).toBe(true);
  });
});

describe("Realtime chat challenge", () => {
  it("fails when the database is on the sync path", () => {
    const c = challengeById("realtime-chat");
    const sim = simulate(c.starter.nodes, c.starter.edges, c.ingressRps, c.slo);
    expect(sim.sloPassed).toBe(false);
  });

  it("passes when a queue decouples writes and workers drain it", () => {
    const c = challengeById("realtime-chat");
    const nodes: ArchNode[] = [
      n("client-1", "client"),
      n("lb-1", "load_balancer"),
      n("api-1", "api", 4),
      n("queue-1", "queue"),
      n("worker-1", "worker", 6),
      n("database-1", "database", 4),
    ];
    const edges: ArchEdge[] = [
      e("client-1", "lb-1"),
      e("lb-1", "api-1"),
      e("api-1", "queue-1", "async"),
      e("queue-1", "worker-1", "async"),
      e("worker-1", "database-1", "sync"),
    ];
    const sim = simulate(nodes, edges, c.ingressRps, c.slo);
    expect(sim.maxQueueLagMs).toBeLessThanOrEqual(c.slo.maxQueueLagMs ?? Infinity);
    expect(sim.sloPassed).toBe(true);
  });
});

describe("Video streaming challenge", () => {
  it("fails when origin object storage serves every play-start", () => {
    const c = challengeById("video-streaming");
    const sim = simulate(c.starter.nodes, c.starter.edges, c.ingressRps, c.slo);
    expect(sim.sloPassed).toBe(false);
  });

  it("passes with a scaled CDN in front of origin", () => {
    const c = challengeById("video-streaming");
    const nodes: ArchNode[] = [
      n("client-1", "client"),
      n("cdn-1", "cdn", 2),
      n("api-1", "api", 8),
      n("cache-1", "cache"),
      n("object-store-1", "object_store"),
    ];
    const edges: ArchEdge[] = [
      e("client-1", "cdn-1"),
      e("cdn-1", "api-1"),
      e("api-1", "cache-1"),
      e("cache-1", "object-store-1"),
    ];
    const sim = simulate(nodes, edges, c.ingressRps, c.slo);
    expect(sim.sloPassed).toBe(true);
  });
});