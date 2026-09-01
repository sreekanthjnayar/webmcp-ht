"use client";

import { useEffect, useState } from "react";

const AUTO_HIDE_MS = 9000;
const FADE_MS = 500;

export function WelcomeOverlay() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  function dismiss() {
    setLeaving((already) => {
      if (already) return true;
      window.setTimeout(() => setVisible(false), FADE_MS);
      return true;
    });
  }

  useEffect(() => {
    const t = window.setTimeout(dismiss, AUTO_HIDE_MS);
    return () => window.clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#0b0d10]/78 p-6 backdrop-blur-[6px] transition-opacity duration-500"
      style={{ opacity: leaving ? 0 : 1 }}
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
      aria-labelledby="archflow-welcome-title"
    >
      <div className="max-w-[28rem] text-center" onClick={(e) => e.stopPropagation()}>
        <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--accent)]">Archflow</div>
        <h1 id="archflow-welcome-title" className="mt-3 text-[22px] leading-snug text-[var(--text)]">
          A shared studio for designing systems together.
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--muted)]">
          You sketch the architecture. An agent can read the same graph, suggest changes, and run
          the traffic with you. A visual, collaborative way to learn what holds — and what breaks.
        </p>
        <button type="button" className="arch-btn-primary mt-6" onClick={dismiss}>
          Begin
        </button>
      </div>
    </div>
  );
}
