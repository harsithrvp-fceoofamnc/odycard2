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

    // Fetch existing dish to get hotel_id and current is_active for cascade logic
    const existing = await db.collection("dishes").doc(id).get();
    if (!existing.exists) return NextResponse.json({ error: "Dish not found" }, { status: 404 });
    const existingData = existing.data()!;
    const hotelId = existingData.hotel_id as number;
    const wasActive = existingData.is_active !== false;

    const update: Record<string, unknown> = {};
    const fields = ["name","price","category","is_veg","quantity","description","timing_from","timing_to","photo_url","video_url","tags","menu_category_id","sort_order"];
    for (const f of fields) if (body[f] !== undefined) update[f] = body[f];

    let nowHiding = false;
    let nowUnhiding = false;
    if (body.is_active !== undefined) {
      update.is_active = body.is_active;
      if (body.is_active === false) {
        update.hidden_at = new Date().toISOString();
        update.auto_hidden_by = null; // Manual hide clears any prior auto-hide reason
        nowHiding = wasActive;
      } else {
        update.hidden_at = null;
        update.auto_hidden_by = null;
        nowUnhiding = !wasActive;
      }
    }

    const ref = db.collection("dishes").doc(id);
    await ref.update(update);
    const updated = await ref.get();
    if (!updated.exists) return NextResponse.json({ error: "Dish not found" }, { status: 404 });

    // Cascade: hide/unhide combo dishes that contain this dish as a component
    if ((nowHiding || nowUnhiding) && hotelId) {
      const allDishesSnap = await db.collection("dishes")
        .where("hotel_id", "==", hotelId)
        .get();

      const cascadeBatch = db.batch();
      let hasCascade = false;
      const now = new Date().toISOString();

      if (nowHiding) {
        // Auto-hide any active combo that includes this dish
        for (const doc of allDishesSnap.docs) {
          const d = doc.data();
          if (
            d.category === "combo" &&
            d.is_active !== false &&
            Array.isArray(d.combo_dish_ids) &&
            (d.combo_dish_ids as string[]).includes(id)
          ) {
            cascadeBatch.update(doc.ref, {
              is_active: false,
              hidden_at: now,
              auto_hidden_by: id,
            });
            hasCascade = true;
          }
        }
      } else if (nowUnhiding) {
        // Unhide combos that were auto-hidden specifically because of this dish
        for (const doc of allDishesSnap.docs) {
          const d = doc.data();
          if (d.auto_hidden_by !== id) continue;

          // Only restore if ALL other component dishes are also active
          const componentIds: string[] = Array.isArray(d.combo_dish_ids) ? d.combo_dish_ids as string[] : [];
          let allActive = true;
          for (const cid of componentIds) {
            if (cid === id) continue; // The dish we just unhid — skip
            const compDoc = allDishesSnap.docs.find(dd => dd.id === cid);
            if (!compDoc || compDoc.data().is_active === false) {
              allActive = false;
              break;
            }
          }
          if (allActive) {
            cascadeBatch.update(doc.ref, {
              is_active: true,
              hidden_at: null,
              auto_hidden_by: null,
            });
            hasCascade = true;
          }
        }
      }

      if (hasCascade) await cascadeBatch.commit();
    }

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
