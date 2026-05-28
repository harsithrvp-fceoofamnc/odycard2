import { NextRequest, NextResponse } from "next/server";
import { getDb, getNextId, qDocData } from "@/lib/firebase";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const hotel_id = req.nextUrl.searchParams.get("hotel_id");
    if (!hotel_id) return NextResponse.json({ error: "hotel_id is required" }, { status: 400 });

    const snap = await db
      .collection("categories")
      .where("hotel_id", "==", parseInt(hotel_id, 10))
      .orderBy("display_order")
      .orderBy("name")
      .get();

    return NextResponse.json(snap.docs.map(qDocData));
  } catch (e: unknown) {
    console.error("GET /api/categories:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const { hotel_id, name } = await req.json();
    if (!hotel_id || !name)
      return NextResponse.json({ error: "hotel_id and name are required" }, { status: 400 });

    // Check if category already exists for this hotel (upsert behaviour)
    const existing = await db
      .collection("categories")
      .where("hotel_id", "==", parseInt(hotel_id, 10))
      .where("name", "==", name.trim())
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json({ message: "Already exists" }, { status: 201 });
    }

    const id = await getNextId("categories");
    const doc = {
      hotel_id: parseInt(hotel_id, 10),
      name: name.trim(),
      display_order: 0,
      created_at: new Date().toISOString(),
    };
    await db.collection("categories").doc(String(id)).set(doc);
    return NextResponse.json({ id, ...doc }, { status: 201 });
  } catch (e: unknown) {
    console.error("POST /api/categories:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
