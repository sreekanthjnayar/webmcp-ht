export type BlockKind =
  | "client"
  | "cdn"
  | "load_balancer"
  | "api"
  | "cache"
  | "queue"
  | "worker"
  | "database"
  | "object_store";

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