import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest, { params }: { params: Promise<{ param: string }> }) {
  try {
    const sb = getSupabase();
    const { param } = await params;
    const full = req.nextUrl.searchParams.get("full") === "true";
    const fields = full
      ? "id, name, slug, logo_url, cover_url, cover_original_url, created_at"
      : "id, name, slug, logo_url, cover_url, created_at";
    const { data, error } = await sb.from("hotels").select(fields).eq("slug", param).maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e: unknown) {
    console.error("GET /api/hotels/[param]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ param: string }> }) {
  try {
    const sb = getSupabase();
    const { param } = await params;
    const { name, logo, coverImage } = await req.json();
    const { data, error } = await sb.from("hotels").update({
      ...(name && { name }),
      ...(logo && { logo_url: logo }),
      ...(coverImage && { cover_url: coverImage }),
    }).eq("id", param).select().single();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    return NextResponse.json({ success: true, hotel: data });
  } catch (e: unknown) {
    console.error("PUT /api/hotels/[param]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ param: string }> }) {
  try {
    const sb = getSupabase();
    const { param } = await params;
    const body = await req.json();
    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.logo_url !== undefined) update.logo_url = body.logo_url;
    if ("cover_url" in body) update.cover_url = body.cover_url;
    if ("cover_original_url" in body) update.cover_original_url = body.cover_original_url;
    const { data, error } = await sb.from("hotels").update(update).eq("id", param).select().single();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e: unknown) {
    console.error("PATCH /api/hotels/[param]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
