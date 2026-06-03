import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb();
    const { id } = await params;
    const { action } = await req.json();
    const delta = action === "remove" ? -1 : 1;

    const ref = db.collection("dishes").doc(id);
    // Atomic increment — avoids race condition when multiple users save simultaneously
    await ref.update({ eat_later_count: FieldValue.increment(delta) });
    const snap = await ref.get();
    const newCount = Math.max(0, (snap.data()?.eat_later_count as number) ?? 0);
    if ((snap.data()?.eat_later_count as number) < 0) {
      await ref.update({ eat_later_count: 0 });
    }
    return NextResponse.json({ eat_later_count: newCount });
  } catch (e: unknown) {
    console.error("POST /api/dishes/[id]/eat-later:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
