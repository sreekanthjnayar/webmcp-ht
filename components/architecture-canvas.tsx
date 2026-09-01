"use client";

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo } from "react";
import { BlockNode } from "@/components/block-node";
import { CanvasToolbar } from "@/components/canvas-toolbar";
import { PacketEdge } from "@/components/packet-edge";
import { PALETTE_ORDER, specOf } from "@/lib/catalog";
import { normalizeNode, type ArchEdge, type ArchNode } from "@/lib/graph";
import type { BlockKind } from "@/lib/types";
import { useArchitectureStore } from "@/lib/store";

const nodeTypes: NodeTypes = { block: BlockNode };
const edgeTypes: EdgeTypes = { packet: PacketEdge };

function CanvasInner() {
  const nodes = useArchitectureStore((s) => s.nodes);
  const edges = useArchitectureStore((s) => s.edges);
  const onNodesChange = useArchitectureStore((s) => s.onNodesChange);
  const onEdgesChange = useArchitectureStore((s) => s.onEdgesChange);
  const onConnect = useArchitectureStore((s) => s.onConnect);
  const selectNode = useArchitectureStore((s) => s.selectNode);
  const addNode = useArchitectureStore((s) => s.addNode);
  const selectedNodeId = useArchitectureStore((s) => s.selectedNodeId);
  const challengeId = useArchitectureStore((s) => s.challengeId);
  const layoutNonce = useArchitectureStore((s) => s.layoutNonce);
  const { screenToFlowPosition, fitView } = useReactFlow();

  const placedNodes = useMemo(
    () =>
      nodes.map((n) => {
        const next = normalizeNode(n);
        return {
          ...next,
          type: "block" as const,
          zIndex: n.id === selectedNodeId ? 1000 : 1,
        };
      }),
    [nodes, selectedNodeId],
  );
  const placedEdges = useMemo(() => {
    const ids = new Set(placedNodes.map((n) => n.id));
    return edges.filter((e) => e?.source && e?.target && ids.has(e.source) && ids.has(e.target));
  }, [edges, placedNodes]);

  useEffect(() => {
    if (layoutNonce <= 0) return;
    const frame = requestAnimationFrame(() => {
      fitView({ padding: 0.28, duration: 280 });
    });
    return () => cancelAnimationFrame(frame);
  }, [layoutNonce, fitView]);

  const placeKind = useCallback(
    (event: React.DragEvent | React.MouseEvent, kind: BlockKind, clientX?: number, clientY?: number) => {
      const x = clientX ?? ("clientX" in event ? event.clientX : 0);
      const y = clientY ?? ("clientY" in event ? event.clientY : 0);
      const position = screenToFlowPosition({ x, y });
      addNode(kind, position, { actor: "human" });
    },
    [addNode, screenToFlowPosition],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const kind = (event.dataTransfer.getData("application/archflow-kind") ||
        event.dataTransfer.getData("text/plain")) as BlockKind;
      if (!PALETTE_ORDER.includes(kind)) return;
      placeKind(event, kind, event.clientX, event.clientY);
    },
    [placeKind],
  );

  return (
    <ReactFlow<ArchNode, ArchEdge>
      key={challengeId}
      nodes={placedNodes}
      edges={placedEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={(c) => {
        onConnect(c);
      }}
      onNodeClick={(_, node) => selectNode(node.id)}
      onPaneClick={() => selectNode(null)}
      onDragOver={onDragOver}
      onDrop={onDrop}
      fitView
      fitViewOptions={{ padding: 0.28 }}
      snapToGrid
      snapGrid={[16, 16]}
      elevateNodesOnSelect
      proOptions={{ hideAttribution: true }}
      deleteKeyCode={["Backspace", "Delete"]}
      className="arch-flow"
      defaultEdgeOptions={{ type: "packet" }}
    >
      <Background gap={22} size={1} color="var(--grid)" />
      <Controls showInteractive={false} />
      <MiniMap
        pannable
        zoomable
        maskColor="rgba(8,10,12,0.72)"
        nodeColor={(n) => specOf((n.data as { kind?: BlockKind })?.kind).accent}
      />
    </ReactFlow>
  );
}

export function ArchitectureCanvas() {
  return (
    <div className="flex min-h-[320px] min-w-0 flex-1 flex-col">
      <CanvasToolbar />
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0">
          <ReactFlowProvider>
            <CanvasInner />
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
}
