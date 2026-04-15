import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

// GET /api/owners/check-mobile?mobile=xxx
export async function GET(req: NextRequest) {
  try {
    const pool = getPool();
    const mobile = (req.nextUrl.searchParams.get("mobile") || "").trim();
    if (!mobile) return NextResponse.json({ error: "mobile is required" }, { status: 400 });
    const result = await pool.query("SELECT 1 FROM owners WHERE mobile=$1 LIMIT 1", [mobile]);
    return NextResponse.json({ exists: result.rows.length > 0 });
  } catch (e: unknown) {
    console.error("GET /api/owners/check-mobile:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
