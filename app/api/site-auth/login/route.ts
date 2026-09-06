import { NextRequest, NextResponse } from "next/server";
import {
  SITE_COOKIE, SITE_TTL_SEC, createSiteToken, siteUser, sitePass,
  siteAuthConfigured, constantTimeEqual,
} from "@/lib/siteAuth";

export const dynamic = "force-dynamic";

// The only door into the site. Treated as hostile input throughout:
//   • body size capped, so nobody posts a 50 MB "username"
//   • both fields compared in constant time, so timing cannot reveal a prefix
//   • the username is checked too, not just the password — otherwise the username
//     field is decorative and the search space is only the password
//   • wrong attempts are throttled per IP, and the IP is hashed, never stored
//   • the response never says WHICH field was wrong

const BODY_MAX = 2 * 1024;
const MAX_TRIES = 8;
const LOCK_MS = 15 * 60 * 1000;

const ATTEMPTS = new Map<string, { n: number; until: number }>();

async function clientKey(req: NextRequest): Promise<string> {
  const fwd = req.headers.get("x-forwarded-for") || "";
  const raw = (fwd.split(",")[0] || req.headers.get("x-real-ip") || "unknown").trim();
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(buf)).slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function lockedFor(key: string): number {
  const e = ATTEMPTS.get(key);
  if (!e) return 0;
  if (Date.now() > e.until) { ATTEMPTS.delete(key); return 0; }
  return e.n >= MAX_TRIES ? Math.ceil((e.until - Date.now()) / 60000) : 0;
}
function noteFail(key: string) {
  const e = ATTEMPTS.get(key);
  const n = (e && Date.now() <= e.until ? e.n : 0) + 1;
  ATTEMPTS.set(key, { n, until: Date.now() + LOCK_MS });
  if (ATTEMPTS.size > 5000) ATTEMPTS.clear();
}

export async function POST(req: NextRequest) {
  if (!siteAuthConfigured()) {
    // Fail closed, and say so plainly — this is the owner's own error to fix.
    return NextResponse.json(
      { error: "Sign-in is not configured. Set SITE_USER and SITE_PASS in the environment." },
      { status: 503 }
    );
  }

  const key = await clientKey(req);
  const mins = lockedFor(key);
  if (mins) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.` },
      { status: 429 }
    );
  }

  let user = "", pass = "";
  try {
    const text = await req.text();
    if (text.length > BODY_MAX) return NextResponse.json({ error: "Bad request" }, { status: 400 });
    const b = JSON.parse(text) as Record<string, unknown>;
    user = typeof b.user === "string" ? b.user.trim() : "";
    pass = typeof b.pass === "string" ? b.pass : "";
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  // Both compared, and both compared in full — no early return on a username miss.
  const okUser = constantTimeEqual(user.toLowerCase(), siteUser().toLowerCase());
  const okPass = constantTimeEqual(pass, sitePass());
  if (!okUser || !okPass) {
    noteFail(key);
    return NextResponse.json({ error: "Wrong username or password" }, { status: 401 });
  }

  ATTEMPTS.delete(key);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SITE_COOKIE, await createSiteToken(siteUser()), {
    httpOnly: true,                                   // JavaScript on the page cannot read it
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",                                  // not sent on cross-site POSTs
    path: "/",
    maxAge: SITE_TTL_SEC,
  });
  return res;
}
