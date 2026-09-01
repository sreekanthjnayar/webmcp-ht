import { log } from "./lib/logger";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    log.info("Archflow server started", { runtime: "nodejs" });
  } else if (process.env.NEXT_RUNTIME === "edge") {
    log.info("Archflow edge runtime started", { runtime: "edge" });
  }
}

export function onRequestError(
  error: { digest?: string } & Error,
  request: { path: string; method: string; headers: Record<string, string> },
  context: { routerKind: string; routePath: string; routeType: string },
) {
  log.error("request_error", {
    message: error.message,
    digest: error.digest,
    path: request.path,
    method: request.method,
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
  });
}
