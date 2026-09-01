import { CHALLENGES } from "@/lib/challenges";
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

export function StudioHeader() {
  const challengeId = useArchitectureStore((s) => s.challengeId);
  const setChallenge = useArchitectureStore((s) => s.setChallenge);
  const runSimulation = useArchitectureStore((s) => s.runSimulation);
  const arrangeLayers = useArchitectureStore((s) => s.arrangeLayers);
  const sim = useArchitectureStore((s) => s.sim);
  const challenge = useArchitectureStore((s) => s.challenge());

  return (
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
        <SimChips sim={sim} />
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
  );
}
