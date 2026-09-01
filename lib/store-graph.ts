import { CATALOG, isBlockKind } from "./catalog";
import { connectError, defaultProtocol, finiteNumber, newBlockId, repairBrokenGraph, type ArchEdge, type ArchNode } from "./graph";
import { findFreePosition, layoutLayers } from "./layout";
import { nextFindingId, pushUndo } from "./store-helpers";
import type { ArchitectureState, StoreGet, StoreSet } from "./store-types";
import type { Finding, Protocol } from "./types";

export function createGraphActions(set: StoreSet, get: StoreGet): Pick<
  ArchitectureState,
  | "addNode"
  | "removeNode"
  | "connectBlocks"
  | "arrangeLayers"
  | "disconnectBlocks"
  | "setNodeProps"
  | "annotateNode"
  | "setEdgeProtocol"
  | "repairGraph"
> {
  return {
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
      const full: Finding = { ...finding, id: nextFindingId() };
      set({
        nodes: get().nodes.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, findings: [...n.data.findings, full] } } : n,
        ),
      });
      get().log(actor, `Noted on ${id}: ${finding.message}`);
      return null;
    },
    setEdgeProtocol: (id, protocol: Protocol) => {
      pushUndo(set, get);
      set({
        edges: get().edges.map((e) => (e.id === id ? { ...e, data: { protocol } } : e)),
        sim: null,
      });
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
  };
}
