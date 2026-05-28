import { NextRequest, NextResponse } from "next/server";
import { getDb, docData } from "@/lib/firebase";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb();
    const { id } = await context.params;
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

    const ref = db.collection("categories").doc(id);
    await ref.update({ name: name.trim() });
    const updated = await ref.get();
    return NextResponse.json(docData(updated));
  } catch (e: unknown) {
    console.error("PATCH /api/categories/[id]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb();
    const { id } = await context.params;

    // Block deletion of the first (oldest) category for this hotel
    const targetSnap = await db.collection("categories").doc(id).get();
    if (!targetSnap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const targetData = targetSnap.data()!;
    const hotelId = targetData.hotel_id as number;

    const firstCatSnap = await db
      .collection("categories")
      .where("hotel_id", "==", hotelId)
      .orderBy("created_at", "asc")
      .limit(1)
      .get();
    if (!firstCatSnap.empty && firstCatSnap.docs[0].id === id) {
      return NextResponse.json({ error: "Cannot delete the default category" }, { status: 403 });
    }

    // Unlink any dishes that reference this category
    const dishSnap = await db
      .collection("dishes")
      .where("menu_category_id", "==", parseInt(id, 10))
      .get();
    const batch = db.batch();
    dishSnap.docs.forEach((d) => batch.update(d.ref, { menu_category_id: null }));
    batch.delete(db.collection("categories").doc(id));
    await batch.commit();

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("DELETE /api/categories/[id]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
