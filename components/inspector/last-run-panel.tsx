import { SectionLabel } from "@/components/ui/section-label";
import type { Challenge, SimResult } from "@/lib/types";

export function LastRunPanel({ sim, challenge }: { sim: SimResult | null; challenge: Challenge }) {
  return (
    <section className="border-b border-[var(--line)] px-4 py-4">
      <SectionLabel>Last run</SectionLabel>
      {sim ? (
        <dl className="mt-2 space-y-1 font-mono text-[12px]">
          <div className="flex justify-between">
            <dt className="text-[var(--muted)]">p99</dt>
            <dd>
              {Math.round(sim.p99Ms)} / {challenge.slo.maxP99Ms} ms
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--muted)]">errors</dt>
            <dd>
              {(sim.errorRate * 100).toFixed(1)}% / {(challenge.slo.maxErrorRate * 100).toFixed(0)}%
            </dd>
          </div>
          {challenge.slo.maxQueueLagMs != null ? (
            <div className="flex justify-between">
              <dt className="text-[var(--muted)]">queue lag</dt>
              <dd>
                {Math.round(sim.maxQueueLagMs)} / {challenge.slo.maxQueueLagMs} ms
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt className="text-[var(--muted)]">hottest path</dt>
            <dd className="max-w-[160px] truncate text-right">{sim.hottestPath.join(" → ") || "—"}</dd>
          </div>
          {sim.error ? <p className="pt-1 text-[var(--fail)]">{sim.error}</p> : null}
        </dl>
      ) : (
        <p className="mt-2 text-[12px] text-[var(--muted)]">Run the simulation to see utilization and packets.</p>
      )}
    </section>
  );
}
