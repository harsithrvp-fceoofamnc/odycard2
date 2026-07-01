import { NextRequest, NextResponse } from "next/server";
import { BB, bbDb, requireBB } from "@/lib/bonbon";
import { catOrder, catLabels } from "@/lib/bonbonMenu";
import seed from "@/lib/bonbonMenuSeed.json";

type MenuDoc = Record<string, unknown> & { key: string };

// GET is open (customers' chatbot reads it — it's already behind the demo gate).
// On the very first call it seeds the REAL menu from lib/bonbonMenuSeed.json (not mock data).
async function ensureSeeded() {
  const db = bbDb();
  const snap = await db.collection(BB.menu).limit(1).get();
  if (!snap.empty) return;
  const batch = db.batch();
  for (const item of seed as MenuDoc[]) {
    batch.set(db.collection(BB.menu).doc(item.key), item);
  }
  await batch.commit();
}

export async function GET() {
  try {
    await ensureSeeded();
    const db = bbDb();
    const snap = await db.collection(BB.menu).get();
    const items = snap.docs
      .map((d) => ({ ...(d.data() as MenuDoc), key: d.id } as MenuDoc))
      .sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0));
    return NextResponse.json({ items, catOrder, catLabels });
  } catch (e) {
    console.error("GET /api/bonbon/menu:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

function keyFrom(name: string): string {
  return (
    String(name).toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 24) + "_" + Math.random().toString(36).slice(2, 6)
  );
}

// Add a new menu item — supervisor or admin.
export async function POST(req: NextRequest) {
  const s = await requireBB(["admin", "supervisor"]);
  if (!s) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  try {
    const b = await req.json();
    const name = String(b.name || "").trim();
    const price = parseInt(String(b.price), 10);
    const cat = String(b.cat || "").trim();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!price || price <= 0) return NextResponse.json({ error: "Enter a valid price" }, { status: 400 });
    if (!(catOrder as readonly string[]).includes(cat)) return NextResponse.json({ error: "Pick a category" }, { status: 400 });

    const db = bbDb();
    // place it at the end of its category
    const all = await db.collection(BB.menu).get();
    const maxSort = all.docs.reduce((m, d) => Math.max(m, Number(d.data().sort) || 0), 0);

    const key = keyFrom(name);
    const doc: MenuDoc = {
      key,
      name,
      price,
      cat,
      cat_label: catLabels[cat] || cat,
      q: String(b.q || ""),
      pt: b.pt ? parseInt(String(b.pt), 10) : 5,
      desc: String(b.desc || ""),
      veg: 1,
      best: b.best ? 1 : 0,
      must: b.must ? 1 : 0,
      available: 1,
      hidden: 0,
      sort: maxSort + 1,
    };
    if (cat === "sundae" && b.price500) doc.price500 = parseInt(String(b.price500), 10);
    if (cat === "shakes") doc.ao = "extraicecream";
    await db.collection(BB.menu).doc(key).set(doc);
    return NextResponse.json({ item: doc }, { status: 201 });
  } catch (e) {
    console.error("POST /api/bonbon/menu:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
