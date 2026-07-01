import { NextRequest, NextResponse } from "next/server";
import { BB, bbDb, requireBB } from "@/lib/bonbon";

// Enable/disable or delete a staff login — admin-only.
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await requireBB(["admin"]);
  if (!s) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  try {
    const { id } = await ctx.params;
    const b = await req.json();
    const ref = bbDb().collection(BB.staff).doc(id);
    if (!(await ref.get()).exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const patch: Record<string, unknown> = {};
    if (b.active !== undefined) patch.active = !!b.active;
    if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    await ref.set(patch, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("PATCH /api/bonbon/staff/[id]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await requireBB(["admin"]);
  if (!s) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  try {
    const { id } = await ctx.params;
    await bbDb().collection(BB.staff).doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/bonbon/staff/[id]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
