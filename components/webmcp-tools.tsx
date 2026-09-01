"use client";

import { WebMcpMutateTools } from "@/components/webmcp/mutate-tools";
import { WebMcpPlanTools } from "@/components/webmcp/plan-tools";
import { WebMcpReadTools } from "@/components/webmcp/read-tools";

export function WebMcpTools() {
  return (
    <>
      <WebMcpReadTools />
      <WebMcpMutateTools />
      <WebMcpPlanTools />
    </>
  );
}
