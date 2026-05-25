import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sb = getSupabase();
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
    const { data, error } = await sb
      .from("categories")
      .update({ name: name.trim() })
      .eq("id", params.id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: unknown) {
    console.error("PATCH /api/categories/[id]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sb = getSupabase();
    // Unlink any dishes in this category first
    await sb.from("dishes").update({ menu_category_id: null }).eq("menu_category_id", params.id);
    const { error } = await sb.from("categories").delete().eq("id", params.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("DELETE /api/categories/[id]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
