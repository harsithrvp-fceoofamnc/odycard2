import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ hotel_id: string }> }) {
  try {
    const sb = getSupabase();
    const { hotel_id } = await params;
    const { data: rows } = await sb.from("ratings").select("stars").eq("hotel_id", hotel_id);
    const r = rows || [];
    const total = r.length;
    const avg = total ? Math.round((r.reduce((s, x) => s + x.stars, 0) / total) * 10) / 10 : 0;
    return NextResponse.json({
      total_ratings: total, avg_rating: avg,
      five_star: r.filter(x => x.stars === 5).length,
      four_star: r.filter(x => x.stars === 4).length,
      three_star: r.filter(x => x.stars === 3).length,
      two_star: r.filter(x => x.stars === 2).length,
      one_star: r.filter(x => x.stars === 1).length,
    });
  } catch (e: unknown) {
    console.error("GET /api/ratings/summary:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
