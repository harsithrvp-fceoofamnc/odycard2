import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

// PATCH /api/hotels/slug?slug=xxx — update hotel by slug (for logo/cover updates)
export async function PATCH(req: NextRequest) {
  try {
    const pool = getPool();
    const slug = req.nextUrl.searchParams.get("slug") || "";
    if (!slug) return NextResponse.json({ error: "slug is required" }, { status: 400 });

    const body = await req.json();
    const { logo_url, cover_url, cover_original_url } = body;
    const logoUrlSent = "logo_url" in body;
    const coverUrlSent = "cover_url" in body;
    const coverOriginalUrlSent = "cover_original_url" in body;

    const result = await pool.query(
      `UPDATE hotels
       SET logo_url=CASE WHEN $5 THEN $1 ELSE logo_url END,
           cover_url=CASE WHEN $6 THEN $2 ELSE cover_url END,
           cover_original_url=CASE WHEN $7 THEN $3 ELSE cover_original_url END
       WHERE slug=$4 RETURNING *`,
      [
        logo_url === undefined ? null : logo_url,
        cover_url === undefined ? null : cover_url,
        cover_original_url === undefined ? null : cover_original_url,
        slug, logoUrlSent, coverUrlSent, coverOriginalUrlSent
      ]
    );
    if (result.rows.length === 0) return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch (e: unknown) {
    console.error("PATCH /api/hotels/slug:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
