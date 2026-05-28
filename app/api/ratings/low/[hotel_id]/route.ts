import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ hotel_id: string }> }) {
  try {
    const db = getDb();
    const { hotel_id } = await params;

    // Fetch all ratings with stars <= 2 for this hotel
    const snap = await db
      .collection("ratings")
      .where("hotel_id", "==", parseInt(hotel_id, 10))
      .where("stars", "<=", 2)
      .get();

    const counts: Record<string, number> = {};
    for (const doc of snap.docs) {
      const reason = doc.data().low_rating_reason;
      if (!reason) continue;
      counts[reason] = (counts[reason] || 0) + 1;
    }

    const result = Object.entries(counts)
      .map(([low_rating_reason, count]) => ({ low_rating_reason, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json(result);
  } catch (e: unknown) {
    console.error("GET /api/ratings/low:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
