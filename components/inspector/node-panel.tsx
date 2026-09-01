import { NodeFields } from "@/components/inspector/node-fields";
import { NodeSimStats } from "@/components/inspector/node-sim-stats";
import type { KindSpec } from "@/lib/catalog";
import type { ArchNode } from "@/lib/graph";
import { useArchitectureStore } from "@/lib/store";
import type { SimResult } from "@/lib/types";

export function NodePanel({
  view,
  spec,
  broken,
  sim,
}: {
  view: ArchNode;
  spec: KindSpec;
  broken: boolean;
  sim: SimResult | null;
}) {
  const removeNode = useArchitectureStore((s) => s.removeNode);
  const stats = sim?.nodes[view.id];

  return (
    <section className="border-b border-[var(--line)] px-4 py-4">
      <div
        className="flex items-center gap-2 rounded-md px-2 py-1.5"
        style={{ background: `color-mix(in srgb, ${spec.accent} 16%, transparent)` }}
      >
        <span className="h-3.5 w-3.5 shrink-0 rounded-sm" style={{ background: spec.accent }} />
        <div className="text-[10px] uppercase tracking-[0.16em]" style={{ color: spec.accent }}>
          {spec.label}
        </div>
      </div>
      <h2 className="mt-1 text-sm text-[var(--text)]">{view.data.label}</h2>
      <p className="mt-1 font-mono text-[11px] text-[var(--muted)]">{view.id}</p>
      <p className="mt-2 text-[12px] leading-relaxed text-[var(--muted)]">{spec.blurb}</p>
      {broken ? (
        <div className="mt-3 rounded-md border border-[var(--fail)] px-3 py-2 text-[12px] text-[var(--fail)]">
          {view.data.findings[0]?.message ?? "This block is broken."}
          <button type="button" className="arch-btn mt-2 block" onClick={() => removeNode(view.id, "human")}>
            Remove broken block
          </button>
        </div>
      ) : (
        <NodeFields view={view} />
      )}
      {stats ? <NodeSimStats stats={stats} /> : null}
    </section>
  );
}
