import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

// POST /api/ratings — submit rating
export async function POST(req: NextRequest) {
  try {
    const pool = getPool();
    const { hotel_id, dish_id, stars, low_rating_reason, comment, visitor_name } = await req.json();

    if (!hotel_id || !stars) return NextResponse.json({ error: "hotel_id and stars are required" }, { status: 400 });
    if (stars < 1 || stars > 5) return NextResponse.json({ error: "stars must be between 1 and 5" }, { status: 400 });

    const result = await pool.query(
      `INSERT INTO ratings (hotel_id,dish_id,stars,low_rating_reason,comment,visitor_name)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [hotel_id, dish_id ?? null, stars, low_rating_reason ?? null, comment ?? null, visitor_name ?? null]
    );

    let dishSummary = {};
    if (dish_id) {
      const summary = await pool.query(
        `SELECT ROUND(AVG(stars)::numeric,1) AS avg_rating, COUNT(*) AS rating_count FROM ratings WHERE dish_id=$1`,
        [dish_id]
      );
      dishSummary = {
        avg_rating: parseFloat(summary.rows[0].avg_rating) || 0,
        rating_count: parseInt(summary.rows[0].rating_count) || 0,
      };
    }
    return NextResponse.json({ ...result.rows[0], ...dishSummary }, { status: 201 });
  } catch (e: unknown) {
    console.error("POST /api/ratings:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
