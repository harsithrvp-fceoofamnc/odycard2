import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";
import { checkPassword, createToken, SESSION_COOKIE, cookieOptions, ttlForRole, Role } from "@/lib/auth";

// Unified login. One field `identifier`:
//  - staff (supervisor/waiter) log in with their username
//  - the owner (admin) logs in with their mobile or email
// Returns a signed session cookie + where to send them.

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const { identifier, password } = await req.json();
    if (!identifier || !password)
      return NextResponse.json({ error: "Enter your login and password" }, { status: 400 });

    const id = String(identifier).trim();

    // 1) staff by username
    const staffSnap = await db.collection("staff").where("username", "==", id.toLowerCase()).limit(1).get();
    if (!staffSnap.empty) {
      const doc = staffSnap.docs[0];
      const s = doc.data();
      if (s.active === false) return NextResponse.json({ error: "This login has been disabled" }, { status: 403 });
      const ok = await checkPassword(password, s.password_hash);
      if (!ok) return NextResponse.json({ error: "Invalid login or password" }, { status: 401 });
      const role = (s.role as Role) || "waiter";
      const ttl = ttlForRole(role);
      const token = createToken(
        { sub: parseInt(doc.id, 10), role, oid: s.owner_id, bid: s.branch_id ?? null, name: s.name },
        ttl
      );
      const res = NextResponse.json({ ok: true, role, redirect: `/${role}` });
      res.cookies.set(SESSION_COOKIE, token, cookieOptions(ttl));
      return res;
    }

    // 2) owner (admin) by mobile, then email
    let ownerSnap = await db.collection("owners").where("mobile", "==", id).limit(1).get();
    if (ownerSnap.empty)
      ownerSnap = await db.collection("owners").where("gmail", "==", id.toLowerCase()).limit(1).get();

    if (!ownerSnap.empty) {
      const doc = ownerSnap.docs[0];
      const o = doc.data();
      if (!o.password_hash) return NextResponse.json({ error: "This account has no password set" }, { status: 401 });
      const ok = await checkPassword(password, o.password_hash);
      if (!ok) return NextResponse.json({ error: "Invalid login or password" }, { status: 401 });
      const ownerId = parseInt(doc.id, 10);
      const ttl = ttlForRole("admin");
      const token = createToken(
        { sub: ownerId, role: "admin", oid: ownerId, bid: o.hotel_id ?? null, name: o.brand_name },
        ttl
      );
      const res = NextResponse.json({ ok: true, role: "admin", redirect: "/admin" });
      res.cookies.set(SESSION_COOKIE, token, cookieOptions(ttl));
      return res;
    }

    return NextResponse.json({ error: "Invalid login or password" }, { status: 401 });
  } catch (e: unknown) {
    console.error("POST /api/auth/login:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
