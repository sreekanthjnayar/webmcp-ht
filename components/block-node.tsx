"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { CATALOG } from "@/lib/catalog";
import type { ArchNode } from "@/lib/graph";
import { useArchitectureStore } from "@/lib/store";

function utilTone(util: number, overflow: number): string {
  if (overflow > 1 || util >= 1) return "var(--fail)";
  if (util >= 0.7) return "var(--warn)";
  return "var(--ok)";
}

export function BlockNode({ id, data, selected }: NodeProps<ArchNode>) {
  const spec = CATALOG[data.kind];
  const sim = useArchitectureStore((s) => s.sim?.nodes[id]);
  const util = sim?.utilization ?? 0;
  const overflow = sim?.overflowRps ?? 0;
  const bar = Math.min(100, util * 100);
  const hideTarget = spec.maxIn === 0;
  const hideSource = spec.maxOut === 0;
  const cap =
    data.kind === "client" || data.rpsCapacity <= 0
      ? "∞"
      : `${(data.replicas * data.rpsCapacity).toLocaleString()} rps`;

  return (
    <div
      className={`arch-node ${selected ? "arch-node-selected" : ""}`}
      style={{ borderColor: selected ? spec.accent : undefined }}
    >
      {!hideTarget ? <Handle type="target" position={Position.Left} className="arch-handle" /> : null}
      {!hideSource ? <Handle type="source" position={Position.Right} className="arch-handle" /> : null}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="arch-kind-dot" style={{ background: spec.accent }} />
            <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
              {spec.label}
            </span>
            {data.locked ? <span className="text-[10px] text-[var(--muted)]">locked</span> : null}
          </div>
          <div className="mt-0.5 truncate text-[13px] font-medium text-[var(--text)]">{data.label}</div>
        </div>
        <div className="font-mono text-[10px] text-[var(--muted)]">{id}</div>
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-2 font-mono text-[11px] text-[var(--muted)]">
        <span>{data.replicas}× · {cap}</span>
        {sim ? (
          <span style={{ color: utilTone(util, overflow) }}>
            {Math.round(util * 100)}%
          </span>
        ) : null}
      </div>

      <div className="arch-util">
        <div
          className="arch-util-fill"
          style={{
            width: `${bar}%`,
            background: sim ? utilTone(util, overflow) : "transparent",
          }}
        />
      </div>

      {data.findings[0] ? (
        <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-[var(--warn)]">
          {data.findings[0].message}
        </p>
      ) : null}
    </div>
  );
}