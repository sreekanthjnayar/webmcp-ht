"use client";

import { ActivityPanel } from "@/components/inspector/activity-panel";
import { ChallengePanel } from "@/components/inspector/challenge-panel";
import { LastRunPanel } from "@/components/inspector/last-run-panel";
import { NodePanel } from "@/components/inspector/node-panel";
import { RobustnessSection } from "@/components/inspector/robustness-panel";
import { specOf } from "@/lib/catalog";
import { isBrokenNode, normalizeNode } from "@/lib/graph";
import { useArchitectureStore } from "@/lib/store";
import { useState } from "react";

export function Inspector() {
  const [open, setOpen] = useState(true);
  const selectedId = useArchitectureStore((s) => s.selectedNodeId);
  const node = useArchitectureStore((s) => s.nodes.find((n) => n.id === selectedId) ?? null);
  const challenge = useArchitectureStore((s) => s.challenge());
  const sim = useArchitectureStore((s) => s.sim);
  const view = node ? normalizeNode(node) : null;
  const spec = view ? specOf(view.data.kind) : null;
  const broken = view ? isBrokenNode(view) : false;

  if (!open) {
    return (
      <aside className="flex h-full w-9 shrink-0 flex-col border-l border-[var(--line)] bg-[var(--panel)] max-md:h-9 max-md:w-full max-md:flex-row max-md:border-l-0 max-md:border-t">
        <button
          type="button"
          className="flex h-9 w-full items-center justify-center text-[var(--muted)] hover:bg-[var(--panel-2)] hover:text-[var(--text)]"
          aria-label="Expand details"
          title="Expand details"
          onClick={() => setOpen(true)}
        >
          <PanelToggleIcon expand />
        </button>
      </aside>
    );
  }

  return (
    <aside className="flex h-full min-h-0 w-[320px] shrink-0 flex-col border-l border-[var(--line)] bg-[var(--panel)] max-md:w-full max-md:border-l-0 max-md:border-t">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-[var(--line)] px-3">
        <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Details</div>
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--muted)] hover:bg-[var(--panel-2)] hover:text-[var(--text)]"
          aria-label="Collapse details"
          title="Collapse details"
          onClick={() => setOpen(false)}
        >
          <PanelToggleIcon />
        </button>
      </div>
      <div className="arch-scroll min-h-0 flex-1" style={{ overflow: "auto" }}>
        {view && spec ? (
          <NodePanel view={view} spec={spec} broken={broken} sim={sim} />
        ) : (
          <ChallengePanel challenge={challenge} />
        )}
        <RobustnessSection />
        <LastRunPanel sim={sim} challenge={challenge} />
        <ActivityPanel />
      </div>
    </aside>
  );
}

function PanelToggleIcon({ expand = false }: { expand?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d={expand ? "M6.2 8 H12.2 M9.6 5.6 L12.2 8 L9.6 10.4" : "M9.8 8 H3.8 M6.4 5.6 L3.8 8 L6.4 10.4"} fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
