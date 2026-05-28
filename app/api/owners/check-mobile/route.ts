import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const mobile = (req.nextUrl.searchParams.get("mobile") || "").trim();
    if (!mobile) return NextResponse.json({ error: "mobile is required" }, { status: 400 });

    const snap = await db.collection("owners").where("mobile", "==", mobile).limit(1).get();
    return NextResponse.json({ exists: !snap.empty });
  } catch (e: unknown) {
    console.error("GET /api/owners/check-mobile:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
