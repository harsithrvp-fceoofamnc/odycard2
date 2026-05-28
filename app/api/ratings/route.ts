import { NextRequest, NextResponse } from "next/server";
import { getDb, getNextId } from "@/lib/firebase";

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const { hotel_id, dish_id, stars, low_rating_reason, comment, visitor_name } = await req.json();
    if (!hotel_id || !stars)
      return NextResponse.json({ error: "hotel_id and stars are required" }, { status: 400 });
    if (stars < 1 || stars > 5)
      return NextResponse.json({ error: "stars must be between 1 and 5" }, { status: 400 });

    const id = await getNextId("ratings");
    const doc = {
      hotel_id: parseInt(hotel_id, 10),
      dish_id: dish_id ? parseInt(dish_id, 10) : null,
      stars,
      low_rating_reason: low_rating_reason ?? null,
      comment: comment ?? null,
      visitor_name: visitor_name ?? null,
      created_at: new Date().toISOString(),
    };
    await db.collection("ratings").doc(String(id)).set(doc);

    let dishSummary = {};
    if (dish_id) {
      const ratingSnap = await db
        .collection("ratings")
        .where("dish_id", "==", parseInt(dish_id, 10))
        .get();
      const rows = ratingSnap.docs.map((d) => d.data().stars as number);
      const avg = rows.length
        ? Math.round((rows.reduce((s, r) => s + r, 0) / rows.length) * 10) / 10
        : 0;
      dishSummary = { avg_rating: avg, rating_count: rows.length };
    }

    return NextResponse.json({ id, ...doc, ...dishSummary }, { status: 201 });
  } catch (e: unknown) {
    console.error("POST /api/ratings:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
