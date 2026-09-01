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

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const kind = event.dataTransfer.getData("application/archflow-kind") as BlockKind;
      if (!kind) return;
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      addNode(kind, position, { actor: "human" });
    },
    [addNode, screenToFlowPosition],
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
    <div className="relative min-h-0 min-w-0 flex-1">
      <ReactFlowProvider>
        <CanvasInner />
      </ReactFlowProvider>
    </div>
  );
}