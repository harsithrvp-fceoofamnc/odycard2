import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

// GET /api/categories?hotel_id=x
export async function GET(req: NextRequest) {
  try {
    const pool = getPool();
    const hotel_id = req.nextUrl.searchParams.get("hotel_id");
    if (!hotel_id) return NextResponse.json({ error: "hotel_id is required" }, { status: 400 });
    const result = await pool.query(
      "SELECT * FROM categories WHERE hotel_id=$1 ORDER BY display_order ASC, name ASC",
      [hotel_id]
    );
    return NextResponse.json(result.rows);
  } catch (e: unknown) {
    console.error("GET /api/categories:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/categories
export async function POST(req: NextRequest) {
  try {
    const pool = getPool();
    const { hotel_id, name } = await req.json();
    if (!hotel_id || !name) return NextResponse.json({ error: "hotel_id and name are required" }, { status: 400 });
    const result = await pool.query(
      "INSERT INTO categories (hotel_id,name) VALUES ($1,$2) ON CONFLICT (hotel_id,name) DO NOTHING RETURNING *",
      [hotel_id, name.trim()]
    );
    return NextResponse.json(result.rows[0] || { message: "Already exists" }, { status: 201 });
  } catch (e: unknown) {
    console.error("POST /api/categories:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
