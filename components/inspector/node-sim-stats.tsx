import type { SimNodeResult } from "@/lib/types";

export function NodeSimStats({ stats }: { stats: SimNodeResult }) {
  return (
    <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 font-mono text-[11px]">
      <dt className="text-[var(--muted)]">In</dt>
      <dd>{Math.round(stats.incomingRps).toLocaleString()} rps</dd>
      <dt className="text-[var(--muted)]">Drop</dt>
      <dd>{Math.round(stats.overflowRps).toLocaleString()} rps</dd>
      <dt className="text-[var(--muted)]">Util</dt>
      <dd>{Math.round(stats.utilization * 100)}%</dd>
      <dt className="text-[var(--muted)]">Added</dt>
      <dd>{stats.addedLatencyMs.toFixed(1)} ms</dd>
      {stats.queueLagMs > 0 ? (
        <>
          <dt className="text-[var(--muted)]">Lag</dt>
          <dd>{Math.round(stats.queueLagMs)} ms</dd>
        </>
      ) : null}
    </dl>
  );
}
