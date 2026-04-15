import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

// POST /api/hotels — create hotel
export async function POST(req: NextRequest) {
  try {
    const pool = getPool();
    const { name, logo_url, cover_url, cover_original_url } = await req.json();
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

    let slug = String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!slug) slug = `hotel-${Date.now()}`;

    let finalSlug = slug;
    let attempt = 0;
    while (true) {
      const existing = await pool.query("SELECT id FROM hotels WHERE slug = $1", [finalSlug]);
      if (existing.rows.length === 0) break;
      attempt++;
      finalSlug = `${slug}-${attempt}`;
    }

    const result = await pool.query(
      `INSERT INTO hotels (name, slug, logo_url, cover_url, cover_original_url) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, finalSlug, logo_url ?? null, cover_url ?? null, cover_original_url ?? null]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (e: unknown) {
    console.error("POST /api/hotels:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
