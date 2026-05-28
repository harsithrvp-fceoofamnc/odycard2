import { NextRequest, NextResponse } from "next/server";
import { getDb, docData, qDocData } from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ param: string }> }) {
  try {
    const db = getDb();
    const { param } = await params;
    const full = req.nextUrl.searchParams.get("full") === "true";

    // param is always a slug for GET
    const snap = await db.collection("hotels").where("slug", "==", param).limit(1).get();
    if (snap.empty) return NextResponse.json({ error: "Hotel not found" }, { status: 404 });

    const h = qDocData(snap.docs[0]);
    // Strip cover_original_url unless full=true
    const hotel: Record<string, unknown> = {
      id: h.id,
      name: h.name,
      slug: h.slug,
      logo_url: h.logo_url ?? null,
      cover_url: h.cover_url ?? null,
      ody_menu_hidden: h.ody_menu_hidden ?? false,
      created_at: h.created_at,
    };
    if (full) hotel.cover_original_url = h.cover_original_url ?? null;

    return NextResponse.json(hotel, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (e: unknown) {
    console.error("GET /api/hotels/[param]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ param: string }> }) {
  try {
    const db = getDb();
    const { param } = await params;
    const { name, logo, coverImage } = await req.json();

    const ref = db.collection("hotels").doc(param);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "Hotel not found" }, { status: 404 });

    const update: Record<string, unknown> = {};
    if (name) update.name = name;
    if (logo) update.logo_url = logo;
    if (coverImage) update.cover_url = coverImage;
    await ref.update(update);

    const updated = await ref.get();
    return NextResponse.json({ success: true, hotel: docData(updated) });
  } catch (e: unknown) {
    console.error("PUT /api/hotels/[param]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ param: string }> }) {
  try {
    const db = getDb();
    const { param } = await params;
    const body = await req.json();
    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.logo_url !== undefined) update.logo_url = body.logo_url;
    if ("cover_url" in body) update.cover_url = body.cover_url;
    if ("cover_original_url" in body) update.cover_original_url = body.cover_original_url;
    if ("ody_menu_hidden" in body) update.ody_menu_hidden = body.ody_menu_hidden;

    const ref = db.collection("hotels").doc(param);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "Hotel not found" }, { status: 404 });

    await ref.update(update);
    const updated = await ref.get();
    return NextResponse.json(docData(updated));
  } catch (e: unknown) {
    console.error("PATCH /api/hotels/[param]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
