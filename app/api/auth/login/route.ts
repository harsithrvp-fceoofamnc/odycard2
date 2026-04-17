import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const sb = getSupabase();
    const { mobile, password } = await req.json();
    if (!mobile || !password) return NextResponse.json({ error: "mobile and password are required" }, { status: 400 });

    const { data: owner, error: ownerErr } = await sb
      .from("owners")
      .select("id, hotel_id, password_hash")
      .eq("mobile", mobile.trim())
      .maybeSingle();

    if (ownerErr) throw ownerErr;
    if (!owner) return NextResponse.json({ error: "Invalid mobile number or password" }, { status: 401 });

    const valid = await bcrypt.compare(password, owner.password_hash);
    if (!valid) return NextResponse.json({ error: "Invalid mobile number or password" }, { status: 401 });

    const { data: hotel, error: hotelErr } = await sb
      .from("hotels")
      .select("id, name, slug, logo_url, cover_url, cover_original_url")
      .eq("id", owner.hotel_id)
      .maybeSingle();

    if (hotelErr) throw hotelErr;
    if (!hotel) return NextResponse.json({ error: "Hotel not found" }, { status: 404 });

    return NextResponse.json({ hotel });
  } catch (e: unknown) {
    console.error("POST /api/auth/login:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
