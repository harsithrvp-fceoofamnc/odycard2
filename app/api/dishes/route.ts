import { NextRequest, NextResponse } from "next/server";
import { getDb, getNextId, qDocData } from "@/lib/firebase";

function hasTimingWindowRestarted(hiddenAt: string, timingFrom: string, timingTo: string): boolean {
  if (!hiddenAt || !timingFrom || !timingTo) return false;
  if (timingFrom === timingTo) return false;
  const now = new Date();
  const hidden = new Date(hiddenAt);
  const [fh, fm] = timingFrom.split(":").map(Number);
  const [th, tm] = timingTo.split(":").map(Number);
  const windowEndAfterHide = new Date(hidden);
  windowEndAfterHide.setHours(th, tm, 0, 0);
  if (windowEndAfterHide <= hidden) windowEndAfterHide.setDate(windowEndAfterHide.getDate() + 1);
  const windowStartAfterEnd = new Date(windowEndAfterHide);
  windowStartAfterEnd.setHours(fh, fm, 0, 0);
  if (windowStartAfterEnd <= windowEndAfterHide) windowStartAfterEnd.setDate(windowStartAfterEnd.getDate() + 1);
  return now >= windowStartAfterEnd;
}

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const hotel_id = req.nextUrl.searchParams.get("hotel_id");
    if (!hotel_id) return NextResponse.json({ error: "hotel_id is required" }, { status: 400 });
    const hotelIdNum = parseInt(hotel_id, 10);
    const showAll = req.nextUrl.searchParams.get("all") === "true";
    const lite = req.nextUrl.searchParams.get("lite") === "true";
    const menu_cat = req.nextUrl.searchParams.get("menu_category_id");

    // Auto-restore hidden dishes whose timing window has restarted
    const hiddenSnap = await db
      .collection("dishes")
      .where("hotel_id", "==", hotelIdNum)
      .where("is_active", "==", false)
      .get();

    const restoreBatch = db.batch();
    let hasRestore = false;
    for (const doc of hiddenSnap.docs) {
      const d = doc.data();
      if (d.hidden_at && hasTimingWindowRestarted(d.hidden_at, d.timing_from, d.timing_to)) {
        restoreBatch.update(doc.ref, { is_active: true, hidden_at: null });
        hasRestore = true;
      }
    }
    if (hasRestore) await restoreBatch.commit();

    // Fetch dishes
    let query = db.collection("dishes").where("hotel_id", "==", hotelIdNum) as FirebaseFirestore.Query;
    if (!showAll) query = query.where("is_active", "==", true);
    if (menu_cat) query = query.where("menu_category_id", "==", parseInt(menu_cat, 10));
    const dishSnap = await query.orderBy("created_at", "desc").get();

    // Fetch ratings to build aggregate map
    const ratingSnap = await db
      .collection("ratings")
      .where("hotel_id", "==", hotelIdNum)
      .get();

    const ratingMap: Record<number, { total: number; count: number }> = {};
    for (const r of ratingSnap.docs) {
      const rd = r.data();
      if (!rd.dish_id) continue;
      if (!ratingMap[rd.dish_id]) ratingMap[rd.dish_id] = { total: 0, count: 0 };
      ratingMap[rd.dish_id].total += rd.stars;
      ratingMap[rd.dish_id].count += 1;
    }

    const result = dishSnap.docs.map((doc) => {
      const d = qDocData(doc);
      const rid = d.id as number;
      return {
        ...d,
        photo_url: lite ? null : d.photo_url,
        avg_rating: ratingMap[rid]
          ? Math.round((ratingMap[rid].total / ratingMap[rid].count) * 10) / 10
          : 0,
        rating_count: ratingMap[rid]?.count ?? 0,
        favorite_count: (d.favorite_count as number) ?? 0,
        eat_later_count: (d.eat_later_count as number) ?? 0,
      };
    });

    return NextResponse.json(result);
  } catch (e: unknown) {
    console.error("GET /api/dishes:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const {
      hotel_id, name, price,
      category = "food_item", is_veg = true,
      quantity, description, timing_from, timing_to, photo_url, video_url,
      menu_category_id, tags,
    } = await req.json();

    if (!hotel_id || !name || !price)
      return NextResponse.json({ error: "hotel_id, name, and price are required" }, { status: 400 });

    const id = await getNextId("dishes");
    const doc = {
      hotel_id: parseInt(hotel_id, 10),
      name,
      price,
      category,
      is_veg: Boolean(is_veg),
      is_active: true,
      quantity: quantity ?? null,
      description: description ?? null,
      timing_from: timing_from ?? "09:00",
      timing_to: timing_to ?? "22:00",
      photo_url: photo_url ?? null,
      video_url: video_url ?? null,
      menu_category_id: menu_category_id ?? null,
      tags: Array.isArray(tags) && tags.length > 0 ? tags : [],
      favorite_count: 0,
      eat_later_count: 0,
      hidden_at: null,
      created_at: new Date().toISOString(),
    };

    await db.collection("dishes").doc(String(id)).set(doc);
    return NextResponse.json({ id, ...doc }, { status: 201 });
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("POST /api/dishes:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
