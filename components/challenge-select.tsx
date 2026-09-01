"use client";

import { CHALLENGES } from "@/lib/challenges";
import { useArchitectureStore } from "@/lib/store";
import { useEffect, useId, useRef, useState } from "react";

export function ChallengeSelect() {
  const challengeId = useArchitectureStore((s) => s.challengeId);
  const setChallenge = useArchitectureStore((s) => s.setChallenge);
  const challenge = useArchitectureStore((s) => s.challenge());
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative ml-auto shrink-0">
      <button
        type="button"
        className="flex h-7 max-w-[260px] items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--panel-2)] px-2.5 text-left hover:border-[var(--accent)]/40"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`Use case: ${challenge.title}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">Use case</span>
        <span className="min-w-0 truncate text-[12px] text-[var(--text)]">{challenge.title}</span>
        <Chevron open={open} />
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="System design tutorials"
          className="absolute right-0 z-30 mt-1 w-[260px] overflow-hidden rounded-md border border-[var(--line)] bg-[var(--panel-2)] py-1 shadow-[0_12px_32px_rgba(0,0,0,0.4)]"
        >
          {CHALLENGES.map((c) => {
            const selected = c.id === challengeId;
            return (
              <li key={c.id} role="option" aria-selected={selected}>
                <button
                  type="button"
                  className={`flex w-full flex-col px-3 py-2 text-left text-[12px] leading-tight hover:bg-[var(--panel)] ${
                    selected ? "text-[var(--text)]" : "text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
                  onClick={() => {
                    if (!selected) setChallenge(c.id);
                    setOpen(false);
                  }}
                >
                  <span>{c.title}</span>
                  <span className="mt-0.5 text-[10px] text-[var(--muted)]">{c.subtitle}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={`h-3 w-3 shrink-0 text-[var(--muted)] transition-transform ${open ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <path d="M2.5 4.2 L6 7.8 L9.5 4.2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
