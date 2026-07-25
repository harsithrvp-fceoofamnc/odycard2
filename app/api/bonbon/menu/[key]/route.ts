import { NextRequest, NextResponse } from "next/server";
import { bbMenuCol, requireBB } from "@/lib/bonbon";

// Edit / toggle / delete a single menu item — supervisor or admin. Scoped to ?outlet=<id>.
// PATCH accepts any subset of editable fields; booleans map to 0/1.

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ key: string }> }) {
  const s = await requireBB(["admin", "supervisor"]);
  if (!s) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  try {
    const { key } = await ctx.params;
    const ref = bbMenuCol(req.nextUrl.searchParams.get("outlet")).doc(key);
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
    if (b.promoted !== undefined) patch.promoted = b.promoted ? 1 : 0;
    if (b.available !== undefined) patch.available = b.available ? 1 : 0;
    if (b.hidden !== undefined) patch.hidden = b.hidden ? 1 : 0;
    if (b.ph !== undefined) patch.ph = String(b.ph);
    // Palantir layer: how hard the AI should promote this (0=leave alone, 5=push everywhere)
    if (b.push !== undefined) patch.push = Math.max(0, Math.min(5, parseInt(String(b.push), 10) || 0));
    // Live stock status the AI reads out to guests. "on" = available; the rest carry a reason.
    if (b.status !== undefined) {
      const st = String(b.status);
      const ok = ["on", "out", "soon", "off"];
      patch.status = ok.includes(st) ? st : "on";
      if (patch.status === "on") patch.offReason = "";
    }
    if (b.offReason !== undefined) patch.offReason = String(b.offReason).slice(0, 80);

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

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ key: string }> }) {
  const s = await requireBB(["admin", "supervisor"]);
  if (!s) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  try {
    const { key } = await ctx.params;
    if (key === "extraicecream")
      return NextResponse.json({ error: "That add-on can't be deleted" }, { status: 400 });
    await bbMenuCol(req.nextUrl.searchParams.get("outlet")).doc(key).delete();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/bonbon/menu/[key]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
