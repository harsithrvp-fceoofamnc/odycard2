import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

// GET /api/ratings/dish/[dish_id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ dish_id: string }> }) {
  try {
    const pool = getPool();
    const { dish_id } = await params;
    const result = await pool.query(
      `SELECT
         COUNT(*)::integer AS total,
         ROUND(AVG(stars)::numeric,1) AS avg_rating,
         json_agg(json_build_object(
           'stars',stars,'comment',comment,'visitor_name',visitor_name,'created_at',created_at
         ) ORDER BY created_at DESC) AS reviews
       FROM ratings WHERE dish_id=$1`,
      [dish_id]
    );
    return NextResponse.json(result.rows[0]);
  } catch (e: unknown) {
    console.error("GET /api/ratings/dish/[dish_id]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
