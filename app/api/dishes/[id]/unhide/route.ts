import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

// PATCH /api/dishes/[id]/unhide
export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const pool = getPool();
    const { id } = await params;
    await pool.query("UPDATE dishes SET is_active=true, hidden_at=NULL WHERE id=$1", [id]);
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    console.error("PATCH /api/dishes/[id]/unhide:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
