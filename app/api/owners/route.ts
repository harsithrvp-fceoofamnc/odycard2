import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import bcrypt from "bcryptjs";

// POST /api/owners — create owner account
export async function POST(req: NextRequest) {
  try {
    const pool = getPool();
    const { hotel_id, mobile, password, gmail, signup_method } = await req.json();
    const method = signup_method || "mobile";

    if (!hotel_id) return NextResponse.json({ error: "hotel_id is required" }, { status: 400 });

    if (method === "google") {
      if (!gmail) return NextResponse.json({ error: "gmail is required for Google signup" }, { status: 400 });
      await pool.query(
        `INSERT INTO owners (hotel_id, gmail, signup_method) VALUES ($1,$2,'google')`,
        [hotel_id, gmail.toLowerCase().trim()]
      );
    } else {
      if (!mobile || !password) return NextResponse.json({ error: "mobile and password are required" }, { status: 400 });
      if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      const password_hash = await bcrypt.hash(password, 10);
      await pool.query(
        `INSERT INTO owners (hotel_id, mobile, password_hash, signup_method) VALUES ($1,$2,$3,'mobile')`,
        [hotel_id, mobile.trim(), password_hash]
      );
    }
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "23505") return NextResponse.json({ error: "An account with this mobile number already exists" }, { status: 409 });
    if (err.code === "23503") return NextResponse.json({ error: "Invalid hotel_id" }, { status: 400 });
    console.error("POST /api/owners:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
