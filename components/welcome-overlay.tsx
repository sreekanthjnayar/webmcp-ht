"use client";

import { useEffect, useState } from "react";

const AUTO_HIDE_MS = 8000;
const FADE_MS = 450;

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
    const hide = window.setTimeout(dismiss, AUTO_HIDE_MS);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(hide);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#0b0d10]/80 p-6 backdrop-blur-[8px] transition-opacity duration-500"
      style={{ opacity: leaving ? 0 : 1 }}
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
      aria-labelledby="archflow-welcome-title"
    >
      <div className="max-w-[26rem] text-center" onClick={(e) => e.stopPropagation()}>
        <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">Archflow</div>
        <div className="mx-auto mt-4 h-px w-10 bg-[var(--accent)]/70" />
        <h1 id="archflow-welcome-title" className="mt-5 text-[22px] leading-snug tracking-[-0.02em] text-[var(--text)]">
          Learn system design together.
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--muted)]">
          A visual studio where you and an agent share one canvas. Sketch the architecture, run the
          traffic, and take turns making it stronger.
        </p>
        <button type="button" className="arch-btn-primary mt-7" onClick={dismiss}>
          Begin
        </button>
      </div>
    </div>
  );
}
