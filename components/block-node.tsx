"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ErrorBoundary } from "@/components/error-boundary";
import { specOf } from "@/lib/catalog";
import type { ArchNode } from "@/lib/graph";
import { isBrokenNode, normalizeNode } from "@/lib/graph";
import { useArchitectureStore } from "@/lib/store";

function utilTone(util: number, overflow: number): string {
  if (overflow > 1 || util >= 1) return "var(--fail)";
  if (util >= 0.7) return "var(--warn)";
  return "var(--ok)";
}

function BrokenCard({ id, message }: { id: string; message: string }) {
  const spec = specOf(undefined);
  return (
    <div className="arch-node arch-node-broken">
      <span className="arch-node-rail" style={{ background: spec.accent }} />
      <Handle type="target" position={Position.Left} className="arch-handle" style={{ background: spec.accent }} />
      <Handle type="source" position={Position.Right} className="arch-handle" style={{ background: spec.accent }} />
      <span className="arch-kind-badge" style={{ background: spec.accent, color: "#0c1014" }}>
        Broken
      </span>
      <div className="mt-1.5 truncate text-[13px] font-medium text-[var(--text)]">{id}</div>
      <p className="mt-2 line-clamp-3 text-[11px] leading-snug text-[var(--fail)]">{message}</p>
    </div>
  );
}

function BlockNodeInner({ id, data, selected }: NodeProps<ArchNode>) {
  const node = normalizeNode({ id, data, type: "block", position: { x: 0, y: 0 } } as ArchNode);
  const spec = specOf(node.data.kind);
  const broken = isBrokenNode(node);
  const sim = useArchitectureStore((s) => s.sim?.nodes[id]);
  const util = sim?.utilization ?? 0;
  const overflow = sim?.overflowRps ?? 0;
  const bar = Math.min(100, Number.isFinite(util) ? util * 100 : 0);
  const hideTarget = !broken && spec.maxIn === 0;
  const hideSource = !broken && spec.maxOut === 0;
  const cap =
    node.data.kind === "client" || node.data.rpsCapacity <= 0
      ? broken
        ? "0 rps"
        : "∞"
      : `${(node.data.replicas * node.data.rpsCapacity).toLocaleString()} rps`;
  const fill = `color-mix(in srgb, ${spec.accent} ${selected ? 34 : 24}%, #10151c)`;
  const border = `color-mix(in srgb, ${spec.accent} ${selected ? 88 : 58}%, #1c222c)`;

  return (
    <div
      className={`arch-node ${selected ? "arch-node-selected" : ""} ${broken ? "arch-node-broken" : ""}`}
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
          {node.data.locked ? <span className="ml-1.5 text-[10px] text-[var(--muted)]">locked</span> : null}
          <div className="mt-1.5 truncate text-[13px] font-medium text-[var(--text)]">{node.data.label}</div>
        </div>
        <div className="font-mono text-[10px] text-[var(--muted)]">{id}</div>
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-2 font-mono text-[11px] text-[var(--muted)]">
        <span>{node.data.replicas}× · {cap}</span>
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

      {node.data.findings[0] ? (
        <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-[var(--fail)]">
          {node.data.findings[0].message}
        </p>
      ) : null}
    </div>
  );
}

export function BlockNode(props: NodeProps<ArchNode>) {
  return (
    <ErrorBoundary
      fallback={<BrokenCard id={props.id} message="This block failed to render. Select it and remove it, or Repair graph." />}
    >
      <BlockNodeInner {...props} />
    </ErrorBoundary>
  );
}
