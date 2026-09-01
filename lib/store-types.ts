import type { Connection, EdgeChange, NodeChange } from "@xyflow/react";
import type { PlayableChallenge } from "./challenges";
import type { ArchEdge, ArchNode } from "./graph";
import type { BlockKind, Finding, Protocol, SimResult } from "./types";

export interface ActivityItem {
  id: string;
  at: number;
  actor: "human" | "agent";
  text: string;
}

export interface ConfirmRequest {
  title: string;
  body: string;
  resolve: (ok: boolean) => void;
}

export interface Snapshot {
  nodes: ArchNode[];
  edges: ArchEdge[];
}

export interface ArchitectureState {
  challengeId: string;
  nodes: ArchNode[];
  edges: ArchEdge[];
  selectedNodeId: string | null;
  sim: SimResult | null;
  previousSim: SimResult | null;
  simHistory: number[];
  activity: ActivityItem[];
  confirm: ConfirmRequest | null;
  past: Snapshot[];
  layoutNonce: number;
  challenge: () => PlayableChallenge;
  setChallenge: (id: string) => void;
  onNodesChange: (changes: NodeChange<ArchNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<ArchEdge>[]) => void;
  onConnect: (connection: Connection) => string | null;
  addNode: (
    kind: BlockKind,
    position: { x: number; y: number },
    opts?: { id?: string; label?: string; actor?: "human" | "agent"; skipArrange?: boolean },
  ) => string;
  removeNode: (id: string, actor?: "human" | "agent") => string | null;
  connectBlocks: (
    from: string,
    to: string,
    protocol?: Protocol,
    actor?: "human" | "agent",
    opts?: { skipArrange?: boolean },
  ) => string | null;
  arrangeLayers: (actor?: "human" | "agent", opts?: { recordUndo?: boolean }) => void;
  disconnectBlocks: (from: string, to: string, actor?: "human" | "agent") => string | null;
  setNodeProps: (
    id: string,
    patch: Partial<Pick<ArchNode["data"], "label" | "replicas" | "rpsCapacity" | "hitRate" | "locked">>,
    actor?: "human" | "agent",
  ) => string | null;
  annotateNode: (id: string, finding: Omit<Finding, "id">, actor?: "human" | "agent") => string | null;
  setEdgeProtocol: (id: string, protocol: Protocol) => void;
  selectNode: (id: string | null) => void;
  runSimulation: (ingressRps?: number, actor?: "human" | "agent") => SimResult;
  repairGraph: (actor?: "human" | "agent") => { removed: string[] };
  undo: () => void;
  askToConfirm: (title: string, body: string) => Promise<boolean>;
  resolveConfirm: (ok: boolean) => void;
  log: (actor: "human" | "agent", text: string) => void;
}

export type StoreSet = (partial: Partial<ArchitectureState>) => void;
export type StoreGet = () => ArchitectureState;
