import { applyEdgeChanges, applyNodeChanges, type Connection, type EdgeChange, type NodeChange } from "@xyflow/react";
import { create } from "zustand";
import { CATALOG, isBlockKind } from "./catalog";
import { CHALLENGES, challengeById, type PlayableChallenge } from "./challenges";
import {
  connectError,
  defaultProtocol,
  finiteNumber,
  newBlockId,
  normalizeNode,
  repairBrokenGraph,
  type ArchEdge,
  type ArchNode,
} from "./graph";
import { findFreePosition, layoutLayers } from "./layout";
import { compareRuns } from "./robustness";
import { simulate } from "./simulate";
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

interface Snapshot {
  nodes: ArchNode[];
  edges: ArchEdge[];
}

interface ArchitectureState {
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

function cloneGraph(nodes: ArchNode[], edges: ArchEdge[]): Snapshot {
  return {
    nodes: nodes.map((n) => {
      const node = normalizeNode(n);
      return {
        ...node,
        position: { ...node.position },
        data: { ...node.data, findings: node.data.findings.map((f) => ({ ...f })) },
      };
    }),
    edges: edges.map((e) => ({ ...e, data: { ...e.data! } })),
  };
}

function loadChallenge(id: string): Pick<
  ArchitectureState,
  "challengeId" | "nodes" | "edges" | "sim" | "previousSim" | "simHistory" | "selectedNodeId"
> {
  const c = challengeById(id);
  const snap = cloneGraph(c.starter.nodes, c.starter.edges);
  return {
    challengeId: c.id,
    nodes: snap.nodes,
    edges: snap.edges,
    sim: null,
    previousSim: null,
    simHistory: [],
    selectedNodeId: null,
  };
}

let activitySeq = 1;
let findingSeq = 1;

export const useArchitectureStore = create<ArchitectureState>((set, get) => ({
  ...loadChallenge(CHALLENGES[0].id),
  activity: [],
  confirm: null,
  past: [],
  layoutNonce: 0,
  challenge: () => challengeById(get().challengeId),
  setChallenge: (id) => {
    set({ ...loadChallenge(id), past: [], activity: [] });
  },
  onNodesChange: (changes) => {
    const removed = changes.filter((c) => c.type === "remove").map((c) => c.id);
    const selectChanges = changes.filter((c) => c.type === "select");
    let selectedNodeId = get().selectedNodeId;
    if (selectChanges.length) {
      const picked = selectChanges.find((c) => c.type === "select" && c.selected);
      selectedNodeId = picked && picked.type === "select" ? picked.id : null;
    }
    if (removed.includes(selectedNodeId ?? "")) selectedNodeId = null;
    set({
      nodes: applyNodeChanges(changes, get().nodes) as ArchNode[],
      edges: removed.length
        ? (get().edges.filter((e) => !removed.includes(e.source) && !removed.includes(e.target)) as ArchEdge[])
        : get().edges,
      selectedNodeId,
    });
  },
  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) as ArchEdge[], sim: null });
  },
  onConnect: (connection) => {
    if (!connection.source || !connection.target) return "Missing endpoint.";
    return get().connectBlocks(connection.source, connection.target, undefined, "human");
  },
  addNode: (kind, position, opts) => {
    const { nodes } = get();
    if (!isBlockKind(kind) || !CATALOG[kind]) {
      get().log(opts?.actor ?? "human", `Cannot add unknown block kind "${String(kind)}"`);
      return "";
    }
    pushUndo(set, get);
    const spec = CATALOG[kind];
    const id = opts?.id && !nodes.some((n) => n.id === opts.id) ? opts.id : newBlockId(kind, nodes.map((n) => n.id));
    const actor = opts?.actor ?? "human";
    const node: ArchNode = {
      id,
      type: "block",
      position: findFreePosition(nodes, position),
      data: {
        kind,
        label: opts?.label ?? spec.label,
        replicas: spec.replicas,
        rpsCapacity: spec.rpsCapacity,
        baseLatencyMs: spec.baseLatencyMs,
        hitRate: spec.hitRate,
        findings: [],
      },
    };
    set({ nodes: [...nodes, node], sim: null });
    if (actor === "agent" && !opts?.skipArrange) {
      get().arrangeLayers("agent", { recordUndo: false });
    }
    get().log(actor, `Added ${spec.label} (${id})`);
    return id;
  },
  removeNode: (id, actor = "agent") => {
    const node = get().nodes.find((n) => n.id === id);
    if (!node) return `No block with id ${id}.`;
    if (node.data.locked) return `${id} is locked. Unlock it before removing.`;
    pushUndo(set, get);
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
      sim: null,
    });
    get().log(actor, `Removed ${node.data.label} (${id})`);
    return null;
  },
  connectBlocks: (from, to, protocol, actor = "agent", opts) => {
    const { nodes, edges } = get();
    const err = connectError(nodes, edges, from, to);
    if (err) return err;
    const target = nodes.find((n) => n.id === to)!;
    pushUndo(set, get);
    const id = `${from}->${to}`;
    const edge: ArchEdge = {
      id: edges.some((e) => e.id === id) ? `${id}-${edges.length}` : id,
      source: from,
      target: to,
      type: "packet",
      data: { protocol: protocol ?? defaultProtocol(target.data.kind) },
    };
    set({ edges: [...edges, edge], sim: null });
    if (actor === "agent" && !opts?.skipArrange) {
      get().arrangeLayers("agent", { recordUndo: false });
    }
    get().log(actor, `Connected ${from} → ${to}`);
    return null;
  },
  arrangeLayers: (actor = "human", opts) => {
    const { nodes, edges } = get();
    if (nodes.length === 0) return;
    if (opts?.recordUndo !== false) pushUndo(set, get);
    set({
      nodes: layoutLayers(nodes, edges),
      layoutNonce: get().layoutNonce + 1,
    });
    if (opts?.recordUndo !== false) {
      get().log(actor, "Arranged blocks into request-path layers");
    }
  },
  disconnectBlocks: (from, to, actor = "agent") => {
    const { edges } = get();
    if (!edges.some((e) => e.source === from && e.target === to)) {
      return `No edge from ${from} to ${to}.`;
    }
    pushUndo(set, get);
    set({
      edges: edges.filter((e) => !(e.source === from && e.target === to)),
      sim: null,
    });
    get().log(actor, `Disconnected ${from} → ${to}`);
    return null;
  },
  setNodeProps: (id, patch, actor = "agent") => {
    const node = get().nodes.find((n) => n.id === id);
    if (!node) return `No block with id ${id}.`;
    if (node.data.locked && actor === "agent") return `${id} is locked.`;
    pushUndo(set, get);
    set({
      nodes: get().nodes.map((n) =>
        n.id === id
          ? {
              ...n,
              data: {
                ...n.data,
                ...patch,
                replicas: patch.replicas != null ? Math.max(1, Math.round(finiteNumber(patch.replicas, n.data.replicas))) : n.data.replicas,
                rpsCapacity:
                  patch.rpsCapacity != null
                    ? Math.max(0, finiteNumber(patch.rpsCapacity, n.data.rpsCapacity))
                    : n.data.rpsCapacity,
                hitRate:
                  patch.hitRate != null
                    ? Math.min(0.99, Math.max(0, finiteNumber(patch.hitRate, n.data.hitRate ?? 0)))
                    : n.data.hitRate,
              },
            }
          : n,
      ),
      sim: null,
    });
    get().log(actor, `Updated ${id}`);
    return null;
  },
  annotateNode: (id, finding, actor = "agent") => {
    const node = get().nodes.find((n) => n.id === id);
    if (!node) return `No block with id ${id}.`;
    const full: Finding = { ...finding, id: `f-${findingSeq++}` };
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, findings: [...n.data.findings, full] } } : n,
      ),
    });
    get().log(actor, `Noted on ${id}: ${finding.message}`);
    return null;
  },
  setEdgeProtocol: (id, protocol) => {
    pushUndo(set, get);
    set({
      edges: get().edges.map((e) => (e.id === id ? { ...e, data: { protocol } } : e)),
      sim: null,
    });
  },
  selectNode: (id) => set({ selectedNodeId: id }),
  runSimulation: (ingressRps, actor = "human") => {
    const c = get().challenge();
    const previous = get().sim;
    const sim = simulate(get().nodes, get().edges, ingressRps ?? c.ingressRps, c.slo);
    const delta = previous ? compareRuns(previous, sim) : null;
    const next = { ...sim, delta };
    set({
      sim: next,
      previousSim: previous,
      simHistory: [...get().simHistory, next.robustness.score].slice(-8),
    });
    const deltaNote = delta ? ` · ${delta.direction === "unchanged" ? "same robustness" : `${delta.direction} ${delta.scoreDelta > 0 ? "+" : ""}${delta.scoreDelta}`}` : "";
    get().log(
      actor,
      sim.error
        ? `Simulation failed: ${sim.error}`
        : `Ran ${Math.round(sim.ingressRps).toLocaleString()} RPS · robustness ${next.robustness.score} ${next.robustness.grade} · p99 ${Math.round(sim.p99Ms)}ms · errors ${(sim.errorRate * 100).toFixed(1)}% · ${sim.sloPassed ? "SLO pass" : "SLO miss"}${deltaNote}`,
    );
    return next;
  },
  repairGraph: (actor = "human") => {
    const { nodes, edges, removed } = repairBrokenGraph(get().nodes, get().edges);
    pushUndo(set, get);
    set({
      nodes,
      edges,
      sim: null,
      selectedNodeId: removed.includes(get().selectedNodeId ?? "") ? null : get().selectedNodeId,
    });
    get().log(
      actor,
      removed.length
        ? `Repaired graph · removed ${removed.join(", ")}`
        : "Repaired graph · dropped dangling edges",
    );
    return { removed };
  },
  undo: () => {
    const past = get().past;
    const prev = past[past.length - 1];
    if (!prev) return;
    set({
      nodes: prev.nodes,
      edges: prev.edges,
      past: past.slice(0, -1),
      sim: null,
    });
  },
  askToConfirm: (title, body) =>
    new Promise<boolean>((resolve) => {
      set({ confirm: { title, body, resolve } });
    }),
  resolveConfirm: (ok) => {
    const c = get().confirm;
    c?.resolve(ok);
    set({ confirm: null });
  },
  log: (actor, text) => {
    set({
      activity: [
        { id: `a-${activitySeq++}`, at: Date.now(), actor, text },
        ...get().activity,
      ].slice(0, 40),
    });
  },
}));

function pushUndo(
  set: (partial: Partial<ArchitectureState>) => void,
  get: () => ArchitectureState,
) {
  const snap = cloneGraph(get().nodes, get().edges);
  set({ past: [...get().past, snap].slice(-24) });
}

export { CHALLENGES };