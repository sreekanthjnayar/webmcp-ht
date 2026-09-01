"use client";

import { useArchitectureStore } from "@/lib/store";

export function ConfirmDialog() {
  const confirm = useArchitectureStore((s) => s.confirm);
  const resolveConfirm = useArchitectureStore((s) => s.resolveConfirm);
  if (!confirm) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="w-full max-w-md rounded-lg border border-[var(--line)] bg-[var(--panel-2)] p-5">
        <h2 className="text-sm font-medium text-[var(--text)]">{confirm.title}</h2>
        <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--muted)]">
          {confirm.body}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="arch-btn" onClick={() => resolveConfirm(false)}>
            Cancel
          </button>
          <button type="button" className="arch-btn-primary" onClick={() => resolveConfirm(true)}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}