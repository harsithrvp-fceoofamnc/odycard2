import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

function hasTimingWindowRestarted(hiddenAt: Date, timingFrom: string, timingTo: string): boolean {
  if (!hiddenAt || !timingFrom || !timingTo) return false;
  if (timingFrom === timingTo) return false;
  const now = new Date();
  const hidden = new Date(hiddenAt);
  const [fh, fm] = timingFrom.split(":").map(Number);
  const [th, tm] = timingTo.split(":").map(Number);
  const windowEndAfterHide = new Date(hidden);
  windowEndAfterHide.setHours(th, tm, 0, 0);
  if (windowEndAfterHide <= hidden) windowEndAfterHide.setDate(windowEndAfterHide.getDate() + 1);
  const windowStartAfterEnd = new Date(windowEndAfterHide);
  windowStartAfterEnd.setHours(fh, fm, 0, 0);
  if (windowStartAfterEnd <= windowEndAfterHide) windowStartAfterEnd.setDate(windowStartAfterEnd.getDate() + 1);
  return now >= windowStartAfterEnd;
}

export async function GET(req: NextRequest) {
  try {
    const sb = getSupabase();
    const hotel_id = req.nextUrl.searchParams.get("hotel_id");
    if (!hotel_id) return NextResponse.json({ error: "hotel_id is required" }, { status: 400 });
    const showAll = req.nextUrl.searchParams.get("all") === "true";

    // Auto-restore hidden dishes
    const { data: hiddenDishes } = await sb.from("dishes")
      .select("id, timing_from, timing_to, hidden_at")
      .eq("hotel_id", hotel_id).eq("is_active", false).not("hidden_at", "is", null);

    for (const row of hiddenDishes || []) {
      if (hasTimingWindowRestarted(row.hidden_at, row.timing_from, row.timing_to)) {
        await sb.from("dishes").update({ is_active: true, hidden_at: null }).eq("id", row.id);
      }
    }

    // Fetch dishes
    let query = sb.from("dishes").select("*").eq("hotel_id", hotel_id).order("created_at", { ascending: false });
    if (!showAll) query = query.eq("is_active", true);
    const { data: dishes, error } = await query;
    if (error) throw error;

    // Fetch ratings and compute aggregates per dish
    const { data: ratings } = await sb.from("ratings").select("dish_id, stars").eq("hotel_id", hotel_id);

    const ratingMap: Record<number, { total: number; count: number }> = {};
    for (const r of ratings || []) {
      if (!r.dish_id) continue;
      if (!ratingMap[r.dish_id]) ratingMap[r.dish_id] = { total: 0, count: 0 };
      ratingMap[r.dish_id].total += r.stars;
      ratingMap[r.dish_id].count += 1;
    }

    const result = (dishes || []).map(d => ({
      ...d,
      avg_rating: ratingMap[d.id] ? Math.round((ratingMap[d.id].total / ratingMap[d.id].count) * 10) / 10 : 0,
      rating_count: ratingMap[d.id]?.count ?? 0,
      favorite_count: d.favorite_count ?? 0,
      eat_later_count: d.eat_later_count ?? 0,
    }));

    return NextResponse.json(result);
  } catch (e: unknown) {
    console.error("GET /api/dishes:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sb = getSupabase();
    const {
      hotel_id, name, price,
      category = "food_item", is_veg = true,
      quantity, description, timing_from, timing_to, photo_url, video_url,
    } = await req.json();

    if (!hotel_id || !name || !price) return NextResponse.json({ error: "hotel_id, name, and price are required" }, { status: 400 });

    const { data, error } = await sb.from("dishes").insert({
      hotel_id, name, price, category, is_veg: Boolean(is_veg),
      quantity: quantity ?? null, description: description ?? null,
      timing_from: timing_from ?? "09:00", timing_to: timing_to ?? "22:00",
      photo_url: photo_url ?? null, video_url: video_url ?? null,
    }).select().single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e: unknown) {
    const err = e as { message?: string; code?: string };
    console.error("POST /api/dishes:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
