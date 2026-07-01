import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { BB, bbDb, bbCreateToken, bbCookieOptions, bbTtl, bbAdminUser, bbAdminPass, BB_COOKIE, BBRole } from "@/lib/bonbon";

// One login for the whole Bon Bon back-of-house.
//  - The owner (admin) authenticates against config (env BONBON_ADMIN_USER/PASS).
//  - Supervisors & waiters authenticate against the bonbon_staff collection (created by the admin).

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    const u = String(username || "").toLowerCase().trim();
    const p = String(password || "");
    if (!u || !p) return NextResponse.json({ error: "Enter your username and password" }, { status: 400 });

    let session: { sub: string; role: BBRole; name: string } | null = null;

    // 1) admin (owner) — config-based, constant-time compare
    if (u === bbAdminUser()) {
      const expected = bbAdminPass();
      const a = Buffer.from(p);
      const b = Buffer.from(expected);
      const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
      if (!ok) return NextResponse.json({ error: "Wrong password" }, { status: 401 });
      session = { sub: "admin", role: "admin", name: "Bon Bon Owner" };
    } else {
      // 2) staff (supervisor / waiter)
      const db = bbDb();
      const snap = await db.collection(BB.staff).where("username", "==", u).limit(1).get();
      if (snap.empty) return NextResponse.json({ error: "No such user" }, { status: 401 });
      const doc = snap.docs[0];
      const d = doc.data();
      if (d.active === false) return NextResponse.json({ error: "This login is disabled" }, { status: 403 });
      const ok = await bcrypt.compare(p, d.password_hash || "");
      if (!ok) return NextResponse.json({ error: "Wrong password" }, { status: 401 });
      session = { sub: doc.id, role: d.role as BBRole, name: d.name || u };
    }

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
