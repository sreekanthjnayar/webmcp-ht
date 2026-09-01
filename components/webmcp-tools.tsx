"use client";

import { useWebMCP } from "usewebmcp";
import { CATALOG } from "@/lib/catalog";
import { CHALLENGES } from "@/lib/challenges";
import { useArchitectureStore } from "@/lib/store";
import { BLOCK_KINDS, type BlockKind, type FindingSeverity, type Protocol } from "@/lib/types";
import { formatArchitecture, formatCatalog } from "@/lib/webmcp-format";

function getStore() {
  return useArchitectureStore.getState();
}

function json(value: unknown) {
  return value;
}

export function WebMcpTools() {
  useWebMCP({
    name: "get_architecture",
    description:
      "Read the current system-design graph: challenge, nodes (with ids), edges, call trees, and last simulation. Use these ids with other tools.",
    annotations: { readOnlyHint: true },
    execute: async () => {
      const s = getStore();
      return json(formatArchitecture(s.challenge(), s.nodes, s.edges, s.sim));
    },
  });

  useWebMCP({
    name: "get_catalog",
    description: "List block types you can add, their default capacity, and connection rules.",
    annotations: { readOnlyHint: true },
    execute: async () => json(formatCatalog()),
  });

  useWebMCP({
    name: "get_robustness",
    description:
      "Score how robust the last simulation is (0-100) and, if a previous run exists, whether the latest change made the system better or worse.",
    annotations: { readOnlyHint: true },
    execute: async () => {
      const s = getStore();
      if (!s.sim) return json({ ran: false, message: "No simulation yet. Call run_simulation." });
      return json({
        robustness: s.sim.robustness,
        delta: s.sim.delta,
        history: s.simHistory,
        sloPassed: s.sim.sloPassed,
      });
    },
  });

  useWebMCP({
    name: "get_simulation",
    description: "Return the last simulation: utilization, p99, error rate, bottlenecks, SLO pass/fail, robustness, and delta vs the previous run.",
    annotations: { readOnlyHint: true },
    execute: async () => {
      const s = getStore();
      return json(s.sim ?? { ran: false, message: "No simulation yet. Call run_simulation." });
    },
  });

  useWebMCP({
    name: "list_challenges",
    description: "List the four system-design use cases the user can play.",
    annotations: { readOnlyHint: true },
    execute: async () =>
      json(
        CHALLENGES.map((c) => ({
          id: c.id,
          title: c.title,
          subtitle: c.subtitle,
          ingressRps: c.ingressRps,
          slo: c.slo,
        })),
      ),
  });

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
      const s = getStore();
      const near = nearId ? s.nodes.find((n) => n.id === nearId) : null;
      const position = near
        ? { x: near.position.x + 240, y: near.position.y }
        : { x: 80 + s.nodes.length * 24, y: 72 + (s.nodes.length % 4) * 28 };
      const newId = s.addNode(kind as BlockKind, position, { id, label, actor: "agent" });
      if (replicas) s.setNodeProps(newId, { replicas }, "agent");
      return json({ id: newId });
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
      const sim = getStore().runSimulation(ingressRps, "agent");
      return json(sim);
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
      const ok = await getStore().askToConfirm("Remove this block?", `Remove ${node.data.label} (${id}) and its connections.`);
      if (!ok) return json({ ok: false, cancelled: true });
      const err = getStore().removeNode(id, "agent");
      return json(err ? { ok: false, error: err } : { ok: true });
    },
  });

  useWebMCP({
    name: "apply_plan",
    description:
      "Apply a batch of ops in order: add_node, connect, disconnect, set_node_props, remove_node. Confirm once with the human. Prefer add_node with explicit ids so later ops can reference them.",
    inputSchema: {
      type: "object",
      properties: {
        summary: { type: "string" },
        ops: { type: "array", items: { type: "object" } },
      },
      required: ["ops"],
    } as const,
    annotations: { readOnlyHint: false },
    execute: async ({ summary, ops }) => {
      const list = (ops as Array<Record<string, unknown>>) ?? [];
      const ok = await getStore().askToConfirm(
        "Apply architecture plan?",
        `${summary ?? "The agent wants to change the graph."}\n\n${list.length} operations.`,
      );
      if (!ok) return json({ ok: false, cancelled: true });
      const results: unknown[] = [];
      for (const op of list) {
        const type = String(op.op ?? op.type ?? "");
        const s = getStore();
        if (type === "add_node") {
          const kind = op.kind as BlockKind;
          if (!CATALOG[kind]) {
            results.push({ op, error: "Unknown kind" });
            break;
          }
          const near = typeof op.nearId === "string" ? s.nodes.find((n) => n.id === op.nearId) : null;
          const position = near
            ? { x: near.position.x + 240, y: near.position.y }
            : { x: 80 + s.nodes.length * 24, y: 90 };
          const id = s.addNode(kind, position, {
            id: typeof op.id === "string" ? op.id : undefined,
            label: typeof op.label === "string" ? op.label : undefined,
            actor: "agent",
          });
          results.push({ op, id });
        } else if (type === "connect") {
          const err = s.connectBlocks(String(op.from), String(op.to), op.protocol as Protocol | undefined, "agent");
          results.push({ op, error: err });
          if (err) break;
        } else if (type === "disconnect") {
          const err = s.disconnectBlocks(String(op.from), String(op.to), "agent");
          results.push({ op, error: err });
          if (err) break;
        } else if (type === "remove_node") {
          const err = s.removeNode(String(op.id), "agent");
          results.push({ op, error: err });
          if (err) break;
        } else if (type === "set_node_props") {
          const err = s.setNodeProps(String(op.id), {
            replicas: typeof op.replicas === "number" ? op.replicas : undefined,
            rpsCapacity: typeof op.rpsCapacity === "number" ? op.rpsCapacity : undefined,
            hitRate: typeof op.hitRate === "number" ? op.hitRate : undefined,
          }, "agent");
          results.push({ op, error: err });
          if (err) break;
        } else {
          results.push({ op, error: `Unknown op ${type}` });
          break;
        }
      }
      return json({ ok: true, results });
    },
  });

  return null;
}