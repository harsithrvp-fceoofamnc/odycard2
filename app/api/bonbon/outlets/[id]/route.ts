import { NextRequest, NextResponse } from "next/server";
import { BB, bbDb, requireBB } from "@/lib/bonbon";

// Edit an outlet's details (name, number of tables). Admin-only.
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await requireBB(["admin"]);
  if (!s) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  try {
    const { id } = await ctx.params;
    const ref = bbDb().collection(BB.outlets).doc(id);
    if (!(await ref.get()).exists) return NextResponse.json({ error: "Outlet not found" }, { status: 404 });

    const b = await req.json();
    const patch: Record<string, unknown> = {};
    if (b.name !== undefined) {
      const nm = String(b.name).trim();
      if (!nm) return NextResponse.json({ error: "Outlet name can't be empty" }, { status: 400 });
      patch.name = nm;
    }
    if (b.tables !== undefined) {
      const t = Math.max(0, Math.min(500, parseInt(String(b.tables), 10) || 0));
      patch.tables = t;
    }
    if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    await ref.set(patch, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("PATCH /api/bonbon/outlets/[id]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
