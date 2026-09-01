"use client";

import { ArchitectureCanvas } from "@/components/architecture-canvas";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Inspector } from "@/components/inspector";
import { Palette } from "@/components/palette";
import { WebMcpTools } from "@/components/webmcp-tools";
import { CHALLENGES } from "@/lib/challenges";
import { useArchitectureStore } from "@/lib/store";

export function SimulatorApp() {
  const challengeId = useArchitectureStore((s) => s.challengeId);
  const setChallenge = useArchitectureStore((s) => s.setChallenge);
  const runSimulation = useArchitectureStore((s) => s.runSimulation);
  const arrangeLayers = useArchitectureStore((s) => s.arrangeLayers);
  const sim = useArchitectureStore((s) => s.sim);
  const challenge = useArchitectureStore((s) => s.challenge());

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <WebMcpTools />
      <ConfirmDialog />
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-[var(--line)] bg-[var(--panel)] px-4 py-2.5">
        <div className="min-w-[140px]">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">Archflow</div>
          <div className="text-[13px] text-[var(--text)]">System design studio</div>
        </div>

        <nav className="flex min-w-0 flex-1 flex-wrap gap-1">
          {CHALLENGES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setChallenge(c.id)}
              className={`rounded-md px-2.5 py-1.5 text-left text-[12px] leading-tight ${
                c.id === challengeId
                  ? "bg-[var(--panel-2)] text-[var(--text)]"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              <span className="block">{c.title}</span>
              <span className="block text-[10px] text-[var(--muted)] max-md:hidden">{c.subtitle}</span>
            </button>
          ))}
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          {sim ? (
            <>
              <span className={`arch-chip ${sim.sloPassed ? "arch-chip-ok" : "arch-chip-fail"}`}>
                {sim.sloPassed ? "SLO pass" : "SLO miss"}
              </span>
              <span
                className={`arch-chip ${
                  sim.robustness.grade === "hardy" || sim.robustness.grade === "solid"
                    ? "arch-chip-ok"
                    : sim.robustness.grade === "fragile" || sim.robustness.grade === "weak"
                      ? "arch-chip-fail"
                      : "arch-chip-warn"
                }`}
              >
                {sim.robustness.score} {sim.robustness.grade}
                {sim.delta && sim.delta.direction !== "unchanged"
                  ? ` ${sim.delta.scoreDelta > 0 ? "+" : ""}${sim.delta.scoreDelta}`
                  : ""}
              </span>
            </>
          ) : (
            <span className="arch-chip">Not run</span>
          )}
          <button type="button" className="arch-btn" onClick={() => setChallenge(challengeId)}>
            Reset sketch
          </button>
          <button type="button" className="arch-btn" onClick={() => arrangeLayers("human")}>
            Arrange layers
          </button>
          <button type="button" className="arch-btn-primary" onClick={() => runSimulation(undefined, "human")}>
            Run {challenge.ingressRps.toLocaleString()} RPS
          </button>
        </div>
      </header>
      {sim?.delta ? (
        <div
          className={`shrink-0 border-b border-[var(--line)] px-4 py-1.5 text-[12px] ${
            sim.delta.direction === "better"
              ? "text-[var(--ok)]"
              : sim.delta.direction === "worse"
                ? "text-[var(--fail)]"
                : "text-[var(--muted)]"
          }`}
        >
          {sim.delta.summary}
        </div>
      ) : null}
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