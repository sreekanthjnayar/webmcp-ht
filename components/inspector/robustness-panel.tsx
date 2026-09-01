import { SectionLabel } from "@/components/ui/section-label";
import { useArchitectureStore } from "@/lib/store";

export function RobustnessPanel() {
  const sim = useArchitectureStore((s) => s.sim);
  const history = useArchitectureStore((s) => s.simHistory);
  if (!sim) return null;
  const r = sim.robustness;
  const delta = sim.delta;
  const gradeClass =
    r.grade === "hardy" || r.grade === "solid"
      ? "arch-chip-ok"
      : r.grade === "fragile" || r.grade === "weak"
        ? "arch-chip-fail"
        : "arch-chip-warn";

  return (
    <div className="mt-2">
      <div className="flex items-baseline justify-between gap-2">
        <div className="font-mono text-2xl tabular-nums text-[var(--text)]">{r.score}</div>
        <span className={`arch-chip ${gradeClass}`}>{r.grade}</span>
      </div>
      {history.length > 1 ? (
        <div className="mt-2 flex h-8 items-end gap-0.5">
          {history.map((score, i) => (
            <div
              key={`${score}-${i}`}
              className="flex-1 rounded-sm bg-[var(--accent)]"
              style={{ height: `${Math.max(8, score)}%`, opacity: i === history.length - 1 ? 1 : 0.4 }}
              title={`${score}`}
            />
          ))}
        </div>
      ) : null}
      <p className="mt-2 text-[12px] leading-relaxed text-[var(--text)]">{r.headline}</p>
      {delta ? (
        <div className="mt-3 rounded-md border border-[var(--line)] px-2.5 py-2">
          <div
            className={`text-[12px] ${
              delta.direction === "better"
                ? "text-[var(--ok)]"
                : delta.direction === "worse"
                  ? "text-[var(--fail)]"
                  : "text-[var(--muted)]"
            }`}
          >
            {delta.summary}
          </div>
          <ul className="mt-2 space-y-1 font-mono text-[11px]">
            {delta.metrics.map((m) => (
              <li key={m.label} className="flex justify-between gap-2">
                <span className="text-[var(--muted)]">{m.label}</span>
                <span
                  className={
                    m.direction === "better"
                      ? "text-[var(--ok)]"
                      : m.direction === "worse"
                        ? "text-[var(--fail)]"
                        : ""
                  }
                >
                  {m.before} → {m.after}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-2 text-[11px] text-[var(--muted)]">
          Modify the graph and run again — this panel will say whether robustness rose or fell.
        </p>
      )}
      {r.notes.length > 0 ? (
        <ul className="mt-3 space-y-1.5 text-[12px] leading-snug text-[var(--fail)]">
          {r.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      ) : null}
      {r.strengths.length > 0 ? (
        <ul className="mt-2 space-y-1.5 text-[12px] leading-snug text-[var(--ok)]">
          {r.strengths.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function RobustnessSection() {
  const sim = useArchitectureStore((s) => s.sim);
  return (
    <section className="border-b border-[var(--line)] px-4 py-4">
      <SectionLabel>Robustness</SectionLabel>
      {sim ? (
        <RobustnessPanel />
      ) : (
        <p className="mt-2 text-[12px] text-[var(--muted)]">
          Run a simulation to score this design. Change the graph and run again to see if it got better or worse.
        </p>
      )}
    </section>
  );
}
