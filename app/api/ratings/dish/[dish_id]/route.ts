import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ dish_id: string }> }) {
  try {
    const db = getDb();
    const { dish_id } = await params;

    const snap = await db
      .collection("ratings")
      .where("dish_id", "==", parseInt(dish_id, 10))
      .orderBy("created_at", "desc")
      .get();

    const r = snap.docs.map((d) => {
      const data = d.data();
      return {
        stars: data.stars,
        comment: data.comment ?? null,
        visitor_name: data.visitor_name ?? null,
        created_at: data.created_at,
      };
    });

    const avg = r.length
      ? Math.round((r.reduce((s, x) => s + x.stars, 0) / r.length) * 10) / 10
      : 0;

    return NextResponse.json({ total: r.length, avg_rating: avg, reviews: r });
  } catch (e: unknown) {
    console.error("GET /api/ratings/dish:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
