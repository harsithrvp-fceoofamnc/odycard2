import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const sb = getSupabase();
    const { name, logo_url, cover_url, cover_original_url } = await req.json();
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

    let slug = String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!slug) slug = `hotel-${Date.now()}`;

    let finalSlug = slug;
    let attempt = 0;
    while (true) {
      const { data } = await sb.from("hotels").select("id").eq("slug", finalSlug).maybeSingle();
      if (!data) break;
      attempt++;
      finalSlug = `${slug}-${attempt}`;
    }

    const { data, error } = await sb.from("hotels").insert({
      name, slug: finalSlug,
      logo_url: logo_url ?? null,
      cover_url: cover_url ?? null,
      cover_original_url: cover_original_url ?? null,
    }).select().single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e: unknown) {
    console.error("POST /api/hotels:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
