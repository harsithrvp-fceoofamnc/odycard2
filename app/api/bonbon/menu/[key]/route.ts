import { NextRequest, NextResponse } from "next/server";
import { BB, bbDb, requireBB } from "@/lib/bonbon";

// Edit / toggle / delete a single menu item — supervisor or admin.
// PATCH accepts any subset of editable fields; booleans map to 0/1.

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ key: string }> }) {
  const s = await requireBB(["admin", "supervisor"]);
  if (!s) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  try {
    const { key } = await ctx.params;
    const db = bbDb();
    const ref = db.collection(BB.menu).doc(key);
    const cur = await ref.get();
    if (!cur.exists) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const b = await req.json();
    const patch: Record<string, unknown> = {};
    if (b.name !== undefined) patch.name = String(b.name).trim();
    if (b.price !== undefined) patch.price = parseInt(String(b.price), 10);
    if (b.price500 !== undefined) patch.price500 = b.price500 ? parseInt(String(b.price500), 10) : null;
    if (b.q !== undefined) patch.q = String(b.q);
    if (b.pt !== undefined) patch.pt = parseInt(String(b.pt), 10) || 0;
    if (b.desc !== undefined) patch.desc = String(b.desc);
    if (b.best !== undefined) patch.best = b.best ? 1 : 0;
    if (b.must !== undefined) patch.must = b.must ? 1 : 0;
    if (b.available !== undefined) patch.available = b.available ? 1 : 0;
    if (b.hidden !== undefined) patch.hidden = b.hidden ? 1 : 0;

    if (Object.keys(patch).length === 0)
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

    await ref.set(patch, { merge: true });
    const after = await ref.get();
    return NextResponse.json({ item: { ...after.data(), key } });
  } catch (e) {
    console.error("PATCH /api/bonbon/menu/[key]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ key: string }> }) {
  const s = await requireBB(["admin", "supervisor"]);
  if (!s) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  try {
    const { key } = await ctx.params;
    if (key === "extraicecream")
      return NextResponse.json({ error: "That add-on can't be deleted" }, { status: 400 });
    await bbDb().collection(BB.menu).doc(key).delete();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/bonbon/menu/[key]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
