import { NextRequest, NextResponse } from "next/server";
import { getDb, docData } from "@/lib/firebase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb();
    const { id } = await params;
    const snap = await db.collection("dishes").doc(id).get();
    if (!snap.exists) return NextResponse.json({ error: "Dish not found" }, { status: 404 });
    return NextResponse.json(docData(snap));
  } catch (e: unknown) {
    console.error("GET /api/dishes/[id]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb();
    const { id } = await params;
    const body = await req.json();
    const update: Record<string, unknown> = {};
    const fields = ["name","price","category","is_veg","quantity","description","timing_from","timing_to","photo_url","video_url","tags","menu_category_id"];
    for (const f of fields) if (body[f] !== undefined) update[f] = body[f];
    if (body.is_active !== undefined) {
      update.is_active = body.is_active;
      update.hidden_at = body.is_active === false ? new Date().toISOString() : null;
    }

    const ref = db.collection("dishes").doc(id);
    await ref.update(update);
    const updated = await ref.get();
    if (!updated.exists) return NextResponse.json({ error: "Dish not found" }, { status: 404 });
    return NextResponse.json(docData(updated));
  } catch (e: unknown) {
    console.error("PATCH /api/dishes/[id]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb();
    const { id } = await params;
    await db.collection("dishes").doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    console.error("DELETE /api/dishes/[id]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
