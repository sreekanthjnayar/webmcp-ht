import { NextResponse, type NextRequest } from "next/server";
import { log } from "./lib/logger";

const SKIP = /^\/(_next|favicon\.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff2?))$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!SKIP.test(pathname)) {
    log.info("request", { method: request.method, path: pathname });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
