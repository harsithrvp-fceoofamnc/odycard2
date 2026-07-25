import { NextRequest, NextResponse } from "next/server";
import { bbDb, bbMenuCol, requireBB } from "@/lib/bonbon";
import { catOrder, catLabels } from "@/lib/bonbonMenu";
import seed from "@/lib/bonbonMenuSeed.json";

type MenuDoc = Record<string, unknown> & { key: string };

// Items pulled from the menu for good — deleted from Firestore on load so they vanish everywhere.
const RETIRED = ["fruitsroll", "customroll"];

// The chatbot / dashboards can pass ?outlet=<id> (or JSON { outlet }); default outlet uses the
// original top-level menu, so the live customer bot keeps working with no param.
async function ensureSeeded(outletId?: string | null) {
  const col = bbMenuCol(outletId);
  const snap = await col.get();
  if (snap.empty) {
    const batch = bbDb().batch();
    for (const item of seed as MenuDoc[]) batch.set(col.doc(item.key), item);
    await batch.commit();
    return;
  }
  // Already seeded. Back-fill only items that don't exist yet (e.g. a new category like Roll
  // Ice Cream). Existing docs are never overwritten, so supervisor edits — price, photo,
  // sold-out, hidden — are preserved.
  const have = new Set(snap.docs.map((d) => d.id));
  const missing = (seed as MenuDoc[]).filter((i) => !have.has(i.key));
  const retire = RETIRED.filter((k) => have.has(k));
  if (!missing.length && !retire.length) return;
  const batch = bbDb().batch();
  for (const item of missing) batch.set(col.doc(item.key), item);
  for (const k of retire) batch.delete(col.doc(k));
  await batch.commit();
}

export async function GET(req: NextRequest) {
  try {
    const outlet = req.nextUrl.searchParams.get("outlet");
    await ensureSeeded(outlet);
    const snap = await bbMenuCol(outlet).get();
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

    const outlet = b.outlet ?? req.nextUrl.searchParams.get("outlet");
    const col = bbMenuCol(outlet);
    // place it at the end
    const all = await col.get();
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
      ph: String(b.ph || ""),
      veg: 1,
      best: b.best ? 1 : 0,
      must: b.must ? 1 : 0,
      available: 1,
      hidden: 0,
      push: b.push ? Math.max(0, Math.min(5, parseInt(String(b.push), 10) || 0)) : 0,
      status: "on",
      offReason: "",
      sort: maxSort + 1,
    };
    if (cat === "sundae" && b.price500) doc.price500 = parseInt(String(b.price500), 10);
    if (cat === "shakes") doc.ao = "extraicecream";
    await col.doc(key).set(doc);
    return NextResponse.json({ item: doc }, { status: 201 });
  } catch (e) {
    console.error("POST /api/bonbon/menu:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
