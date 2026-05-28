import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb();
    const { id } = await params;
    await db.collection("dishes").doc(id).update({
      is_active: false,
      hidden_at: new Date().toISOString(),
    });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    console.error("PATCH /api/dishes/[id]/hide:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
