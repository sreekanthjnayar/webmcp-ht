import type { ReactNode } from "react";

export function SectionLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`text-[10px] uppercase tracking-[0.16em] text-[var(--muted)] ${className}`.trim()}>
      {children}
    </div>
  );
}
