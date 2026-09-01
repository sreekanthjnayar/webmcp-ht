export const BLOCK_KINDS = [
  "client",
  "dns",
  "waf",
  "cdn",
  "load_balancer",
  "api_gateway",
  "rate_limiter",
  "auth",
  "websocket_gateway",
  "api",
  "search",
  "ranker",
  "transcoder",
  "cache",
  "database",
  "read_replica",
  "object_store",
  "queue",
  "pubsub",
  "worker",
  "stream_processor",
  "notification",
] as const;

export type BlockKind = (typeof BLOCK_KINDS)[number];

export type Protocol = "sync" | "async";

export type FindingSeverity = "info" | "warn" | "error";

export interface Finding {
  id: string;
  source: "sim" | "agent" | "human";
  severity: FindingSeverity;
  message: string;
}

export interface BlockData {
  kind: BlockKind;
  label: string;
  replicas: number;
  /** Capacity per replica. `0` means unlimited (clients). */
  rpsCapacity: number;
  baseLatencyMs: number;
  hitRate?: number;
  locked?: boolean;
  findings: Finding[];
  [key: string]: unknown;
}

export interface EdgeData {
  protocol: Protocol;
  [key: string]: unknown;
}

export interface Slo {
  maxP99Ms: number;
  maxErrorRate: number;
  maxQueueLagMs?: number;
}

export interface SimNodeResult {
  incomingRps: number;
  processedRps: number;
  overflowRps: number;
  forwardedRps: number;
  utilization: number;
  addedLatencyMs: number;
  queueLagMs: number;
}

export interface SimEdgeResult {
  rps: number;
}

export type RobustnessGrade = "fragile" | "weak" | "fair" | "solid" | "hardy";

export interface RobustnessParts {
  slo: number;
  errors: number;
  latency: number;
  headroom: number;
  redundancy: number;
}

export interface RobustnessReport {
  score: number;
  grade: RobustnessGrade;
  headline: string;
  notes: string[];
  strengths: string[];
  parts: RobustnessParts;
}

export interface MetricDelta {
  label: string;
  before: string;
  after: string;
  direction: "better" | "worse" | "unchanged";
}

export interface RunDelta {
  scoreDelta: number;
  direction: "better" | "worse" | "unchanged";
  summary: string;
  metrics: MetricDelta[];
}

export interface SimResult {
  ingressRps: number;
  p99Ms: number;
  errorRate: number;
  maxQueueLagMs: number;
  hottestPath: string[];
  bottlenecks: string[];
  nodes: Record<string, SimNodeResult>;
  edges: Record<string, SimEdgeResult>;
  sloPassed: boolean;
  robustness: RobustnessReport;
  delta: RunDelta | null;
  error?: string;
}

export interface Challenge {
  id: string;
  title: string;
  subtitle: string;
  brief: string;
  constraints: string[];
  hints: string[];
  ingressRps: number;
  slo: Slo;
}