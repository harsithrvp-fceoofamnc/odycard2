import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// The homepage (/) is ALWAYS the access-code screen — it re-asks on every load/refresh.
// The chatbot (/ody) and its AI (/api/ody) only load once the code has been entered
// (a session cookie is set after a correct code). The old project is never served.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = req.cookies.get("ody_gate")?.value === "ok";

  // Always open: Next internals, static files (not .html), the gate screen (root) and the gate API.
  const isStatic = /\.[a-zA-Z0-9]+$/.test(pathname) && !pathname.endsWith(".html");
  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    isStatic ||
    pathname === "/" ||
    pathname.startsWith("/api/gate")
  ) {
    return NextResponse.next();
  }

  // Annapoorna pages + chatbot + its AI + speech-to-text: only after the code was entered.
  if (
    pathname.startsWith("/annapoorna") ||
    pathname.startsWith("/restaurant") ||
    pathname.startsWith("/ody") ||
    pathname.startsWith("/api/ody") ||
    pathname.startsWith("/api/stt")
  ) {
    if (authed) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/";
    // Remember the branch link they came from, so the password screen returns them there.
    if (pathname.startsWith("/annapoorna") || pathname.startsWith("/restaurant")) url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Anything else (the old project) → back to the gate.
  const url = req.nextUrl.clone();
  url.pathname = "/";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
