import { NextRequest, NextResponse } from "next/server";
import { getDb, getNextId } from "@/lib/firebase";

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const { name, logo_url, cover_url, cover_original_url } = await req.json();
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

    let slug = String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!slug) slug = `hotel-${Date.now()}`;

    // Ensure slug is unique
    let finalSlug = slug;
    let attempt = 0;
    while (true) {
      const existing = await db.collection("hotels").where("slug", "==", finalSlug).limit(1).get();
      if (existing.empty) break;
      attempt++;
      finalSlug = `${slug}-${attempt}`;
    }

    const id = await getNextId("hotels");
    const doc = {
      name,
      slug: finalSlug,
      logo_url: logo_url ?? null,
      cover_url: cover_url ?? null,
      cover_original_url: cover_original_url ?? null,
      ody_menu_hidden: false,
      created_at: new Date().toISOString(),
    };
    await db.collection("hotels").doc(String(id)).set(doc);
    return NextResponse.json({ id, ...doc }, { status: 201 });
  } catch (e: unknown) {
    console.error("POST /api/hotels:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
