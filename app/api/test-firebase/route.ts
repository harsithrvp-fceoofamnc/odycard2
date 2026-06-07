import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) {
      return NextResponse.json({ error: "FIREBASE_SERVICE_ACCOUNT is not set" }, { status: 500 });
    }

    let sa;
    try {
      sa = JSON.parse(raw);
    } catch (e) {
      return NextResponse.json({ error: "JSON.parse failed", detail: String(e), first100: raw.slice(0, 100) }, { status: 500 });
    }

    // Try connecting to Firestore
    const { getDb } = await import("@/lib/firebase");
    const db = getDb();
    const snap = await db.collection("hotels").limit(1).get();

    return NextResponse.json({
      ok: true,
      project_id: sa.project_id,
      client_email: sa.client_email,
      hotels_found: snap.size,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
