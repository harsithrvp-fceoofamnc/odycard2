import { NextRequest, NextResponse } from "next/server";
import { BB, bbDb, requireBB, ensureDefaultTenant, bbMenuCol, isDefaultOutlet } from "@/lib/bonbon";
import { getNextId } from "@/lib/firebase";
import seed from "@/lib/bonbonMenuSeed.json";

type MenuDoc = Record<string, unknown> & { key: string };

function slugify(s: string): string {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Outlets belong to a restaurant. Admin-only. Every new outlet starts with its OWN copy of the
// real Bon Bon menu (seeded into its subcollection), which the supervisor can then edit freely.

export async function GET(req: NextRequest) {
  const s = await requireBB(["admin"]);
  if (!s) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  await ensureDefaultTenant();
  const db = bbDb();
  const rid = req.nextUrl.searchParams.get("restaurant");
  let q = db.collection(BB.outlets) as FirebaseFirestore.Query;
  if (rid) q = q.where("restaurant_id", "==", parseInt(rid, 10));
  const snap = await q.get();
  const outlets = snap.docs
    .map((d) => {
      const x = d.data();
      return { id: parseInt(d.id, 10), restaurant_id: x.restaurant_id, name: x.name, slug: x.slug, created_at: x.created_at ?? null };
    })
    .sort((a, b) => a.id - b.id);
  return NextResponse.json({ outlets });
}

export async function POST(req: NextRequest) {
  const s = await requireBB(["admin"]);
  if (!s) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  try {
    await ensureDefaultTenant();
    const db = bbDb();
    const b = await req.json();
    const restaurant_id = parseInt(String(b.restaurant_id), 10);
    const name = String(b.name || "").trim();
    if (!restaurant_id) return NextResponse.json({ error: "Choose a restaurant" }, { status: 400 });
    if (!name) return NextResponse.json({ error: "Outlet name is required" }, { status: 400 });
    const rDoc = await db.collection(BB.restaurants).doc(String(restaurant_id)).get();
    if (!rDoc.exists) return NextResponse.json({ error: "That restaurant doesn't exist" }, { status: 404 });

    // unique slug across outlets
    const base = slugify(name) || "outlet";
    let slug = base, n = 0;
    while (true) {
      const ex = await db.collection(BB.outlets).where("slug", "==", slug).limit(1).get();
      if (ex.empty) break;
      slug = `${base}-${++n}`;
    }

    const id = await getNextId(BB.outlets);
    await db.collection(BB.outlets).doc(String(id)).set({
      restaurant_id,
      name,
      slug,
      created_at: new Date().toISOString(),
    });

    // seed this outlet's own menu with a fresh copy of the real Bon Bon menu
    if (!isDefaultOutlet(id)) {
      const col = bbMenuCol(id);
      const batch = db.batch();
      for (const item of seed as MenuDoc[]) batch.set(col.doc(item.key), item);
      await batch.commit();
    }

    return NextResponse.json({ id, restaurant_id, name, slug }, { status: 201 });
  } catch (e) {
    console.error("POST /api/bonbon/outlets:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
