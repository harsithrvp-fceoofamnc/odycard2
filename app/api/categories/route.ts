import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const sb = getSupabase();
    const hotel_id = req.nextUrl.searchParams.get("hotel_id");
    if (!hotel_id) return NextResponse.json({ error: "hotel_id is required" }, { status: 400 });
    const { data, error } = await sb.from("categories").select("*").eq("hotel_id", hotel_id).order("display_order").order("name");
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: unknown) {
    console.error("GET /api/categories:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sb = getSupabase();
    const { hotel_id, name } = await req.json();
    if (!hotel_id || !name) return NextResponse.json({ error: "hotel_id and name are required" }, { status: 400 });
    const { data, error } = await sb.from("categories").upsert({ hotel_id, name: name.trim() }, { onConflict: "hotel_id,name", ignoreDuplicates: true }).select().maybeSingle();
    if (error) throw error;
    return NextResponse.json(data || { message: "Already exists" }, { status: 201 });
  } catch (e: unknown) {
    console.error("POST /api/categories:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
