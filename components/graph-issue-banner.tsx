import type { GraphIssue } from "@/lib/graph";
import { useArchitectureStore } from "@/lib/store";
import type { RunDelta } from "@/lib/types";

export function GraphIssueBanner({ issues }: { issues: GraphIssue[] }) {
  const repairGraph = useArchitectureStore((s) => s.repairGraph);
  if (!issues.length) return null;
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--fail)] px-4 py-1.5 text-[12px] text-[var(--fail)]">
      <span>
        {issues.length} graph issue{issues.length === 1 ? "" : "s"}: {issues[0].message}
        {issues.length > 1 ? ` (+${issues.length - 1} more)` : ""}
      </span>
      <button type="button" className="arch-btn" onClick={() => repairGraph("human")}>
        Repair graph
      </button>
    </div>
  );
}

export function RunDeltaBanner({ delta }: { delta: RunDelta | null | undefined }) {
  if (!delta) return null;
  const tone =
    delta.direction === "better"
      ? "text-[var(--ok)]"
      : delta.direction === "worse"
        ? "text-[var(--fail)]"
        : "text-[var(--muted)]";
  return (
    <div className={`shrink-0 border-b border-[var(--line)] px-4 py-1.5 text-[12px] ${tone}`}>{delta.summary}</div>
  );
}
