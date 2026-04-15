import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

// GET /api/hotels/[slug] — fetch hotel by slug
export async function GET(req: NextRequest, { params }: { params: Promise<{ param: string }> }) {
  try {
    const pool = getPool();
    const { param } = await params;
    const full = req.nextUrl.searchParams.get("full") === "true";
    const fields = full
      ? "id, name, slug, logo_url, cover_url, cover_original_url, created_at"
      : "id, name, slug, logo_url, cover_url, created_at";
    const result = await pool.query(`SELECT ${fields} FROM hotels WHERE slug = $1`, [param]);
    if (result.rows.length === 0) return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch (e: unknown) {
    console.error("GET /api/hotels/[param]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT /api/hotels/[id] — update hotel by id
export async function PUT(req: NextRequest, { params }: { params: Promise<{ param: string }> }) {
  try {
    const pool = getPool();
    const { param } = await params;
    const { name, logo, coverImage } = await req.json();
    const result = await pool.query(
      `UPDATE hotels SET name=COALESCE($1,name), logo_url=COALESCE($2,logo_url), cover_url=COALESCE($3,cover_url) WHERE id=$4 RETURNING *`,
      [name ?? null, logo ?? null, coverImage ?? null, param]
    );
    if (result.rows.length === 0) return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    return NextResponse.json({ success: true, hotel: result.rows[0] });
  } catch (e: unknown) {
    console.error("PUT /api/hotels/[param]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH /api/hotels/[id] — partial update hotel by id
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ param: string }> }) {
  try {
    const pool = getPool();
    const { param } = await params;
    const body = await req.json();
    const { name, logo_url, cover_url, cover_original_url } = body;
    const coverUrlSent = "cover_url" in body;
    const coverOriginalUrlSent = "cover_original_url" in body;

    const result = await pool.query(
      `UPDATE hotels
       SET name=COALESCE($1,name),
           logo_url=COALESCE($2,logo_url),
           cover_url=CASE WHEN $6 THEN $3 ELSE cover_url END,
           cover_original_url=CASE WHEN $7 THEN $4 ELSE cover_original_url END
       WHERE id=$5 RETURNING *`,
      [name, logo_url, cover_url === undefined ? null : cover_url,
       cover_original_url === undefined ? null : cover_original_url,
       param, coverUrlSent, coverOriginalUrlSent]
    );
    if (result.rows.length === 0) return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch (e: unknown) {
    console.error("PATCH /api/hotels/[param]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
