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
  const fill = `color-mix(in srgb, ${spec.accent} ${selected ? 34 : 24}%, #10151c)`;
  const border = `color-mix(in srgb, ${spec.accent} ${selected ? 88 : 58}%, #1c222c)`;

  return (
    <div
      className={`arch-node ${selected ? "arch-node-selected" : ""}`}
      style={{
        borderColor: border,
        background: fill,
        boxShadow: selected
          ? `0 0 0 1px ${spec.accent}, 0 14px 32px rgba(0,0,0,0.45)`
          : `0 8px 22px rgba(0,0,0,0.32), inset 0 1px 0 color-mix(in srgb, ${spec.accent} 18%, transparent)`,
      }}
    >
      <span className="arch-node-rail" style={{ background: spec.accent }} />
      {!hideTarget ? (
        <Handle
          type="target"
          position={Position.Left}
          className="arch-handle"
          style={{ background: spec.accent, boxShadow: `0 0 0 3px color-mix(in srgb, ${spec.accent} 28%, #0b0d10)` }}
        />
      ) : null}
      {!hideSource ? (
        <Handle
          type="source"
          position={Position.Right}
          className="arch-handle"
          style={{ background: spec.accent, boxShadow: `0 0 0 3px color-mix(in srgb, ${spec.accent} 28%, #0b0d10)` }}
        />
      ) : null}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span
            className="arch-kind-badge"
            style={{
              color: "#0c1014",
              background: spec.accent,
            }}
          >
            {spec.label}
          </span>
          {data.locked ? <span className="ml-1.5 text-[10px] text-[var(--muted)]">locked</span> : null}
          <div className="mt-1.5 truncate text-[13px] font-medium text-[var(--text)]">{data.label}</div>
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

      <div className="arch-util" style={{ background: `color-mix(in srgb, ${spec.accent} 22%, #2a303a)` }}>
        <div
          className="arch-util-fill"
          style={{
            width: `${bar}%`,
            background: sim ? utilTone(util, overflow) : spec.accent,
            opacity: sim ? 1 : 0.45,
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
