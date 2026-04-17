import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ hotel_id: string }> }) {
  try {
    const sb = getSupabase();
    const { hotel_id } = await params;
    const { data: rows } = await sb.from("ratings").select("low_rating_reason").eq("hotel_id", hotel_id).lte("stars", 2).not("low_rating_reason", "is", null);
    const counts: Record<string, number> = {};
    for (const r of rows || []) {
      counts[r.low_rating_reason] = (counts[r.low_rating_reason] || 0) + 1;
    }
    const result = Object.entries(counts).map(([low_rating_reason, count]) => ({ low_rating_reason, count })).sort((a, b) => b.count - a.count);
    return NextResponse.json(result);
  } catch (e: unknown) {
    console.error("GET /api/ratings/low:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
