import { challengeById } from "./challenges";
import { normalizeNode, type ArchEdge, type ArchNode } from "./graph";
import type { ArchitectureState, Snapshot, StoreGet, StoreSet } from "./store-types";

export function cloneGraph(nodes: ArchNode[], edges: ArchEdge[]): Snapshot {
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

export function loadChallenge(id: string): Pick<
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

export function nextActivityId(): string {
  return `a-${activitySeq++}`;
}

export function nextFindingId(): string {
  return `f-${findingSeq++}`;
}

export function pushUndo(set: StoreSet, get: StoreGet) {
  const snap = cloneGraph(get().nodes, get().edges);
  set({ past: [...get().past, snap].slice(-24) });
}
