import { BLOCK_KINDS, type BlockKind } from "./types";

export interface KindSpec {
  kind: BlockKind;
  label: string;
  short: string;
  blurb: string;
  replicas: number;
  rpsCapacity: number;
  baseLatencyMs: number;
  hitRate?: number;
  maxIn: number | null;
  maxOut: number | null;
  accent: string;
}

export const CATALOG: Record<BlockKind, KindSpec> = {
  client: {
    kind: "client",
    label: "Client",
    short: "Users / apps sending traffic.",
    blurb: "Ingress. Emits the challenge’s request rate. No inbound edges.",
    replicas: 1,
    rpsCapacity: 0,
    baseLatencyMs: 0,
    maxIn: 0,
    maxOut: null,
    accent: "#e8c48a",
  },
  dns: {
    kind: "dns",
    label: "DNS",
    short: "Name lookup before the first hop.",
    blurb: "Tiny latency, huge capacity. Put it in front of the CDN or load balancer.",
    replicas: 1,
    rpsCapacity: 500_000,
    baseLatencyMs: 1,
    maxIn: null,
    maxOut: null,
    accent: "#5eead4",
  },
  waf: {
    kind: "waf",
    label: "WAF",
    short: "Web application firewall.",
    blurb: "Filters junk at the edge. High capacity, a few milliseconds. Does not absorb cacheable reads.",
    replicas: 1,
    rpsCapacity: 80_000,
    baseLatencyMs: 3,
    maxIn: null,
    maxOut: null,
    accent: "#fb923c",
  },
  cdn: {
    kind: "cdn",
    label: "CDN",
    short: "Edge cache close to users.",
    blurb: "Absorbs cache hits at the edge. Misses continue to origin. Scale replicas for large read loads.",
    replicas: 1,
    rpsCapacity: 50_000,
    baseLatencyMs: 18,
    hitRate: 0.8,
    maxIn: null,
    maxOut: null,
    accent: "#22d3ee",
  },
  load_balancer: {
    kind: "load_balancer",
    label: "Load balancer",
    short: "Spreads traffic across services.",
    blurb: "High capacity, tiny latency. Splits evenly across outgoing edges.",
    replicas: 1,
    rpsCapacity: 100_000,
    baseLatencyMs: 2,
    maxIn: null,
    maxOut: null,
    accent: "#38bdf8",
  },
  api_gateway: {
    kind: "api_gateway",
    label: "API gateway",
    short: "Edge routing, TLS, fan-in.",
    blurb: "One front door for many services. Cheaper than putting every client on a specific API.",
    replicas: 2,
    rpsCapacity: 20_000,
    baseLatencyMs: 4,
    maxIn: null,
    maxOut: null,
    accent: "#818cf8",
  },
  rate_limiter: {
    kind: "rate_limiter",
    label: "Rate limiter",
    short: "Sheds excess as 429s.",
    blurb: "Protects downstream by dropping overflow here. Capacity is the allowed RPS. Raise replicas to admit more.",
    replicas: 2,
    rpsCapacity: 8_000,
    baseLatencyMs: 2,
    maxIn: null,
    maxOut: null,
    accent: "#fbbf24",
  },
  auth: {
    kind: "auth",
    label: "Auth",
    short: "Session / token checks.",
    blurb: "Extra hop on the request path. Pair with a cache for session hits, or it becomes a bottleneck.",
    replicas: 2,
    rpsCapacity: 3_000,
    baseLatencyMs: 8,
    maxIn: null,
    maxOut: null,
    accent: "#c084fc",
  },
  websocket_gateway: {
    kind: "websocket_gateway",
    label: "WebSocket gateway",
    short: "Sticky realtime connections.",
    blurb: "Holds client connections for chat and live updates. High connection rate, low per-message latency.",
    replicas: 2,
    rpsCapacity: 12_000,
    baseLatencyMs: 5,
    maxIn: null,
    maxOut: null,
    accent: "#2dd4bf",
  },
  api: {
    kind: "api",
    label: "API / service",
    short: "Application or business-logic tier.",
    blurb: "Capacity is replicas × RPS per replica. Overflow becomes errors.",
    replicas: 2,
    rpsCapacity: 2_000,
    baseLatencyMs: 15,
    maxIn: null,
    maxOut: null,
    accent: "#60a5fa",
  },
  search: {
    kind: "search",
    label: "Search index",
    short: "Elasticsearch / OpenSearch.",
    blurb: "Query-heavy, slower than a cache. Keep it off the default read path when you can.",
    replicas: 2,
    rpsCapacity: 4_000,
    baseLatencyMs: 35,
    maxIn: null,
    maxOut: 0,
    accent: "#34d399",
  },
  ranker: {
    kind: "ranker",
    label: "Ranker",
    short: "ML / feed ranking.",
    blurb: "Scores items for a news feed. Limited RPS; cache ranked results or it will melt under read load.",
    replicas: 2,
    rpsCapacity: 2_500,
    baseLatencyMs: 22,
    maxIn: null,
    maxOut: null,
    accent: "#fb7185",
  },
  transcoder: {
    kind: "transcoder",
    label: "Transcoder",
    short: "Video encode / transmux.",
    blurb: "Slow, expensive workers. Park them behind a queue so playback never waits on encode.",
    replicas: 2,
    rpsCapacity: 400,
    baseLatencyMs: 80,
    maxIn: null,
    maxOut: null,
    accent: "#a3e635",
  },
  cache: {
    kind: "cache",
    label: "Cache",
    short: "In-memory store (Redis, Memcached).",
    blurb: "Hits never reach the origin. Put it in front of the database, not beside it.",
    replicas: 1,
    rpsCapacity: 30_000,
    baseLatencyMs: 4,
    hitRate: 0.9,
    maxIn: null,
    maxOut: null,
    accent: "#f59e0b",
  },
  database: {
    kind: "database",
    label: "Database",
    short: "Primary data store.",
    blurb: "Usually the bottleneck. Replicas here mean shards / write capacity in this toy model. No outbound edges.",
    replicas: 1,
    rpsCapacity: 2_000,
    baseLatencyMs: 24,
    maxIn: null,
    maxOut: 0,
    accent: "#f43f5e",
  },
  read_replica: {
    kind: "read_replica",
    label: "Read replica",
    short: "Read-only copy of the primary.",
    blurb: "Takes read traffic off the primary. Still a sink. Size replicas to the leftover miss rate after caches.",
    replicas: 2,
    rpsCapacity: 4_000,
    baseLatencyMs: 18,
    maxIn: null,
    maxOut: 0,
    accent: "#e11d48",
  },
  object_store: {
    kind: "object_store",
    label: "Object store",
    short: "Blob storage (S3, GCS).",
    blurb: "High capacity, higher latency. Origin for media. No outbound edges.",
    replicas: 1,
    rpsCapacity: 20_000,
    baseLatencyMs: 70,
    maxIn: null,
    maxOut: 0,
    accent: "#6366f1",
  },
  queue: {
    kind: "queue",
    label: "Queue",
    short: "Buffer (Kafka, SQS, RabbitMQ).",
    blurb: "Accepts all traffic. Lag grows if workers cannot drain it. Incoming edges are async.",
    replicas: 1,
    rpsCapacity: 100_000,
    baseLatencyMs: 1,
    maxIn: null,
    maxOut: null,
    accent: "#a78bfa",
  },
  pubsub: {
    kind: "pubsub",
    label: "Pub/sub",
    short: "Fan-out to many subscribers.",
    blurb: "Every outgoing edge gets the full message rate (not a split). Use for chat delivery and notifications. Incoming edges are async.",
    replicas: 1,
    rpsCapacity: 80_000,
    baseLatencyMs: 2,
    maxIn: null,
    maxOut: null,
    accent: "#e879f9",
  },
  worker: {
    kind: "worker",
    label: "Worker",
    short: "Async consumer / job runner.",
    blurb: "Drains a queue. Size these to the write rate you actually persist.",
    replicas: 2,
    rpsCapacity: 1_000,
    baseLatencyMs: 28,
    maxIn: null,
    maxOut: null,
    accent: "#84cc16",
  },
  stream_processor: {
    kind: "stream_processor",
    label: "Stream processor",
    short: "Flink / Spark-style consumer.",
    blurb: "Reads a queue or pub/sub and writes derived data. Throughput-oriented, not on the user ack path.",
    replicas: 2,
    rpsCapacity: 2_000,
    baseLatencyMs: 20,
    maxIn: null,
    maxOut: null,
    accent: "#14b8a6",
  },
  notification: {
    kind: "notification",
    label: "Notification",
    short: "Email, push, SMS sink.",
    blurb: "Terminal fan-out. Should sit behind pub/sub, not on the request path. No outbound edges.",
    replicas: 2,
    rpsCapacity: 8_000,
    baseLatencyMs: 40,
    maxIn: null,
    maxOut: 0,
    accent: "#f472b6",
  },
};

export const PALETTE_GROUPS: { title: string; kinds: BlockKind[] }[] = [
  {
    title: "Edge",
    kinds: ["client", "dns", "waf", "cdn", "load_balancer", "api_gateway", "rate_limiter"],
  },
  {
    title: "App",
    kinds: ["auth", "websocket_gateway", "api", "search", "ranker", "transcoder"],
  },
  {
    title: "Data",
    kinds: ["cache", "database", "read_replica", "object_store"],
  },
  {
    title: "Async",
    kinds: ["queue", "pubsub", "worker", "stream_processor", "notification"],
  },
];

export const PALETTE_ORDER: BlockKind[] = PALETTE_GROUPS.flatMap((g) => g.kinds);

const KIND_SET = new Set<string>(BLOCK_KINDS);
export function isBlockKind(value: string): value is BlockKind {
  return KIND_SET.has(value);
}

export function capacityOf(kind: BlockKind, replicas: number, rpsCapacity: number): number {
  if (kind === "client" || rpsCapacity <= 0) return Number.POSITIVE_INFINITY;
  return replicas * rpsCapacity;
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