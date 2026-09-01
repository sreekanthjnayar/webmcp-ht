import { SectionLabel } from "@/components/ui/section-label";
import { useArchitectureStore } from "@/lib/store";

export function ActivityPanel() {
  const activity = useArchitectureStore((s) => s.activity);
  const undo = useArchitectureStore((s) => s.undo);
  const canUndo = useArchitectureStore((s) => s.past.length > 0);

  return (
    <section className="px-4 py-4">
      <div className="flex items-center justify-between">
        <SectionLabel>Activity</SectionLabel>
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
  );
}
