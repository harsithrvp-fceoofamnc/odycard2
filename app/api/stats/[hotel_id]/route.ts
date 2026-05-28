import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ hotel_id: string }> }) {
  try {
    const db = getDb();
    const { hotel_id } = await params;
    const hotelIdNum = parseInt(hotel_id, 10);

    const [dishSnap, ratingSnap] = await Promise.all([
      db.collection("dishes").where("hotel_id", "==", hotelIdNum).where("is_active", "==", true).get(),
      db.collection("ratings").where("hotel_id", "==", hotelIdNum).get(),
    ]);

    const d = dishSnap.docs.map((doc) => doc.data());
    const r = ratingSnap.docs.map((doc) => doc.data().stars as number);
    const avg = r.length ? Math.round((r.reduce((s, x) => s + x, 0) / r.length) * 10) / 10 : 0;

    return NextResponse.json({
      total_dishes: d.length,
      videos_uploaded: d.filter((x) => x.video_url && x.video_url !== "").length,
      avg_rating: avg,
      total_ratings: r.length,
    });
  } catch (e: unknown) {
    console.error("GET /api/stats:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
