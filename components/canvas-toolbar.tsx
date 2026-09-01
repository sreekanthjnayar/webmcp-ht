"use client";

import { useArchitectureStore } from "@/lib/store";
import type { SimResult } from "@/lib/types";

function SimChips({ sim }: { sim: SimResult | null }) {
  if (!sim) return <span className="arch-chip">Not run</span>;
  const gradeOk = sim.robustness.grade === "hardy" || sim.robustness.grade === "solid";
  const gradeFail = sim.robustness.grade === "fragile" || sim.robustness.grade === "weak";
  return (
    <>
      <span className={`arch-chip ${sim.sloPassed ? "arch-chip-ok" : "arch-chip-fail"}`}>
        {sim.sloPassed ? "SLO pass" : "SLO miss"}
      </span>
      <span className={`arch-chip ${gradeOk ? "arch-chip-ok" : gradeFail ? "arch-chip-fail" : "arch-chip-warn"}`}>
        {sim.robustness.score} {sim.robustness.grade}
        {sim.delta && sim.delta.direction !== "unchanged"
          ? ` ${sim.delta.scoreDelta > 0 ? "+" : ""}${sim.delta.scoreDelta}`
          : ""}
      </span>
    </>
  );
}

export function CanvasToolbar() {
  const challengeId = useArchitectureStore((s) => s.challengeId);
  const setChallenge = useArchitectureStore((s) => s.setChallenge);
  const runSimulation = useArchitectureStore((s) => s.runSimulation);
  const arrangeLayers = useArchitectureStore((s) => s.arrangeLayers);
  const sim = useArchitectureStore((s) => s.sim);
  const challenge = useArchitectureStore((s) => s.challenge());

  return (
    <div className="flex h-9 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] bg-[var(--bg)] px-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <SimChips sim={sim} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
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
    </div>
  );
}
