import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const sb = getSupabase();
    const { hotel_id, dish_id, stars, low_rating_reason, comment, visitor_name } = await req.json();
    if (!hotel_id || !stars) return NextResponse.json({ error: "hotel_id and stars are required" }, { status: 400 });
    if (stars < 1 || stars > 5) return NextResponse.json({ error: "stars must be between 1 and 5" }, { status: 400 });

    const { data, error } = await sb.from("ratings").insert({
      hotel_id, dish_id: dish_id ?? null, stars,
      low_rating_reason: low_rating_reason ?? null,
      comment: comment ?? null,
      visitor_name: visitor_name ?? null,
    }).select().single();
    if (error) throw error;

    let dishSummary = {};
    if (dish_id) {
      const { data: ratingRows } = await sb.from("ratings").select("stars").eq("dish_id", dish_id);
      const rows = ratingRows || [];
      const avg = rows.length ? Math.round((rows.reduce((s, r) => s + r.stars, 0) / rows.length) * 10) / 10 : 0;
      dishSummary = { avg_rating: avg, rating_count: rows.length };
    }
    return NextResponse.json({ ...data, ...dishSummary }, { status: 201 });
  } catch (e: unknown) {
    console.error("POST /api/ratings:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
