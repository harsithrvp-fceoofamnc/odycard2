import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

// PATCH /api/dishes/[id]/hide
export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const pool = getPool();
    const { id } = await params;
    await pool.query("UPDATE dishes SET is_active=false, hidden_at=NOW() WHERE id=$1", [id]);
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    console.error("PATCH /api/dishes/[id]/hide:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
