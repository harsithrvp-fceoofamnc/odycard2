import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const sb = getSupabase();
    const { dish_id, visitor_name } = await req.json();
    if (!dish_id) return NextResponse.json({ error: "dish_id required" }, { status: 400 });

    // Find and delete the most recent rating for this dish by this visitor
    let query = sb.from("ratings").select("id").eq("dish_id", dish_id).order("id", { ascending: false }).limit(1);
    if (visitor_name) query = query.eq("visitor_name", visitor_name);
    else query = query.is("visitor_name", null);

    const { data: found } = await query.maybeSingle();
    if (found) await sb.from("ratings").delete().eq("id", found.id);

    const { data: ratingRows } = await sb.from("ratings").select("stars").eq("dish_id", dish_id);
    const rows = ratingRows || [];
    const avg = rows.length ? Math.round((rows.reduce((s, r) => s + r.stars, 0) / rows.length) * 10) / 10 : 0;
    return NextResponse.json({ avg_rating: avg, rating_count: rows.length });
  } catch (e: unknown) {
    console.error("POST /api/ratings/remove:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
