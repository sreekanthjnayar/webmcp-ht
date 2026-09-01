"use client";

import { ActivityPanel } from "@/components/inspector/activity-panel";
import { ChallengePanel } from "@/components/inspector/challenge-panel";
import { LastRunPanel } from "@/components/inspector/last-run-panel";
import { NodePanel } from "@/components/inspector/node-panel";
import { RobustnessSection } from "@/components/inspector/robustness-panel";
import { specOf } from "@/lib/catalog";
import { isBrokenNode, normalizeNode } from "@/lib/graph";
import { useArchitectureStore } from "@/lib/store";

export function Inspector() {
  const selectedId = useArchitectureStore((s) => s.selectedNodeId);
  const node = useArchitectureStore((s) => s.nodes.find((n) => n.id === selectedId) ?? null);
  const challenge = useArchitectureStore((s) => s.challenge());
  const sim = useArchitectureStore((s) => s.sim);
  const view = node ? normalizeNode(node) : null;
  const spec = view ? specOf(view.data.kind) : null;
  const broken = view ? isBrokenNode(view) : false;

  return (
    <aside className="flex h-full min-h-0 w-[320px] shrink-0 flex-col border-l border-[var(--line)] bg-[var(--panel)] max-md:w-full max-md:border-l-0 max-md:border-t">
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
