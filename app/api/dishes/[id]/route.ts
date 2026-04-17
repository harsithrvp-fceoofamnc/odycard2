import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sb = getSupabase();
    const { id } = await params;
    const { data, error } = await sb.from("dishes").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Dish not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e: unknown) {
    console.error("GET /api/dishes/[id]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sb = getSupabase();
    const { id } = await params;
    const body = await req.json();
    const update: Record<string, unknown> = {};
    const fields = ["name","price","category","is_veg","quantity","description","timing_from","timing_to","photo_url","video_url"];
    for (const f of fields) if (body[f] !== undefined) update[f] = body[f];
    if (body.is_active !== undefined) {
      update.is_active = body.is_active;
      update.hidden_at = body.is_active === false ? new Date().toISOString() : null;
    }
    const { data, error } = await sb.from("dishes").update(update).eq("id", id).select().single();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Dish not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e: unknown) {
    console.error("PATCH /api/dishes/[id]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sb = getSupabase();
    const { id } = await params;
    const { error } = await sb.from("dishes").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    console.error("DELETE /api/dishes/[id]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
