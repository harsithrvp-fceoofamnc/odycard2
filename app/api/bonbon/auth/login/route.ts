import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { BB, bbDb, bbCreateToken, bbCookieOptions, bbTtl, bbAdminUser, bbAdminPass, BB_COOKIE, BBRole } from "@/lib/bonbon";

// One login for the whole Bon Bon back-of-house.
//  - The owner (admin) authenticates against config (env BONBON_ADMIN_USER/PASS).
//  - Supervisors & waiters authenticate against the bonbon_staff collection (created by the admin).

// ── Brute-force throttle ─────────────────────────────────────────────────────
// Without this, someone can machine-gun the owner login until they hit the password.
// In-memory per instance: not perfect across serverless instances, but it turns a
// seconds-long attack into a hopeless one, and costs nothing.
const ATTEMPTS = new Map<string, { n: number; until: number }>();
const MAX_TRIES = 8;
const LOCK_MS = 10 * 60 * 1000; // 10 minutes

function clientKey(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for") || "";
  return (fwd.split(",")[0] || req.headers.get("x-real-ip") || "unknown").trim();
}
function throttled(key: string): number {
  const e = ATTEMPTS.get(key);
  if (!e) return 0;
  if (Date.now() > e.until) { ATTEMPTS.delete(key); return 0; }
  return e.n >= MAX_TRIES ? Math.ceil((e.until - Date.now()) / 60000) : 0;
}
function noteFail(key: string) {
  const e = ATTEMPTS.get(key);
  const n = (e && Date.now() <= e.until ? e.n : 0) + 1;
  ATTEMPTS.set(key, { n, until: Date.now() + LOCK_MS });
  if (ATTEMPTS.size > 5000) ATTEMPTS.clear(); // crude cap so this can't grow unbounded
}

export async function POST(req: NextRequest) {
  try {
    const key = clientKey(req);
    const mins = throttled(key);
    if (mins) {
      return NextResponse.json(
        { error: `Too many failed attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.` },
        { status: 429 }
      );
    }

    const { username, password } = await req.json();
    const u = String(username || "").toLowerCase().trim().slice(0, 64);
    const p = String(password || "").slice(0, 200);
    if (!u || !p) return NextResponse.json({ error: "Enter your username and password" }, { status: 400 });

    let session: { sub: string; role: BBRole; name: string } | null = null;

    // 1) admin (owner) — config-based, constant-time compare
    if (u === bbAdminUser()) {
      const expected = bbAdminPass();
      const a = Buffer.from(p);
      const b = Buffer.from(expected);
      const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
      if (!ok) { noteFail(key); return NextResponse.json({ error: "Wrong password" }, { status: 401 }); }
      session = { sub: "admin", role: "admin", name: "Bon Bon Owner" };
    } else {
      // 2) staff (supervisor / waiter)
      const db = bbDb();
      const snap = await db.collection(BB.staff).where("username", "==", u).limit(1).get();
      if (snap.empty) { noteFail(key); return NextResponse.json({ error: "No such user" }, { status: 401 }); }
      const doc = snap.docs[0];
      const d = doc.data();
      if (d.active === false) return NextResponse.json({ error: "This login is disabled" }, { status: 403 });
      const ok = await bcrypt.compare(p, d.password_hash || "");
      if (!ok) { noteFail(key); return NextResponse.json({ error: "Wrong password" }, { status: 401 }); }
      session = { sub: doc.id, role: d.role as BBRole, name: d.name || u };
    }

    ATTEMPTS.delete(key); // clean slate after a good login
    const ttl = bbTtl(session.role);
    const token = bbCreateToken(session, ttl);
    const res = NextResponse.json({ role: session.role, name: session.name });
    res.cookies.set(BB_COOKIE, token, bbCookieOptions(ttl));
    return res;
  } catch (e) {
    console.error("POST /api/bonbon/auth/login:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
