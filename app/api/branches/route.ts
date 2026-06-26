import { NextRequest, NextResponse } from "next/server";
import { getDb, getNextId } from "@/lib/firebase";
import { requireRole } from "@/lib/auth";

// Branches are `hotels` docs scoped to an owner (the admin's brand). Admin-only.

function slugify(s: string): string {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function GET() {
  const s = await requireRole(["admin"]);
  if (!s) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  const db = getDb();
  const snap = await db.collection("hotels").where("owner_id", "==", s.oid).get();
  const branches = snap.docs
    .map((d) => {
      const h = d.data();
      return { id: parseInt(d.id, 10), name: h.name, slug: h.slug, address: h.address ?? null, created_at: h.created_at ?? null };
    })
    .sort((a, b) => a.id - b.id);
  return NextResponse.json({ branches, brand: { name: s.name ?? null } });
}

export async function POST(req: NextRequest) {
  const s = await requireRole(["admin"]);
  if (!s) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  try {
    const db = getDb();
    const { name, address } = await req.json();
    if (!name || !String(name).trim())
      return NextResponse.json({ error: "Branch name is required" }, { status: 400 });

    // brand slug comes from the owner record
    const ownerDoc = await db.collection("owners").doc(String(s.oid)).get();
    const owner = ownerDoc.data() || {};
    const brandSlug = owner.brand_slug || slugify(owner.brand_name || "brand") || "brand";

    const base = `${brandSlug}-${slugify(name) || "branch"}`;
    let finalSlug = base;
    let attempt = 0;
    while (true) {
      const ex = await db.collection("hotels").where("slug", "==", finalSlug).limit(1).get();
      if (ex.empty) break;
      attempt++;
      finalSlug = `${base}-${attempt}`;
    }

    const id = await getNextId("hotels");
    const doc = {
      name: String(name).trim(),
      slug: finalSlug,
      owner_id: s.oid,
      brand_name: owner.brand_name ?? null,
      brand_slug: brandSlug,
      address: address ? String(address).trim() : null,
      logo_url: null,
      cover_url: null,
      cover_original_url: null,
      ody_menu_hidden: false,
      created_at: new Date().toISOString(),
    };
    await db.collection("hotels").doc(String(id)).set(doc);
    return NextResponse.json({ id, name: doc.name, slug: doc.slug, address: doc.address }, { status: 201 });
  } catch (e: unknown) {
    console.error("POST /api/branches:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
