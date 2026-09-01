"use client";

import { CATALOG, PALETTE_ORDER } from "@/lib/catalog";
import type { BlockKind } from "@/lib/types";

export function Palette() {
  return (
    <aside className="flex h-full min-h-0 w-[200px] shrink-0 flex-col border-r border-[var(--line)] bg-[var(--panel)] max-md:h-auto max-md:w-full max-md:border-r-0 max-md:border-b">
      <div className="px-3 py-3">
        <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Blocks</div>
        <p className="mt-1 text-[11px] leading-snug text-[var(--muted)]">
          Drag onto the canvas. Connect left to right.
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-2 pb-3 max-md:flex max-md:gap-2 max-md:overflow-x-auto md:space-y-1">
        {PALETTE_ORDER.map((kind) => (
          <PaletteTile key={kind} kind={kind} />
        ))}
      </div>
    </aside>
  );
}

function PaletteTile({ kind }: { kind: BlockKind }) {
  const spec = CATALOG[kind];
  return (
    <button
      type="button"
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("application/archflow-kind", kind);
        event.dataTransfer.effectAllowed = "move";
      }}
      className="flex w-full min-w-[160px] items-start gap-2 rounded-md border border-transparent px-2 py-2 text-left hover:border-[var(--line)] hover:bg-[var(--panel-2)]"
    >
      <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: spec.accent }} />
      <span className="min-w-0">
        <span className="block text-[12px] text-[var(--text)]">{spec.label}</span>
        <span className="block text-[11px] leading-snug text-[var(--muted)]">{spec.short}</span>
      </span>
    </button>
  );
}