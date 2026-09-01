import type { SimResult, Slo } from "./types";

export function evaluateSlo(
  sim: Pick<SimResult, "p99Ms" | "errorRate" | "maxQueueLagMs" | "error">,
  slo: Slo,
): boolean {
  if (sim.error) return false;
  if (sim.p99Ms > slo.maxP99Ms) return false;
  if (sim.errorRate > slo.maxErrorRate) return false;
  if (slo.maxQueueLagMs != null && sim.maxQueueLagMs > slo.maxQueueLagMs) return false;
  return true;
}