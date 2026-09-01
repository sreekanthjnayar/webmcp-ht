import { NextResponse } from "next/server";
import { log } from "@/lib/logger";

export function GET() {
  log.info("health_check");
  return NextResponse.json({ ok: true, service: "archflow" });
}
