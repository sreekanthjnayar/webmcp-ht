"use client";

import { CATALOG } from "@/lib/catalog";
import { useArchitectureStore } from "@/lib/store";

export function Inspector() {
  const selectedId = useArchitectureStore((s) => s.selectedNodeId);
  const node = useArchitectureStore((s) => s.nodes.find((n) => n.id === selectedId) ?? null);
  const challenge = useArchitectureStore((s) => s.challenge());
  const sim = useArchitectureStore((s) => s.sim);
  const activity = useArchitectureStore((s) => s.activity);
  const setNodeProps = useArchitectureStore((s) => s.setNodeProps);
  const undo = useArchitectureStore((s) => s.undo);
  const canUndo = useArchitectureStore((s) => s.past.length > 0);

  return (
    <aside className="flex h-full min-h-0 w-[320px] shrink-0 flex-col border-l border-[var(--line)] bg-[var(--panel)] max-md:w-full max-md:border-l-0 max-md:border-t">
      <div className="min-h-0 flex-1 overflow-auto">
        {node ? (
          <section className="border-b border-[var(--line)] px-4 py-4">
            <div
              className="flex items-center gap-2 rounded-md px-2 py-1.5"
              style={{ background: `color-mix(in srgb, ${CATALOG[node.data.kind].accent} 16%, transparent)` }}
            >
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-sm"
                style={{ background: CATALOG[node.data.kind].accent }}
              />
              <div
                className="text-[10px] uppercase tracking-[0.16em]"
                style={{ color: CATALOG[node.data.kind].accent }}
              >
                {CATALOG[node.data.kind].label}
              </div>
            </div>
            <h2 className="mt-1 text-sm text-[var(--text)]">{node.data.label}</h2>
            <p className="mt-1 font-mono text-[11px] text-[var(--muted)]">{node.id}</p>
            <p className="mt-2 text-[12px] leading-relaxed text-[var(--muted)]">
              {CATALOG[node.data.kind].blurb}
            </p>

            <label className="mt-4 block text-[11px] text-[var(--muted)]">
              Name
              <input
                className="arch-input mt-1"
                value={node.data.label}
                onChange={(e) => setNodeProps(node.id, { label: e.target.value }, "human")}
              />
            </label>

            {node.data.kind !== "client" ? (
              <label className="mt-3 block text-[11px] text-[var(--muted)]">
                Replicas
                <input
                  className="arch-input mt-1"
                  type="number"
                  min={1}
                  max={32}
                  value={node.data.replicas}
                  onChange={(e) =>
                    setNodeProps(node.id, { replicas: Number(e.target.value) }, "human")
                  }
                />
              </label>
            ) : null}

            {node.data.kind !== "client" ? (
              <label className="mt-3 block text-[11px] text-[var(--muted)]">
                RPS per replica
                <input
                  className="arch-input mt-1"
                  type="number"
                  min={100}
                  step={100}
                  value={node.data.rpsCapacity}
                  onChange={(e) =>
                    setNodeProps(node.id, { rpsCapacity: Number(e.target.value) }, "human")
                  }
                />
              </label>
            ) : null}

            {node.data.hitRate != null ? (
              <label className="mt-3 block text-[11px] text-[var(--muted)]">
                Hit rate {(node.data.hitRate * 100).toFixed(0)}%
                <input
                  className="mt-2 w-full accent-[var(--accent)]"
                  type="range"
                  min={0.5}
                  max={0.99}
                  step={0.01}
                  value={node.data.hitRate}
                  onChange={(e) =>
                    setNodeProps(node.id, { hitRate: Number(e.target.value) }, "human")
                  }
                />
              </label>
            ) : null}

            <label className="mt-4 flex items-center gap-2 text-[12px] text-[var(--text)]">
              <input
                type="checkbox"
                checked={Boolean(node.data.locked)}
                onChange={(e) => setNodeProps(node.id, { locked: e.target.checked }, "human")}
              />
              Lock (agent cannot change)
            </label>

            {sim?.nodes[node.id] ? (
              <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 font-mono text-[11px]">
                <dt className="text-[var(--muted)]">In</dt>
                <dd>{Math.round(sim.nodes[node.id].incomingRps).toLocaleString()} rps</dd>
                <dt className="text-[var(--muted)]">Drop</dt>
                <dd>{Math.round(sim.nodes[node.id].overflowRps).toLocaleString()} rps</dd>
                <dt className="text-[var(--muted)]">Util</dt>
                <dd>{Math.round(sim.nodes[node.id].utilization * 100)}%</dd>
                <dt className="text-[var(--muted)]">Added</dt>
                <dd>{sim.nodes[node.id].addedLatencyMs.toFixed(1)} ms</dd>
                {sim.nodes[node.id].queueLagMs > 0 ? (
                  <>
                    <dt className="text-[var(--muted)]">Lag</dt>
                    <dd>{Math.round(sim.nodes[node.id].queueLagMs)} ms</dd>
                  </>
                ) : null}
              </dl>
            ) : null}
          </section>
        ) : (
          <section className="border-b border-[var(--line)] px-4 py-4">
            <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Use case</div>
            <h2 className="mt-1 text-sm text-[var(--text)]">{challenge.title}</h2>
            <p className="mt-2 text-[12px] leading-relaxed text-[var(--muted)]">{challenge.brief}</p>
            <ul className="mt-3 space-y-1 text-[12px] text-[var(--text)]">
              {challenge.constraints.map((c) => (
                <li key={c} className="flex gap-2">
                  <span className="text-[var(--accent)]">/</span>
                  {c}
                </li>
              ))}
            </ul>
            <div className="mt-4 text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Hints</div>
            <ul className="mt-2 space-y-2 text-[12px] leading-relaxed text-[var(--muted)]">
              {challenge.hints.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="border-b border-[var(--line)] px-4 py-4">
          <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Robustness</div>
          {sim ? (
            <RobustnessPanel />
          ) : (
            <p className="mt-2 text-[12px] text-[var(--muted)]">
              Run a simulation to score this design. Change the graph and run again to see if it got
              better or worse.
            </p>
          )}
        </section>

        <section className="border-b border-[var(--line)] px-4 py-4">
          <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Last run</div>
          {sim ? (
            <dl className="mt-2 space-y-1 font-mono text-[12px]">
              <div className="flex justify-between">
                <dt className="text-[var(--muted)]">p99</dt>
                <dd>
                  {Math.round(sim.p99Ms)} / {challenge.slo.maxP99Ms} ms
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--muted)]">errors</dt>
                <dd>
                  {(sim.errorRate * 100).toFixed(1)}% / {(challenge.slo.maxErrorRate * 100).toFixed(0)}%
                </dd>
              </div>
              {challenge.slo.maxQueueLagMs != null ? (
                <div className="flex justify-between">
                  <dt className="text-[var(--muted)]">queue lag</dt>
                  <dd>
                    {Math.round(sim.maxQueueLagMs)} / {challenge.slo.maxQueueLagMs} ms
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-[var(--muted)]">hottest path</dt>
                <dd className="max-w-[160px] truncate text-right">{sim.hottestPath.join(" → ") || "—"}</dd>
              </div>
              {sim.error ? <p className="pt-1 text-[var(--fail)]">{sim.error}</p> : null}
            </dl>
          ) : (
            <p className="mt-2 text-[12px] text-[var(--muted)]">Run the simulation to see utilization and packets.</p>
          )}
        </section>

        <section className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Activity</div>
            <button
              type="button"
              className="text-[11px] text-[var(--muted)] hover:text-[var(--text)] disabled:opacity-40"
              onClick={undo}
              disabled={!canUndo}
            >
              Undo
            </button>
          </div>
          <ul className="mt-2 space-y-2">
            {activity.length === 0 ? (
              <li className="text-[12px] text-[var(--muted)]">Edits from you and the agent show up here.</li>
            ) : (
              activity.slice(0, 12).map((item) => (
                <li key={item.id} className="text-[12px] leading-snug">
                  <span className="text-[var(--muted)]">{item.actor === "agent" ? "Agent · " : "You · "}</span>
                  {item.text}
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </aside>
  );
}

function RobustnessPanel() {
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
          <div className={`text-[12px] ${
            delta.direction === "better"
              ? "text-[var(--ok)]"
              : delta.direction === "worse"
                ? "text-[var(--fail)]"
                : "text-[var(--muted)]"
          }`}>
            {delta.summary}
          </div>
          <ul className="mt-2 space-y-1 font-mono text-[11px]">
            {delta.metrics.map((m) => (
              <li key={m.label} className="flex justify-between gap-2">
                <span className="text-[var(--muted)]">{m.label}</span>
                <span className={
                  m.direction === "better"
                    ? "text-[var(--ok)]"
                    : m.direction === "worse"
                      ? "text-[var(--fail)]"
                      : ""
                }>
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