import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

// GET /api/dishes/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const pool = getPool();
    const { id } = await params;
    const result = await pool.query("SELECT * FROM dishes WHERE id=$1", [id]);
    if (result.rows.length === 0) return NextResponse.json({ error: "Dish not found" }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch (e: unknown) {
    console.error("GET /api/dishes/[id]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH /api/dishes/[id] — update dish
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const pool = getPool();
    const { id } = await params;
    const {
      name, price, category, is_veg,
      quantity, description, timing_from, timing_to,
      photo_url, video_url, is_active
    } = await req.json();

    const result = await pool.query(
      `UPDATE dishes SET
        name=COALESCE($1,name), price=COALESCE($2,price), category=COALESCE($3,category),
        is_veg=COALESCE($4,is_veg), quantity=COALESCE($5,quantity), description=COALESCE($6,description),
        timing_from=COALESCE($7,timing_from), timing_to=COALESCE($8,timing_to),
        photo_url=COALESCE($9,photo_url), video_url=COALESCE($10,video_url),
        is_active=COALESCE($11,is_active),
        hidden_at=CASE WHEN $11=false THEN NOW() WHEN $11=true THEN NULL ELSE hidden_at END
       WHERE id=$12 RETURNING *`,
      [name, price, category, is_veg, quantity, description,
       timing_from, timing_to, photo_url, video_url, is_active, id]
    );
    if (result.rows.length === 0) return NextResponse.json({ error: "Dish not found" }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch (e: unknown) {
    console.error("PATCH /api/dishes/[id]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/dishes/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const pool = getPool();
    const { id } = await params;
    await pool.query("DELETE FROM dishes WHERE id=$1", [id]);
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    console.error("DELETE /api/dishes/[id]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
