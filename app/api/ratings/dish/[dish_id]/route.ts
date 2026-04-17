import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ dish_id: string }> }) {
  try {
    const sb = getSupabase();
    const { dish_id } = await params;
    const { data: rows } = await sb.from("ratings").select("stars, comment, visitor_name, created_at").eq("dish_id", dish_id).order("created_at", { ascending: false });
    const r = rows || [];
    const avg = r.length ? Math.round((r.reduce((s, x) => s + x.stars, 0) / r.length) * 10) / 10 : 0;
    return NextResponse.json({ total: r.length, avg_rating: avg, reviews: r });
  } catch (e: unknown) {
    console.error("GET /api/ratings/dish:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
