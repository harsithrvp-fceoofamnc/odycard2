import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Two separate gates live here:
//  1. The DEMO gate (ody_gate cookie, access code 333221) protects the chatbot demo
//     pages (/annapoorna, /restaurant, /ody and their AI/STT APIs).
//  2. The PLATFORM session (ody_session cookie) protects the SaaS dashboards
//     (/admin, /supervisor, /waiter). Full role verification happens server-side in
//     each area's layout; here we only do a cheap "is there a session at all?" check.
// The bb_session token is "<base64url(json)>.<hmac>". The signature is verified server-side
// (requireBB); here we only decode the payload to check it hasn't EXPIRED. Without this, an
// expired cookie still "exists", so staff got let into the dashboard and then every API call
// came back "Not authorised". Now they're sent to the login instead.
function bbSessionAlive(token?: string): boolean {
  if (!token || !token.includes(".")) return false;
  try {
    let b = token.split(".")[0].replace(/-/g, "+").replace(/_/g, "/");
    while (b.length % 4) b += "=";
    const bin = atob(b);
    const json = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
    const p = JSON.parse(json) as { exp?: number };
    return !!p.exp && p.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

// Bon Bon's own domain is the PUBLIC swipe menu only. Any page request on it serves /menu
// (root shows the menu, clean URL, no access gate). Static assets + /menu itself pass through.
const BONBON_MENU_HOSTS = new Set(["bonbonicecreams.com", "www.bonbonicecreams.com"]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const host = (req.headers.get("host") || "").toLowerCase().split(":")[0];
  if (BONBON_MENU_HOSTS.has(host)) {
    const isAsset =
      pathname.startsWith("/_next") ||
      pathname === "/favicon.ico" ||
      (/\.[a-zA-Z0-9]+$/.test(pathname) && !pathname.endsWith(".html"));
    if (pathname.startsWith("/menu") || isAsset) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/menu";
    return NextResponse.rewrite(url);
  }

  const gated = req.cookies.get("ody_gate")?.value === "ok";
  const hasSession = !!req.cookies.get("ody_session")?.value;
  const hasBB = bbSessionAlive(req.cookies.get("bb_session")?.value);

  // Bon Bon back-of-house pages (owner/supervisor/waiter/kitchen) require a Bon Bon staff
  // session. They still sit behind the demo gate below; role is verified in-page.
  const bbProtected =
    pathname.startsWith("/bon-bon/admin") ||
    pathname.startsWith("/bon-bon/manage") ||
    pathname.startsWith("/bon-bon/insights") ||
    pathname.startsWith("/bon-bon/kitchen") ||
    pathname.startsWith("/bon-bon/waiter");

  // Always open: Next internals, static files (not .html), the gate screen and gate API,
  // the public sign-up / login pages.
  const isStatic = /\.[a-zA-Z0-9]+$/.test(pathname) && !pathname.endsWith(".html");
  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    isStatic ||
    pathname === "/" ||
    pathname === "/harsith" ||
    pathname === "/harsith.html" ||
    pathname === "/menu" ||
    pathname.startsWith("/menu/") ||
    pathname.startsWith("/api/gate") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup")
  ) {
    return NextResponse.next();
  }

  // Hub + demo pages + chatbot + its AI + speech-to-text: only after the access code was entered.
  if (
    pathname.startsWith("/hub") ||
    pathname.startsWith("/demos") ||
    pathname.startsWith("/annapoorna") ||
    pathname.startsWith("/restaurant") ||
    pathname.startsWith("/bon-bon") ||
    pathname.startsWith("/bonbon") ||
    pathname.startsWith("/ody") ||
    pathname.startsWith("/api/ody") ||
    pathname.startsWith("/api/bonbon") ||
    pathname.startsWith("/api/stt")
  ) {
    if (gated) {
      // Bon Bon staff pages additionally need a Bon Bon login. Remember where they were headed
      // (incl. any ?outlet=…) so the login can drop them on that exact dashboard afterwards.
      if (bbProtected && !hasBB) {
        const url = req.nextUrl.clone();
        url.pathname = "/bon-bon/login";
        url.search = "";
        url.searchParams.set("next", pathname + (req.nextUrl.search || ""));
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }
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
