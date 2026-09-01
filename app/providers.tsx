"use client";

import { initializeWebMCPPolyfill } from "@mcp-b/webmcp-polyfill";

if (typeof window !== "undefined") {
  initializeWebMCPPolyfill();
}

export function Providers({ children }: { children: React.ReactNode }) {
  return children;
}