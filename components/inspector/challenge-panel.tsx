import { SectionLabel } from "@/components/ui/section-label";
import type { Challenge } from "@/lib/types";

export function ChallengePanel({ challenge }: { challenge: Challenge }) {
  return (
    <section className="border-b border-[var(--line)] px-4 py-4">
      <SectionLabel>Use case</SectionLabel>
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
      <SectionLabel className="mt-4">Hints</SectionLabel>
      <ul className="mt-2 space-y-2 text-[12px] leading-relaxed text-[var(--muted)]">
        {challenge.hints.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>
    </section>
  );
}
