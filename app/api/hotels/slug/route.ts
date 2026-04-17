import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function PATCH(req: NextRequest) {
  try {
    const sb = getSupabase();
    const slug = req.nextUrl.searchParams.get("slug") || "";
    if (!slug) return NextResponse.json({ error: "slug is required" }, { status: 400 });
    const body = await req.json();
    const update: Record<string, unknown> = {};
    if ("logo_url" in body) update.logo_url = body.logo_url;
    if ("cover_url" in body) update.cover_url = body.cover_url;
    if ("cover_original_url" in body) update.cover_original_url = body.cover_original_url;
    const { data, error } = await sb.from("hotels").update(update).eq("slug", slug).select().single();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e: unknown) {
    console.error("PATCH /api/hotels/slug:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
