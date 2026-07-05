import { NextRequest, NextResponse } from "next/server";
import { BB, bbDb, requireBB, ensureDefaultTenant } from "@/lib/bonbon";
import { getNextId } from "@/lib/firebase";

// Restaurants (a brand). Admin-only. The original Bon Bon is always restaurant #1.

export async function GET() {
  const s = await requireBB(["admin"]);
  if (!s) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  await ensureDefaultTenant();
  const db = bbDb();
  const snap = await db.collection(BB.restaurants).get();
  const restaurants = snap.docs
    .map((d) => ({ id: parseInt(d.id, 10), name: d.data().name, created_at: d.data().created_at ?? null }))
    .sort((a, b) => a.id - b.id);
  return NextResponse.json({ restaurants });
}

export async function POST(req: NextRequest) {
  const s = await requireBB(["admin"]);
  if (!s) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  try {
    await ensureDefaultTenant();
    const db = bbDb();
    const { name } = await req.json();
    const nm = String(name || "").trim();
    if (!nm) return NextResponse.json({ error: "Restaurant name is required" }, { status: 400 });
    const id = await getNextId(BB.restaurants);
    await db.collection(BB.restaurants).doc(String(id)).set({ name: nm, created_at: new Date().toISOString() });
    return NextResponse.json({ id, name: nm }, { status: 201 });
  } catch (e) {
    console.error("POST /api/bonbon/restaurants:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
