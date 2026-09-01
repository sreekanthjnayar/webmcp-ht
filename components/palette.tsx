"use client";

import { useRef } from "react";
import { CATALOG, PALETTE_ORDER } from "@/lib/catalog";
import { useArchitectureStore } from "@/lib/store";
import type { BlockKind } from "@/lib/types";

export function Palette() {
  return (
    <aside className="flex h-full min-h-0 w-[200px] shrink-0 flex-col border-r border-[var(--line)] bg-[var(--panel)] max-md:h-auto max-md:w-full max-md:border-r-0 max-md:border-b">
      <div className="px-3 py-3">
        <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Blocks</div>
        <p className="mt-1 text-[11px] leading-snug text-[var(--muted)]">
          Click to add, or drag onto the canvas. Connect left to right.
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
  const addNode = useArchitectureStore((s) => s.addNode);
  const nodes = useArchitectureStore((s) => s.nodes);
  const dragged = useRef(false);

  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onClick={() => {
        if (dragged.current) {
          dragged.current = false;
          return;
        }
        const maxX = nodes.reduce((m, n) => Math.max(m, n.position.x), 40);
        const y = 80 + (nodes.length % 5) * 36;
        addNode(kind, { x: maxX + 240, y }, { actor: "human" });
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          (event.currentTarget as HTMLDivElement).click();
        }
      }}
      onDragStart={(event) => {
        dragged.current = true;
        event.dataTransfer.setData("application/archflow-kind", kind);
        event.dataTransfer.setData("text/plain", kind);
        event.dataTransfer.effectAllowed = "move";
      }}
      className="flex w-full min-w-[160px] cursor-grab items-start gap-2 rounded-md border border-transparent px-2 py-2 text-left hover:border-[var(--line)] hover:bg-[var(--panel-2)] active:cursor-grabbing"
    >
      <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: spec.accent }} />
      <span className="min-w-0">
        <span className="block text-[12px] text-[var(--text)]">{spec.label}</span>
        <span className="block text-[11px] leading-snug text-[var(--muted)]">{spec.short}</span>
      </span>
    </div>
  );
}
