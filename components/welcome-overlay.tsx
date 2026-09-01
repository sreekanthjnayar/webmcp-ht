"use client";

import { ArchflowMark, ArchflowWordmark } from "@/components/brand/archflow-mark";
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
      className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center p-6 transition-opacity duration-500"
      style={{ opacity: leaving ? 0 : 1 }}
    >
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby="archflow-welcome-title"
        className="pointer-events-auto relative w-full max-w-[26rem] rounded-xl border border-[var(--line)] bg-[var(--panel)] px-7 pb-7 pt-8 text-center shadow-[0_18px_50px_rgba(0,0,0,0.45)]"
      >
        <button
          type="button"
          className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-md text-[var(--muted)] hover:bg-[var(--panel-2)] hover:text-[var(--text)]"
          onClick={dismiss}
          aria-label="Close welcome"
        >
          <CloseIcon />
        </button>
        <ArchflowMark className="mx-auto h-12 w-12" title="Archflow" />
        <div className="mt-4 text-[15px] font-medium">
          <ArchflowWordmark />
        </div>
        <h1 id="archflow-welcome-title" className="mt-4 text-[22px] leading-snug tracking-[-0.02em] text-[var(--text)]">
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

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M3.2 3.2 L12.8 12.8 M12.8 3.2 L3.2 12.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
