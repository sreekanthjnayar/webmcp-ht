import { applyEdgeChanges, applyNodeChanges, type Connection } from "@xyflow/react";
import { create } from "zustand";
import { CHALLENGES, challengeById } from "./challenges";
import { type ArchEdge, type ArchNode } from "./graph";
import { compareRuns } from "./robustness";
import { simulate } from "./simulate";
import { createGraphActions } from "./store-graph";
import { loadChallenge, nextActivityId } from "./store-helpers";
import type { ArchitectureState } from "./store-types";

export type { ActivityItem, ConfirmRequest } from "./store-types";

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
  onConnect: (connection: Connection) => {
    if (!connection.source || !connection.target) return "Missing endpoint.";
    return get().connectBlocks(connection.source, connection.target, undefined, "human");
  },
  ...createGraphActions(set, get),
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
    const deltaNote = delta
      ? ` · ${delta.direction === "unchanged" ? "same robustness" : `${delta.direction} ${delta.scoreDelta > 0 ? "+" : ""}${delta.scoreDelta}`}`
      : "";
    get().log(
      actor,
      sim.error
        ? `Simulation failed: ${sim.error}`
        : `Ran ${Math.round(sim.ingressRps).toLocaleString()} RPS · robustness ${next.robustness.score} ${next.robustness.grade} · p99 ${Math.round(sim.p99Ms)}ms · errors ${(sim.errorRate * 100).toFixed(1)}% · ${sim.sloPassed ? "SLO pass" : "SLO miss"}${deltaNote}`,
    );
    return next;
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
      activity: [{ id: nextActivityId(), at: Date.now(), actor, text }, ...get().activity].slice(0, 40),
    });
  },
}));

export { CHALLENGES };
