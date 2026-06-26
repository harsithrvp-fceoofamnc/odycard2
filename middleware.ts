import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Two separate gates live here:
//  1. The DEMO gate (ody_gate cookie, access code 333221) protects the chatbot demo
//     pages (/annapoorna, /restaurant, /ody and their AI/STT APIs).
//  2. The PLATFORM session (ody_session cookie) protects the SaaS dashboards
//     (/admin, /supervisor, /waiter). Full role verification happens server-side in
//     each area's layout; here we only do a cheap "is there a session at all?" check.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const gated = req.cookies.get("ody_gate")?.value === "ok";
  const hasSession = !!req.cookies.get("ody_session")?.value;

  // Always open: Next internals, static files (not .html), the gate screen and gate API,
  // the public sign-up / login pages.
  const isStatic = /\.[a-zA-Z0-9]+$/.test(pathname) && !pathname.endsWith(".html");
  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    isStatic ||
    pathname === "/" ||
    pathname.startsWith("/api/gate") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup")
  ) {
    return NextResponse.next();
  }

  // Demo chatbot + its AI + speech-to-text: only after the access code was entered.
  if (
    pathname.startsWith("/annapoorna") ||
    pathname.startsWith("/restaurant") ||
    pathname.startsWith("/ody") ||
    pathname.startsWith("/api/ody") ||
    pathname.startsWith("/api/stt")
  ) {
    if (gated) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/";
    if (pathname.startsWith("/annapoorna") || pathname.startsWith("/restaurant")) url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Platform dashboards: require a session cookie (role checked server-side in the layout).
  if (pathname.startsWith("/admin") || pathname.startsWith("/supervisor") || pathname.startsWith("/waiter")) {
    if (hasSession) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // All other APIs enforce their own auth — let them through.
  if (pathname.startsWith("/api/")) return NextResponse.next();

  // Anything else (legacy paths) → back to the gate.
  const url = req.nextUrl.clone();
  url.pathname = "/";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
