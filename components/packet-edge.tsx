"use client";

import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";
import { CATALOG } from "@/lib/catalog";
import { useArchitectureStore } from "@/lib/store";
import type { ArchEdge } from "@/lib/graph";

export function PacketEdge({
  id,
  source,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  selected,
}: EdgeProps<ArchEdge>) {
  const rps = useArchitectureStore((s) => s.sim?.edges[id]?.rps ?? 0);
  const protocol = useArchitectureStore(
    (s) => s.edges.find((e) => e.id === id)?.data?.protocol ?? "sync",
  );
  const sourceKind = useArchitectureStore(
    (s) => s.nodes.find((n) => n.id === source)?.data.kind,
  );
  const accent = sourceKind ? CATALOG[sourceKind].accent : "var(--edge)";
  const [path] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  const packets = rps <= 0 ? 0 : Math.min(8, Math.max(1, Math.round(rps / 2500)));
  const duration = rps > 20_000 ? 1.1 : rps > 5_000 ? 1.6 : 2.2;
  const stroke = selected ? accent : `color-mix(in srgb, ${accent} 62%, #4a5563)`;

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={{
          stroke,
          strokeWidth: rps > 0 ? 2.2 : 1.6,
          strokeDasharray: protocol === "async" ? "5 4" : undefined,
        }}
      />
      {Array.from({ length: packets }, (_, i) => (
        <circle key={i} r={3.2} fill={accent} className="pointer-events-none">
          <animateMotion
            dur={`${duration}s`}
            begin={`${(i / packets) * duration}s`}
            repeatCount="indefinite"
            path={path}
          />
        </circle>
      ))}
    </>
  );
}
