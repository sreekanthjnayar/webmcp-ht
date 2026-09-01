import { CATALOG, isBlockKind } from "./catalog";
import { beside, defaultAddPosition } from "./layout";
import { useArchitectureStore } from "./store";
import type { BlockKind, Protocol } from "./types";

export function applyArchitecturePlan(ops: Array<Record<string, unknown>>): unknown[] {
  const results: unknown[] = [];
  for (const op of ops) {
    const type = String(op.op ?? op.type ?? "");
    const s = useArchitectureStore.getState();
    if (type === "add_node") {
      const kind = op.kind as BlockKind;
      if (!isBlockKind(String(kind)) || !CATALOG[kind]) {
        results.push({ op, error: "Unknown kind" });
        break;
      }
      const near = typeof op.nearId === "string" ? s.nodes.find((n) => n.id === op.nearId) : null;
      const position = near ? beside(near.position) : defaultAddPosition(s.nodes);
      const id = s.addNode(kind, position, {
        id: typeof op.id === "string" ? op.id : undefined,
        label: typeof op.label === "string" ? op.label : undefined,
        actor: "agent",
        skipArrange: true,
      });
      results.push({ op, id });
    } else if (type === "connect") {
      const err = s.connectBlocks(String(op.from), String(op.to), op.protocol as Protocol | undefined, "agent", {
        skipArrange: true,
      });
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
      const err = s.setNodeProps(
        String(op.id),
        {
          replicas: typeof op.replicas === "number" ? op.replicas : undefined,
          rpsCapacity: typeof op.rpsCapacity === "number" ? op.rpsCapacity : undefined,
          hitRate: typeof op.hitRate === "number" ? op.hitRate : undefined,
        },
        "agent",
      );
      results.push({ op, error: err });
      if (err) break;
    } else {
      results.push({ op, error: `Unknown op ${type}` });
      break;
    }
  }
  useArchitectureStore.getState().arrangeLayers("agent", { recordUndo: false });
  return results;
}
