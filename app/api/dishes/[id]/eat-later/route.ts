import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sb = getSupabase();
    const { id } = await params;
    const { action } = await req.json();
    const { data: dish } = await sb.from("dishes").select("eat_later_count").eq("id", id).single();
    const current = dish?.eat_later_count ?? 0;
    const newCount = Math.max(0, current + (action === "remove" ? -1 : 1));
    const { data, error } = await sb.from("dishes").update({ eat_later_count: newCount }).eq("id", id).select("eat_later_count").single();
    if (error) throw error;
    return NextResponse.json({ eat_later_count: data.eat_later_count });
  } catch (e: unknown) {
    console.error("POST /api/dishes/[id]/eat-later:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
