import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SITE_COOKIE, verifySiteToken, siteAuthConfigured } from "@/lib/siteAuth";

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

// ── SITE LOGIN ────────────────────────────────────────────────────────────────
// The whole site now sits behind one username and password. This REPLACES the old
// 333221 access code, which was a shared number with no identity behind it that
// could not be changed without a deploy.
//
// It is enforced here, in the middleware, rather than page by page. That matters:
// a per-page check protects only the pages somebody remembered to add it to, while
// this runs before ANY route resolves, so a deep link straight to /bon-bon or
// /admin/whatever hits the same wall as the front door.
//
// Credentials live in SITE_USER / SITE_PASS in the environment. If either is unset
// the site fails CLOSED — everyone is bounced to /enter, which explains what to set.
// A missing env var should lock the door, not leave it open.
//
// After signing in the visitor gets a signed, HttpOnly, 7-day cookie and is not asked
// again — including on the pages they reach from the hub.
const SITE_OPEN = new Set<string>(["/enter"]);

function sitePublic(pathname: string): boolean {
  return (
    SITE_OPEN.has(pathname) ||
    pathname.startsWith("/api/site-auth/") ||   // the sign-in endpoint itself
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    // images, fonts and stylesheets — but NOT .html, which is a page in disguise
    (/\.[a-zA-Z0-9]+$/.test(pathname) && !pathname.endsWith(".html"))
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── the site gate. Nothing below this runs for a signed-out visitor. ──
  if (!sitePublic(pathname)) {
    const token = req.cookies.get(SITE_COOKIE)?.value;
    const signedIn = siteAuthConfigured() && !!(await verifySiteToken(token));
    if (!signedIn) {
      // An API call gets a 401 rather than an HTML redirect, so fetch() sees a clear
      // failure instead of silently parsing a login page as if it were data.
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Not signed in" }, { status: 401 });
      }
      const url = req.nextUrl.clone();
      url.pathname = "/enter";
      url.search = "";
      // remember where they were going, so the deep link still works after signing in
      url.searchParams.set("next", pathname + (req.nextUrl.search || ""));
      return NextResponse.redirect(url);
    }
  }

  // Signed in from here on. The old 333221 demo gate is gone: one login covers the
  // hub and everything reachable from it.
  if (pathname === "/enter") {
    const token = req.cookies.get(SITE_COOKIE)?.value;
    if (siteAuthConfigured() && (await verifySiteToken(token))) {
      const url = req.nextUrl.clone();
      url.pathname = "/hub";
      url.search = "";
      return NextResponse.redirect(url);   // already in — skip the form
    }
    return NextResponse.next();
  }

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

  // The old access-code cookie is no longer consulted: reaching this line means the
  // site login already passed. Left as a constant so the branches below read the same.
  const gated = true;
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

  // Reachable once signed in. The VIT stall pages are listed here because
  // /fest/**/index.html ends in ".html" and so is deliberately NOT covered by isStatic;
  // without the line it falls to the catch-all and bounces to the hub. They are no longer
  // public — the site login in front of this function now covers them too.
  const isFest = pathname === "/bon-bon-stall" || pathname.startsWith("/fest/");
  const isStatic = /\.[a-zA-Z0-9]+$/.test(pathname) && !pathname.endsWith(".html");
  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    isStatic ||
    isFest ||
    pathname === "/" ||
    pathname === "/harsith" ||
    pathname === "/harsith.html" ||
    pathname === "/menu" ||
    pathname.startsWith("/menu/") ||
    pathname.startsWith("/api/gate") ||
    pathname.startsWith("/api/fest/") ||
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
    return NextResponse.next();
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

  // Anything else (legacy paths) → the hub, which is the real front door now.
  const url = req.nextUrl.clone();
  url.pathname = "/hub";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
