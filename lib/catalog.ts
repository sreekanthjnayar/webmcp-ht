import type { BlockKind } from "./types";

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
    short: "Users / apps sending traffic into the system.",
    blurb: "Ingress. Emits the challenge’s request rate. No inbound edges.",
    replicas: 1,
    rpsCapacity: 0,
    baseLatencyMs: 0,
    maxIn: 0,
    maxOut: null,
    accent: "#c4b5a0",
  },
  cdn: {
    kind: "cdn",
    label: "CDN",
    short: "Edge cache close to users.",
    blurb: "Absorbs cache hits at the edge. Misses continue to origin.",
    replicas: 1,
    rpsCapacity: 50_000,
    baseLatencyMs: 18,
    hitRate: 0.8,
    maxIn: null,
    maxOut: null,
    accent: "#7eb8a8",
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
    accent: "#9aa4b2",
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
    accent: "#8fa4c4",
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
    accent: "#d4a056",
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
    accent: "#b39bc9",
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
    accent: "#9aaa6e",
  },
  database: {
    kind: "database",
    label: "Database",
    short: "Primary data store.",
    blurb: "Usually the bottleneck. Replicas here mean shards / read capacity in this toy model. No outbound edges.",
    replicas: 1,
    rpsCapacity: 2_000,
    baseLatencyMs: 24,
    maxIn: null,
    maxOut: 0,
    accent: "#c98980",
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
    accent: "#7f9ac9",
  },
};

export const PALETTE_ORDER: BlockKind[] = [
  "client",
  "cdn",
  "load_balancer",
  "api",
  "cache",
  "queue",
  "worker",
  "database",
  "object_store",
];

export function capacityOf(kind: BlockKind, replicas: number, rpsCapacity: number): number {
  if (kind === "client" || rpsCapacity <= 0) return Number.POSITIVE_INFINITY;
  return replicas * rpsCapacity;
}