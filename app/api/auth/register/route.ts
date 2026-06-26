import { NextRequest, NextResponse } from "next/server";
import { getDb, getNextId } from "@/lib/firebase";
import { hashPassword, createToken, SESSION_COOKIE, cookieOptions, TTL_ADMIN } from "@/lib/auth";

// Email sign-up — step 1 of 2. Creates the admin account only (no hotel yet),
// then sends them to /signup/details to add brand + first branch.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const { email, password } = await req.json();
    const mail = String(email || "").toLowerCase().trim();

    if (!EMAIL_RE.test(mail)) return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    if (String(password || "").length < 8)
      return NextResponse.json({ error: "Use at least 8 characters for your password" }, { status: 400 });

    const existing = await db.collection("owners").where("gmail", "==", mail).limit(1).get();
    if (!existing.empty) return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });

    const password_hash = await hashPassword(password, true);
    const ownerId = await getNextId("owners");
    await db.collection("owners").doc(String(ownerId)).set({
      gmail: mail,
      mobile: null,
      password_hash,
      firebase_uid: null,
      name: mail.split("@")[0],
      hotel_id: null,
      brand_name: null,
      brand_slug: null,
      signup_method: "email",
      role: "admin",
      created_at: new Date().toISOString(),
    });

    const token = createToken({ sub: ownerId, role: "admin", oid: ownerId, bid: null, name: mail.split("@")[0] }, TTL_ADMIN);
    const res = NextResponse.json({ ok: true, redirect: "/signup/details", needsSetup: true }, { status: 201 });
    res.cookies.set(SESSION_COOKIE, token, cookieOptions(TTL_ADMIN));
    return res;
  } catch (e: unknown) {
    console.error("POST /api/auth/register:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
