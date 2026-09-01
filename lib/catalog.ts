import { BLOCK_KINDS, type BlockKind } from "./types";
import { CATALOG, type KindSpec } from "./catalog-specs";

export type { KindSpec };
export { CATALOG };

export const PALETTE_GROUPS: { title: string; accent: string; kinds: BlockKind[] }[] = [
  {
    title: "Edge",
    accent: "#22d3ee",
    kinds: ["client", "dns", "waf", "cdn", "load_balancer", "api_gateway", "rate_limiter"],
  },
  {
    title: "App",
    accent: "#60a5fa",
    kinds: ["auth", "websocket_gateway", "api", "search", "ranker", "transcoder"],
  },
  {
    title: "Data",
    accent: "#f59e0b",
    kinds: ["cache", "database", "read_replica", "object_store"],
  },
  {
    title: "Async",
    accent: "#a78bfa",
    kinds: ["queue", "pubsub", "worker", "stream_processor", "notification"],
  },
];

export const PALETTE_ORDER: BlockKind[] = PALETTE_GROUPS.flatMap((g) => g.kinds);

export const BROKEN_ACCENT = "#e07070";

const BROKEN_SPEC: KindSpec = {
  kind: "api",
  label: "Broken",
  short: "Unknown or corrupt block.",
  blurb: "This block is not in the catalog. Remove it and add a valid block from the palette.",
  replicas: 1,
  rpsCapacity: 0,
  baseLatencyMs: 0,
  maxIn: null,
  maxOut: null,
  accent: BROKEN_ACCENT,
};

const KIND_SET = new Set<string>(BLOCK_KINDS);
export function isBlockKind(value: string): value is BlockKind {
  return KIND_SET.has(value);
}

/** Catalog entry for a kind, or a red fallback that never throws. */
export function specOf(kind: unknown): KindSpec {
  return typeof kind === "string" && isBlockKind(kind) ? CATALOG[kind] : BROKEN_SPEC;
}

export function capacityOf(kind: string, replicas: number, rpsCapacity: number): number {
  if (!isBlockKind(kind)) return 0;
  if (kind === "client" || rpsCapacity <= 0) return Number.POSITIVE_INFINITY;
  const copies = Number.isFinite(replicas) ? Math.max(1, replicas) : 1;
  const per = Number.isFinite(rpsCapacity) ? Math.max(0, rpsCapacity) : 0;
  return copies * per;
}

export function isCacheKind(kind: BlockKind): boolean {
  return kind === "cdn" || kind === "cache";
}

export function isBufferKind(kind: BlockKind): boolean {
  return kind === "queue" || kind === "pubsub";
}

export function isFanoutKind(kind: BlockKind): boolean {
  return kind === "pubsub";
}

export function isStatefulKind(kind: BlockKind): boolean {
  return kind === "database" || kind === "object_store" || kind === "search" || kind === "read_replica";
}
