import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

// POST /api/dishes/[id]/eat-later
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const pool = getPool();
    const { id } = await params;
    const { action } = await req.json();
    const delta = action === "remove" ? -1 : 1;
    const result = await pool.query(
      `UPDATE dishes SET eat_later_count=GREATEST(0,COALESCE(eat_later_count,0)+$1) WHERE id=$2 RETURNING eat_later_count`,
      [delta, id]
    );
    return NextResponse.json({ eat_later_count: result.rows[0]?.eat_later_count ?? 0 });
  } catch (e: unknown) {
    console.error("POST /api/dishes/[id]/eat-later:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
