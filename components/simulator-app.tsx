"use client";

import { ArchitectureCanvas } from "@/components/architecture-canvas";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { GraphIssueBanner, RunDeltaBanner } from "@/components/graph-issue-banner";
import { Inspector } from "@/components/inspector";
import { Palette } from "@/components/palette";
import { StudioHeader } from "@/components/studio-header";
import { WebMcpTools } from "@/components/webmcp-tools";
import { sanitizeGraph } from "@/lib/graph";
import { useArchitectureStore } from "@/lib/store";

export function SimulatorApp() {
  const sim = useArchitectureStore((s) => s.sim);
  const nodes = useArchitectureStore((s) => s.nodes);
  const edges = useArchitectureStore((s) => s.edges);
  const issues = sanitizeGraph(nodes, edges).issues;

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <WebMcpTools />
      <ConfirmDialog />
      <StudioHeader />
      <GraphIssueBanner issues={issues} />
      <RunDeltaBanner delta={sim?.delta} />
      <div className="flex min-h-0 flex-1 max-md:flex-col">
        <Palette />
        <ArchitectureCanvas />
        <Inspector />
      </div>
      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-[var(--line)] px-4 py-1.5 text-[11px] text-[var(--muted)]">
        <span>WebMCP tools are registered on this page for ChatGPT / Chrome agents.</span>
        <span className="max-md:hidden">
          Human assembles the sketch. Agent can read the graph, rewire blocks, and re-run.
        </span>
      </footer>
    </div>
  );
}
