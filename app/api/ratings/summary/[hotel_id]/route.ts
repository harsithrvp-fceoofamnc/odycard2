import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ hotel_id: string }> }) {
  try {
    const db = getDb();
    const { hotel_id } = await params;

    const snap = await db
      .collection("ratings")
      .where("hotel_id", "==", parseInt(hotel_id, 10))
      .get();

    const r = snap.docs.map((d) => d.data().stars as number);
    const total = r.length;
    const avg = total ? Math.round((r.reduce((s, x) => s + x, 0) / total) * 10) / 10 : 0;

    return NextResponse.json({
      total_ratings: total,
      avg_rating: avg,
      five_star: r.filter((x) => x === 5).length,
      four_star: r.filter((x) => x === 4).length,
      three_star: r.filter((x) => x === 3).length,
      two_star: r.filter((x) => x === 2).length,
      one_star: r.filter((x) => x === 1).length,
    });
  } catch (e: unknown) {
    console.error("GET /api/ratings/summary:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
