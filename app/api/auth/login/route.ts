import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import bcrypt from "bcryptjs";

// POST /api/auth/login
export async function POST(req: NextRequest) {
  try {
    const pool = getPool();
    const { mobile, password } = await req.json();
    if (!mobile || !password) return NextResponse.json({ error: "mobile and password are required" }, { status: 400 });

    const ownerResult = await pool.query(
      `SELECT id, hotel_id, password_hash FROM owners WHERE mobile=$1`,
      [mobile.trim()]
    );
    if (ownerResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid mobile number or password" }, { status: 401 });
    }

    const owner = ownerResult.rows[0];
    const valid = await bcrypt.compare(password, owner.password_hash);
    if (!valid) return NextResponse.json({ error: "Invalid mobile number or password" }, { status: 401 });

    const hotelResult = await pool.query(
      `SELECT id, name, slug, logo_url, cover_url, cover_original_url FROM hotels WHERE id=$1`,
      [owner.hotel_id]
    );
    if (hotelResult.rows.length === 0) return NextResponse.json({ error: "Hotel not found" }, { status: 404 });

    return NextResponse.json({ hotel: hotelResult.rows[0] });
  } catch (e: unknown) {
    console.error("POST /api/auth/login:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
