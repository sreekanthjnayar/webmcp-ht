type MarkProps = {
  className?: string;
  title?: string;
};

/** Three blocks in an arch, linked by a gold path — architecture + flow. */
export function ArchflowMark({ className = "h-8 w-8", title }: MarkProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} role={title ? "img" : "presentation"} aria-hidden={title ? undefined : true}>
      {title ? <title>{title}</title> : null}
      <rect x="0.6" y="0.6" width="30.8" height="30.8" rx="8" fill="#181c24" stroke="#2a303a" />
      <path
        d="M8.2 21.2 L16 10.4 L23.8 21.2"
        fill="none"
        stroke="#d4a056"
        strokeWidth="1.7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <rect x="4.8" y="18.2" width="6.6" height="6.6" rx="1.7" fill="#e8c48a" />
      <rect x="12.7" y="6.2" width="6.6" height="6.6" rx="1.7" fill="#d4a056" />
      <rect x="20.6" y="18.2" width="6.6" height="6.6" rx="1.7" fill="#6dbf8a" />
    </svg>
  );
}

export function ArchflowWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`tracking-[-0.03em] text-[var(--text)] ${className}`.trim()}>
      Arch<span className="text-[var(--accent)]">flow</span>
    </span>
  );
}

export function ArchflowLockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <ArchflowMark className={compact ? "h-6 w-6 shrink-0" : "h-8 w-8 shrink-0"} title="Archflow" />
      <div className="min-w-0 leading-tight">
        <div className={compact ? "text-[13px] font-medium" : "text-[14px] font-medium"}>
          <ArchflowWordmark />
        </div>
        {compact ? null : <div className="text-[11px] text-[var(--muted)]">System design studio</div>}
      </div>
    </div>
  );
}
