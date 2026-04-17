import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ hotel_id: string }> }) {
  try {
    const sb = getSupabase();
    const { hotel_id } = await params;

    const [{ data: dishes }, { data: ratings }] = await Promise.all([
      sb.from("dishes").select("video_url").eq("hotel_id", hotel_id).eq("is_active", true),
      sb.from("ratings").select("stars").eq("hotel_id", hotel_id),
    ]);

    const d = dishes || [];
    const r = ratings || [];
    const avg = r.length ? Math.round((r.reduce((s, x) => s + x.stars, 0) / r.length) * 10) / 10 : 0;

    return NextResponse.json({
      total_dishes: d.length,
      videos_uploaded: d.filter(x => x.video_url && x.video_url !== "").length,
      avg_rating: avg,
      total_ratings: r.length,
    });
  } catch (e: unknown) {
    console.error("GET /api/stats:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
