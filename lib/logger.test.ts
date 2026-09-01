import { describe, expect, it } from "vitest";
import { log } from "./logger";

describe("logger", () => {
  it("writes JSON lines without throwing", () => {
    expect(() => log.info("test_info", { path: "/api/health" })).not.toThrow();
    expect(() => log.warn("test_warn")).not.toThrow();
    expect(() => log.error("test_error", { digest: "abc" })).not.toThrow();
  });
});
