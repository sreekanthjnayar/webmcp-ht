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
      <div className="arch-scroll min-h-0 flex-1 px-2 pb-4 max-md:flex max-md:gap-6">
        {PALETTE_GROUPS.map((group) => (
          <div key={group.title} className="mb-5 max-md:mb-0 max-md:min-w-[180px]">
            <div className="px-2 pb-2 pt-1 text-[10px] uppercase tracking-[0.14em]" style={{ color: group.accent }}>
              {group.title}
            </div>
            <div className="flex flex-col gap-2.5 max-md:flex-row max-md:gap-2">
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
      className="flex w-full min-w-[160px] cursor-grab items-start gap-2 rounded-md px-2 py-2.5 text-left hover:brightness-110 active:cursor-grabbing"
      style={{
        background: `color-mix(in srgb, ${spec.accent} 12%, transparent)`,
        boxShadow: `inset 3px 0 0 ${spec.accent}`,
      }}
    >
      <span
        className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-sm"
        style={{ background: spec.accent }}
      />
      <span className="min-w-0">
        <span className="block text-[12px] text-[var(--text)]">{spec.label}</span>
        <span className="block text-[11px] leading-snug text-[var(--muted)]">{spec.short}</span>
      </span>
    </div>
  );
}
