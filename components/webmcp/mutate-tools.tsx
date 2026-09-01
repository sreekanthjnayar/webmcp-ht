"use client";

import { useWebMCP } from "usewebmcp";
import { getStore, json } from "@/components/webmcp/store";
import { isBlockKind } from "@/lib/catalog";
import { beside, defaultAddPosition } from "@/lib/layout";
import { formatArchitecture } from "@/lib/webmcp-format";
import { BLOCK_KINDS, type FindingSeverity, type Protocol } from "@/lib/types";

export function WebMcpMutateTools() {
  useWebMCP({
    name: "load_challenge",
    description:
      "Reset the canvas to a use case starter sketch. Ids: url-shortener, news-feed, realtime-chat, video-streaming.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          enum: ["url-shortener", "news-feed", "realtime-chat", "video-streaming"],
        },
      },
      required: ["id"],
    } as const,
    annotations: { readOnlyHint: false },
    execute: async ({ id }) => {
      getStore().setChallenge(id);
      const s = getStore();
      return json({ loaded: id, architecture: formatArchitecture(s.challenge(), s.nodes, s.edges, s.sim) });
    },
  });

  useWebMCP({
    name: "add_node",
    description: "Add a block to the canvas. Optional id (stable name), label, and nearId to place it beside an existing block.",
    inputSchema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: BLOCK_KINDS },
        id: { type: "string", description: "Optional stable id, e.g. cache-1" },
        label: { type: "string" },
        nearId: { type: "string", description: "Place to the right of this node" },
        replicas: { type: "number" },
      },
      required: ["kind"],
    } as const,
    annotations: { readOnlyHint: false },
    execute: async ({ kind, id, label, nearId, replicas }) => {
      try {
        if (!isBlockKind(kind)) {
          return json({ ok: false, error: `Unknown block kind "${kind}". Call get_catalog.` });
        }
        const s = getStore();
        const near = nearId ? s.nodes.find((n) => n.id === nearId) : null;
        const position = near ? beside(near.position) : defaultAddPosition(s.nodes);
        const newId = s.addNode(kind, position, { id, label, actor: "agent" });
        if (!newId) return json({ ok: false, error: `Could not add ${kind}.` });
        if (replicas) s.setNodeProps(newId, { replicas }, "agent");
        return json({ ok: true, id: newId });
      } catch (err) {
        return json({ ok: false, error: err instanceof Error ? err.message : String(err) });
      }
    },
  });

  useWebMCP({
    name: "connect",
    description: "Connect two blocks left-to-right. Incoming edges to a queue default to async (off the p99 path).",
    inputSchema: {
      type: "object",
      properties: {
        from: { type: "string" },
        to: { type: "string" },
        protocol: { type: "string", enum: ["sync", "async"] },
      },
      required: ["from", "to"],
    } as const,
    annotations: { readOnlyHint: false },
    execute: async ({ from, to, protocol }) => {
      const err = getStore().connectBlocks(from, to, protocol as Protocol | undefined, "agent");
      return json(err ? { ok: false, error: err } : { ok: true });
    },
  });

  useWebMCP({
    name: "disconnect",
    description: "Remove the edge between two blocks.",
    inputSchema: {
      type: "object",
      properties: {
        from: { type: "string" },
        to: { type: "string" },
      },
      required: ["from", "to"],
    } as const,
    annotations: { readOnlyHint: false },
    execute: async ({ from, to }) => {
      const err = getStore().disconnectBlocks(from, to, "agent");
      return json(err ? { ok: false, error: err } : { ok: true });
    },
  });

  useWebMCP({
    name: "set_node_props",
    description: "Change replicas, per-replica RPS capacity, cache hit rate, or lock a node.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        replicas: { type: "number" },
        rpsCapacity: { type: "number" },
        hitRate: { type: "number" },
        label: { type: "string" },
        locked: { type: "boolean" },
      },
      required: ["id"],
    } as const,
    annotations: { readOnlyHint: false },
    execute: async ({ id, ...patch }) => {
      const err = getStore().setNodeProps(id, patch, "agent");
      return json(err ? { ok: false, error: err } : { ok: true });
    },
  });

  useWebMCP({
    name: "annotate_node",
    description: "Pin a finding on a block so the human can see it on the graph.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        severity: { type: "string", enum: ["info", "warn", "error"] },
        message: { type: "string" },
      },
      required: ["id", "message"],
    } as const,
    annotations: { readOnlyHint: false },
    execute: async ({ id, severity, message }) => {
      const err = getStore().annotateNode(
        id,
        { source: "agent", severity: (severity as FindingSeverity) ?? "info", message },
        "agent",
      );
      return json(err ? { ok: false, error: err } : { ok: true });
    },
  });

  useWebMCP({
    name: "run_simulation",
    description: "Push traffic through the graph, animate packets, color bottlenecks, and evaluate the challenge SLO.",
    inputSchema: {
      type: "object",
      properties: {
        ingressRps: { type: "number", description: "Override challenge RPS for a what-if." },
      },
    } as const,
    annotations: { readOnlyHint: false },
    execute: async ({ ingressRps }) => {
      try {
        const sim = getStore().runSimulation(ingressRps, "agent");
        return json(sim);
      } catch (err) {
        return json({ ok: false, error: err instanceof Error ? err.message : String(err) });
      }
    },
  });

  useWebMCP({
    name: "remove_node",
    description: "Remove a block and its edges. Asks the human to confirm.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    } as const,
    annotations: { readOnlyHint: false },
    execute: async ({ id }) => {
      const node = getStore().nodes.find((n) => n.id === id);
      if (!node) return json({ ok: false, error: `No block with id ${id}.` });
      const ok = await getStore().askToConfirm(
        "Remove this block?",
        `Remove ${node.data?.label ?? id} (${id}) and its connections.`,
      );
      if (!ok) return json({ ok: false, cancelled: true });
      const err = getStore().removeNode(id, "agent");
      return json(err ? { ok: false, error: err } : { ok: true });
    },
  });

  useWebMCP({
    name: "repair_graph",
    description:
      "Drop dangling edges and remove broken blocks (unknown kinds or corrupt data) so the canvas can run again.",
    annotations: { readOnlyHint: false },
    execute: async () => {
      try {
        const result = getStore().repairGraph("agent");
        const s = getStore();
        return json({
          ok: true,
          removed: result.removed,
          architecture: formatArchitecture(s.challenge(), s.nodes, s.edges, s.sim),
        });
      } catch (err) {
        return json({ ok: false, error: err instanceof Error ? err.message : String(err) });
      }
    },
  });

  return null;
}
