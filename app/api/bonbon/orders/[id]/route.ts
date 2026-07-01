import { NextRequest, NextResponse } from "next/server";
import { BB, bbDb, requireBB } from "@/lib/bonbon";

const FLOW = ["new", "preparing", "ready", "served", "cancelled"];

// Advance an order's status. Kitchen: new→preparing→ready. Waiter: ready→served.
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await requireBB(["admin", "supervisor", "waiter"]);
  if (!s) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  try {
    const { id } = await ctx.params;
    const b = await req.json();
    const status = String(b.status || "");
    if (!FLOW.includes(status)) return NextResponse.json({ error: "Bad status" }, { status: 400 });

    // Waiters may only mark ready orders as served (or cancel nothing).
    if (s.role === "waiter" && status !== "served")
      return NextResponse.json({ error: "Waiters can only mark orders served" }, { status: 403 });

    const ref = bbDb().collection(BB.orders).doc(id);
    if (!(await ref.get()).exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await ref.set({ status, updated_at: new Date().toISOString() }, { merge: true });
    return NextResponse.json({ ok: true, status });
  } catch (e) {
    console.error("PATCH /api/bonbon/orders/[id]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
