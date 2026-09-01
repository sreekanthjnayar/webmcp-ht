import type { ArchNode } from "@/lib/graph";
import { useArchitectureStore } from "@/lib/store";

export function NodeFields({ view }: { view: ArchNode }) {
  const setNodeProps = useArchitectureStore((s) => s.setNodeProps);

  return (
    <>
      <label className="mt-4 block text-[11px] text-[var(--muted)]">
        Name
        <input
          className="arch-input mt-1"
          value={view.data.label}
          onChange={(e) => setNodeProps(view.id, { label: e.target.value }, "human")}
        />
      </label>

      {view.data.kind !== "client" ? (
        <label className="mt-3 block text-[11px] text-[var(--muted)]">
          Replicas
          <input
            className="arch-input mt-1"
            type="number"
            min={1}
            max={32}
            value={view.data.replicas}
            onChange={(e) => setNodeProps(view.id, { replicas: Number(e.target.value) }, "human")}
          />
        </label>
      ) : null}

      {view.data.kind !== "client" ? (
        <label className="mt-3 block text-[11px] text-[var(--muted)]">
          RPS per replica
          <input
            className="arch-input mt-1"
            type="number"
            min={100}
            step={100}
            value={view.data.rpsCapacity}
            onChange={(e) => setNodeProps(view.id, { rpsCapacity: Number(e.target.value) }, "human")}
          />
        </label>
      ) : null}

      {view.data.hitRate != null ? (
        <label className="mt-3 block text-[11px] text-[var(--muted)]">
          Hit rate {(view.data.hitRate * 100).toFixed(0)}%
          <input
            className="mt-2 w-full accent-[var(--accent)]"
            type="range"
            min={0.5}
            max={0.99}
            step={0.01}
            value={view.data.hitRate}
            onChange={(e) => setNodeProps(view.id, { hitRate: Number(e.target.value) }, "human")}
          />
        </label>
      ) : null}

      <label className="mt-4 flex items-center gap-2 text-[12px] text-[var(--text)]">
        <input
          type="checkbox"
          checked={Boolean(view.data.locked)}
          onChange={(e) => setNodeProps(view.id, { locked: e.target.checked }, "human")}
        />
        Lock (agent cannot change)
      </label>
    </>
  );
}
