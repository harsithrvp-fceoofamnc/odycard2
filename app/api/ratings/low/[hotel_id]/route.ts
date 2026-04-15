import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

// GET /api/ratings/low/[hotel_id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ hotel_id: string }> }) {
  try {
    const pool = getPool();
    const { hotel_id } = await params;
    const result = await pool.query(
      `SELECT low_rating_reason, COUNT(*)::integer AS count
       FROM ratings WHERE hotel_id=$1 AND stars<=2 AND low_rating_reason IS NOT NULL
       GROUP BY low_rating_reason ORDER BY count DESC`,
      [hotel_id]
    );
    return NextResponse.json(result.rows);
  } catch (e: unknown) {
    console.error("GET /api/ratings/low/[hotel_id]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
