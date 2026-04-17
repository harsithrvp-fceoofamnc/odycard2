import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const sb = getSupabase();
    const mobile = (req.nextUrl.searchParams.get("mobile") || "").trim();
    if (!mobile) return NextResponse.json({ error: "mobile is required" }, { status: 400 });
    const { data } = await sb.from("owners").select("id").eq("mobile", mobile).maybeSingle();
    return NextResponse.json({ exists: !!data });
  } catch (e: unknown) {
    console.error("GET /api/owners/check-mobile:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
