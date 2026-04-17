import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sb = getSupabase();
    const { id } = await params;
    const { error } = await sb.from("dishes").update({ is_active: false, hidden_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    console.error("PATCH /api/dishes/[id]/hide:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
