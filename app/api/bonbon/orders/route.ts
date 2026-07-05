import { NextRequest, NextResponse } from "next/server";
import { BB, bbDb, requireBB, DEFAULT_OUTLET_ID } from "@/lib/bonbon";
import { getNextId } from "@/lib/firebase";

// Orders flow: chatbot POSTs a paid order (open, behind the demo gate) → it lands as "new"
// on the kitchen board → kitchen marks "preparing"/"ready" → waiter marks "served".
// GET/PATCH require a Bon Bon staff session. No mock data — the board is empty until a real
// order comes through the chatbot.

type OrderItem = { name: string; qty: number; price: number };

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const rawItems = Array.isArray(b.items) ? b.items : [];
    const items: OrderItem[] = rawItems
      .map((it: Record<string, unknown>) => ({
        name: String(it.name || "").slice(0, 80),
        qty: Math.max(1, parseInt(String(it.qty), 10) || 1),
        price: Math.max(0, parseInt(String(it.price), 10) || 0),
      }))
      .filter((it: OrderItem) => it.name);
    if (items.length === 0) return NextResponse.json({ error: "No items" }, { status: 400 });

    const total = parseInt(String(b.total), 10) || items.reduce((s, it) => s + it.price, 0);
    const outlet = parseInt(String(b.outlet), 10) || DEFAULT_OUTLET_ID;
    const ticket = await getNextId(BB.orders);
    const doc = {
      ticket,
      outlet,
      items,
      total,
      customer: String(b.name || "Guest").slice(0, 60),
      phone: String(b.phone || "").slice(0, 20),
      mode: b.mode === "dine" ? "dine" : "take",
      table: b.table ? String(b.table).slice(0, 12) : "",
      status: "new" as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await bbDb().collection(BB.orders).doc(String(ticket)).set(doc);
    return NextResponse.json({ ticket }, { status: 201 });
  } catch (e) {
    console.error("POST /api/bonbon/orders:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const s = await requireBB(["admin", "supervisor", "waiter"]);
  if (!s) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  try {
    const url = new URL(req.url);
    const statusParam = url.searchParams.get("status"); // e.g. "new,preparing,ready" or "active"
    const outletParam = url.searchParams.get("outlet");
    const wantOutlet = parseInt(String(outletParam), 10) || DEFAULT_OUTLET_ID;
    const db = bbDb();
    const snap = await db.collection(BB.orders).orderBy("ticket", "desc").limit(200).get();
    let orders: Record<string, unknown>[] = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
    // scope to the outlet (orders with no outlet field belong to the original/default outlet)
    orders = orders.filter((o) => (Number(o.outlet) || DEFAULT_OUTLET_ID) === wantOutlet);
    if (statusParam && statusParam !== "all") {
      const wanted =
        statusParam === "active" ? ["new", "preparing", "ready"] : statusParam.split(",").map((x) => x.trim());
      orders = orders.filter((o) => wanted.includes(String(o.status)));
    }
    return NextResponse.json({ orders });
  } catch (e) {
    console.error("GET /api/bonbon/orders:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
