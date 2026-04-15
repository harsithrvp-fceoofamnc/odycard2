import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

function hasTimingWindowRestarted(hiddenAt: Date, timingFrom: string, timingTo: string): boolean {
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

// GET /api/dishes?hotel_id=x&all=true
export async function GET(req: NextRequest) {
  try {
    const pool = getPool();
    const hotel_id = req.nextUrl.searchParams.get("hotel_id");
    if (!hotel_id) return NextResponse.json({ error: "hotel_id is required" }, { status: 400 });

    const showAll = req.nextUrl.searchParams.get("all") === "true";

    // Auto-restore hidden dishes whose timing window has restarted
    const hiddenDishes = await pool.query(
      "SELECT id, timing_from, timing_to, hidden_at FROM dishes WHERE hotel_id=$1 AND is_active=false AND hidden_at IS NOT NULL",
      [hotel_id]
    );
    for (const row of hiddenDishes.rows) {
      if (hasTimingWindowRestarted(row.hidden_at, row.timing_from, row.timing_to)) {
        await pool.query("UPDATE dishes SET is_active=true, hidden_at=NULL WHERE id=$1", [row.id]);
      }
    }

    const result = await pool.query(
      `SELECT d.*,
              COALESCE(ROUND(AVG(r.stars)::numeric,1),0) AS avg_rating,
              COUNT(r.id)::integer AS rating_count,
              COALESCE(d.favorite_count,0) AS favorite_count,
              COALESCE(d.eat_later_count,0) AS eat_later_count
       FROM dishes d
       LEFT JOIN ratings r ON r.dish_id=d.id
       WHERE d.hotel_id=$1 ${showAll ? "" : "AND d.is_active=true"}
       GROUP BY d.id
       ORDER BY d.created_at DESC`,
      [hotel_id]
    );
    return NextResponse.json(result.rows);
  } catch (e: unknown) {
    console.error("GET /api/dishes:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/dishes — add dish
export async function POST(req: NextRequest) {
  try {
    const pool = getPool();
    const {
      hotel_id, name, price,
      category = "food_item",
      is_veg = true,
      quantity, description,
      timing_from, timing_to,
      photo_url, video_url,
    } = await req.json();

    if (!hotel_id || !name || !price) {
      return NextResponse.json({ error: "hotel_id, name, and price are required" }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO dishes (hotel_id,name,price,category,is_veg,quantity,description,timing_from,timing_to,photo_url,video_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [hotel_id, name, price, category, Boolean(is_veg),
       quantity ?? null, description ?? null,
       timing_from ?? "09:00", timing_to ?? "22:00",
       photo_url ?? null, video_url ?? null]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (e: unknown) {
    const err = e as { message?: string; code?: string };
    console.error("POST /api/dishes:", err);
    return NextResponse.json({ error: err.message || "Server error", code: err.code }, { status: 500 });
  }
}
