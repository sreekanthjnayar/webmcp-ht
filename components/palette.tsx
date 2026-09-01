"use client";

import { CATALOG, PALETTE_GROUPS } from "@/lib/catalog";
import { defaultAddPosition } from "@/lib/layout";
import { useArchitectureStore } from "@/lib/store";
import type { BlockKind } from "@/lib/types";
import { useRef } from "react";

export function Palette() {
  return (
    <aside className="flex h-full min-h-0 w-[212px] shrink-0 flex-col border-r border-[var(--line)] bg-[var(--panel)] max-md:h-auto max-md:w-full max-md:border-r-0 max-md:border-b">
      <div className="px-3 py-3">
        <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Blocks</div>
        <p className="mt-1 text-[11px] leading-snug text-[var(--muted)]">
          Click to add, or drag onto the canvas. Colors mark the block kind. Connect left to right.
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-2 pb-3 max-md:flex max-md:gap-6 max-md:overflow-x-auto">
        {PALETTE_GROUPS.map((group) => (
          <div key={group.title} className="mb-3 max-md:mb-0 max-md:min-w-[180px]">
            <div className="px-2 pb-1 text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
              {group.title}
            </div>
            <div className="space-y-0.5 max-md:flex max-md:gap-1">
              {group.kinds.map((kind) => (
                <PaletteTile key={kind} kind={kind} />
              ))}
            </div>
          </div>
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
        const preferred = defaultAddPosition(nodes);
        addNode(kind, preferred, { actor: "human" });
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
      className="flex w-full min-w-[160px] cursor-grab items-start gap-2 rounded-md border border-transparent px-2 py-1.5 text-left hover:bg-[var(--panel-2)] active:cursor-grabbing"
      style={{
        borderLeftWidth: 3,
        borderLeftColor: spec.accent,
      }}
    >
      <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: spec.accent }} />
      <span className="min-w-0">
        <span className="block text-[12px] text-[var(--text)]">{spec.label}</span>
        <span className="block text-[11px] leading-snug text-[var(--muted)]">{spec.short}</span>
      </span>
    </div>
  );
}
