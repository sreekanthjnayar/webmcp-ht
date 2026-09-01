"use client";

import { useWebMCP } from "usewebmcp";
import { getStore, json } from "@/components/webmcp/store";
import { CHALLENGES } from "@/lib/challenges";
import { formatArchitecture, formatCatalog, formatSelectedNode } from "@/lib/webmcp-format";

export function WebMcpReadTools() {
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
    name: "get_selected_node",
    description:
      "Return the block the human currently has selected on the canvas, what that kind of block means, its connection rules, neighbors, and last-run stats for it. Call this when they ask about the selected node.",
    annotations: { readOnlyHint: true },
    execute: async () => {
      const s = getStore();
      return json(formatSelectedNode(s.nodes, s.edges, s.selectedNodeId, s.sim));
    },
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
    description:
      "Return the last simulation: utilization, p99, error rate, bottlenecks, SLO pass/fail, robustness, and delta vs the previous run.",
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

  return null;
}
