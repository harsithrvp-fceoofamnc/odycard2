import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Gate the whole site behind a code. Only the chatbot is shown after unlocking;
// the previous project is never served publicly.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always-open: Next internals, the gate page + its API, and static assets (not .html)
  const isStatic = /\.[a-zA-Z0-9]+$/.test(pathname) && !pathname.endsWith(".html");
  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/api/gate") ||
    pathname === "/gate" ||
    isStatic
  ) {
    return NextResponse.next();
  }

  const authed = req.cookies.get("ody_gate")?.value === "ok";

  // Not unlocked → show the code screen
  if (!authed) {
    const url = req.nextUrl.clone();
    url.pathname = "/gate";
    return NextResponse.rewrite(url);
  }

  // Unlocked → serve ONLY the chatbot (and its AI API). Everything else maps to the chatbot.
  if (pathname.startsWith("/ody") || pathname.startsWith("/api/ody")) {
    return NextResponse.next();
  }
  const url = req.nextUrl.clone();
  url.pathname = "/ody/index.html";
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
