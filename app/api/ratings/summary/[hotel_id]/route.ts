import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

// GET /api/ratings/summary/[hotel_id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ hotel_id: string }> }) {
  try {
    const pool = getPool();
    const { hotel_id } = await params;
    const summary = await pool.query(
      `SELECT
         COUNT(*)::integer AS total_ratings,
         ROUND(AVG(stars)::numeric,1) AS avg_rating,
         COUNT(CASE WHEN stars=5 THEN 1 END)::integer AS five_star,
         COUNT(CASE WHEN stars=4 THEN 1 END)::integer AS four_star,
         COUNT(CASE WHEN stars=3 THEN 1 END)::integer AS three_star,
         COUNT(CASE WHEN stars=2 THEN 1 END)::integer AS two_star,
         COUNT(CASE WHEN stars=1 THEN 1 END)::integer AS one_star
       FROM ratings WHERE hotel_id=$1`,
      [hotel_id]
    );
    return NextResponse.json(summary.rows[0]);
  } catch (e: unknown) {
    console.error("GET /api/ratings/summary/[hotel_id]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
