import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

// GET /api/stats/[hotel_id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ hotel_id: string }> }) {
  try {
    const pool = getPool();
    const { hotel_id } = await params;

    const [dishStats, ratingStats] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::integer AS total_dishes,
                COUNT(CASE WHEN video_url IS NOT NULL AND video_url!='' THEN 1 END)::integer AS videos_uploaded
         FROM dishes WHERE hotel_id=$1 AND is_active=true`,
        [hotel_id]
      ),
      pool.query(
        `SELECT ROUND(AVG(stars)::numeric,1) AS avg_rating, COUNT(*)::integer AS total_ratings
         FROM ratings WHERE hotel_id=$1`,
        [hotel_id]
      ),
    ]);

    return NextResponse.json({
      total_dishes: dishStats.rows[0].total_dishes,
      videos_uploaded: dishStats.rows[0].videos_uploaded,
      avg_rating: ratingStats.rows[0].avg_rating ?? 0,
      total_ratings: ratingStats.rows[0].total_ratings ?? 0,
    });
  } catch (e: unknown) {
    console.error("GET /api/stats/[hotel_id]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
