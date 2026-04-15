import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

// POST /api/ratings/remove
export async function POST(req: NextRequest) {
  try {
    const pool = getPool();
    const { dish_id, visitor_name } = await req.json();
    if (!dish_id) return NextResponse.json({ error: "dish_id required" }, { status: 400 });

    await pool.query(
      `DELETE FROM ratings WHERE id=(
        SELECT id FROM ratings WHERE dish_id=$1 AND (visitor_name=$2 OR ($2 IS NULL AND visitor_name IS NULL))
        ORDER BY id DESC LIMIT 1
      )`,
      [dish_id, visitor_name ?? null]
    );
    const summary = await pool.query(
      `SELECT ROUND(AVG(stars)::numeric,1) AS avg_rating, COUNT(*) AS rating_count FROM ratings WHERE dish_id=$1`,
      [dish_id]
    );
    return NextResponse.json({
      avg_rating: parseFloat(summary.rows[0].avg_rating) || 0,
      rating_count: parseInt(summary.rows[0].rating_count) || 0,
    });
  } catch (e: unknown) {
    console.error("POST /api/ratings/remove:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
