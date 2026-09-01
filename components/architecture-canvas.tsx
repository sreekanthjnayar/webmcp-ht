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
import { useCallback } from "react";
import { BlockNode } from "@/components/block-node";
import { PacketEdge } from "@/components/packet-edge";
import type { ArchEdge, ArchNode } from "@/lib/graph";
import { PALETTE_ORDER } from "@/lib/catalog";
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
  const challengeId = useArchitectureStore((s) => s.challengeId);
  const { screenToFlowPosition } = useReactFlow();

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
      nodes={nodes}
      edges={edges}
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
      fitViewOptions={{ padding: 0.24 }}
      proOptions={{ hideAttribution: true }}
      deleteKeyCode={["Backspace", "Delete"]}
      className="arch-flow"
    >
      <Background gap={22} size={1} color="var(--grid)" />
      <Controls showInteractive={false} />
      <MiniMap
        pannable
        zoomable
        maskColor="rgba(8,10,12,0.72)"
        nodeColor={(n) => {
          const kind = (n.data as { kind?: string })?.kind;
          if (kind === "cache" || kind === "cdn") return "#d4a056";
          if (kind === "database") return "#c98980";
          return "#3a414d";
        }}
      />
    </ReactFlow>
  );
}

export function ArchitectureCanvas() {
  return (
    <div className="relative min-h-[320px] min-w-0 flex-1">
      <div className="absolute inset-0">
        <ReactFlowProvider>
          <CanvasInner />
        </ReactFlowProvider>
      </div>
    </div>
  );
}