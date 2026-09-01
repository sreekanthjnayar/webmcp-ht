import { describe, expect, it } from "vitest";
import { challengeById } from "./challenges";
import { formatSelectedNode } from "./webmcp-format";

describe("formatSelectedNode", () => {
  it("explains that nothing is selected", () => {
    const c = challengeById("url-shortener");
    const out = formatSelectedNode(c.starter.nodes, c.starter.edges, null, null);
    expect(out.selected).toBe(false);
    expect("message" in out && out.message).toMatch(/No block is selected/);
  });

  it("returns the selected block and what it means", () => {
    const c = challengeById("url-shortener");
    const out = formatSelectedNode(c.starter.nodes, c.starter.edges, "database-1", null);
    expect(out.selected).toBe(true);
    if (!out.selected) return;
    expect(out.node.id).toBe("database-1");
    expect(out.node.kind).toBe("database");
    expect(out.meaning.label).toBe("Database");
    expect(out.meaning.blurb).toMatch(/bottleneck/i);
    expect(out.meaning.outbound).toMatch(/No outgoing/);
    expect(out.neighbors.incoming).toEqual([
      expect.objectContaining({ from: "api-1" }),
    ]);
    expect(out.neighbors.outgoing).toEqual([]);
    expect(out.simulation).toBeNull();
  });
});
