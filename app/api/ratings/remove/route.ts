import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const { dish_id, visitor_name } = await req.json();
    if (!dish_id) return NextResponse.json({ error: "dish_id required" }, { status: 400 });

    const dishIdNum = parseInt(dish_id, 10);

    // Find the most recent rating for this dish by this visitor
    let query = db
      .collection("ratings")
      .where("dish_id", "==", dishIdNum)
      .orderBy("created_at", "desc")
      .limit(1) as FirebaseFirestore.Query;

    if (visitor_name) {
      query = db
        .collection("ratings")
        .where("dish_id", "==", dishIdNum)
        .where("visitor_name", "==", visitor_name)
        .orderBy("created_at", "desc")
        .limit(1);
    }

    const found = await query.get();
    if (!found.empty) {
      await found.docs[0].ref.delete();
    }

    // Recalculate avg
    const remaining = await db
      .collection("ratings")
      .where("dish_id", "==", dishIdNum)
      .get();
    const rows = remaining.docs.map((d) => d.data().stars as number);
    const avg = rows.length
      ? Math.round((rows.reduce((s, r) => s + r, 0) / rows.length) * 10) / 10
      : 0;

    return NextResponse.json({ avg_rating: avg, rating_count: rows.length });
  } catch (e: unknown) {
    console.error("POST /api/ratings/remove:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
