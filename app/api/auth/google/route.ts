import { NextRequest, NextResponse } from "next/server";
import { getDb, getNextId, getAdminAuth } from "@/lib/firebase";
import { createToken, SESSION_COOKIE, cookieOptions, TTL_ADMIN } from "@/lib/auth";

// Real Google sign-in. The browser signs in with Firebase Auth and sends us the ID token;
// we verify it server-side with the admin SDK, then find or create the owner (admin) account.
// New accounts have no hotel yet → we send them to /signup/details to add brand + first branch.

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) return NextResponse.json({ error: "Missing token" }, { status: 400 });

    let decoded;
    try {
      decoded = await getAdminAuth().verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: "Could not verify your Google sign-in" }, { status: 401 });
    }

    const email = (decoded.email || "").toLowerCase();
    if (!email) return NextResponse.json({ error: "Your Google account has no email" }, { status: 400 });
    const name = decoded.name || email.split("@")[0];
    const uid = decoded.uid;

    const db = getDb();
    const snap = await db.collection("owners").where("gmail", "==", email).limit(1).get();

    let ownerId: number;
    let hotelId: number | null;
    let displayName = name;

    if (!snap.empty) {
      const doc = snap.docs[0];
      const o = doc.data();
      ownerId = parseInt(doc.id, 10);
      hotelId = o.hotel_id ?? null;
      displayName = o.brand_name || name;
      // backfill the firebase uid if this owner first signed up another way
      if (!o.firebase_uid) await doc.ref.set({ firebase_uid: uid }, { merge: true });
    } else {
      ownerId = await getNextId("owners");
      hotelId = null;
      await db.collection("owners").doc(String(ownerId)).set({
        gmail: email,
        firebase_uid: uid,
        name,
        mobile: null,
        password_hash: null,
        hotel_id: null,
        brand_name: null,
        brand_slug: null,
        signup_method: "google",
        role: "admin",
        created_at: new Date().toISOString(),
      });
    }

    const token = createToken({ sub: ownerId, role: "admin", oid: ownerId, bid: hotelId, name: displayName }, TTL_ADMIN);
    const redirect = hotelId ? "/admin" : "/signup/details";
    const res = NextResponse.json({ ok: true, redirect, needsSetup: !hotelId });
    res.cookies.set(SESSION_COOKIE, token, cookieOptions(TTL_ADMIN));
    return res;
  } catch (e: unknown) {
    console.error("POST /api/auth/google:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
