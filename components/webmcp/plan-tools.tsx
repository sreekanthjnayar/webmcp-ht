"use client";

import { useWebMCP } from "usewebmcp";
import { getStore, json } from "@/components/webmcp/store";
import { applyArchitecturePlan } from "@/lib/apply-plan";

export function WebMcpPlanTools() {
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
      const results = applyArchitecturePlan(list);
      return json({ ok: true, results });
    },
  });

  return null;
}
