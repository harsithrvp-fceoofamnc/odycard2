import { NextRequest, NextResponse } from "next/server";
import { BB, bbDb, bbMenuCol, requireBB } from "@/lib/bonbon";

// The "Manager" report for the owner. The AI server files a small journal per conversation
// (bonbon_signals): what guests craved and — the gold — what they ASKED FOR that we don't have
// or was sold out. Here we just COUNT across conversations (pure code, no AI tokens) and hand the
// owner the demand gaps + taste trends. Owner-only.

type Sig = {
  updated_at?: string;
  outlet?: number;
  turns?: number;
  unavailable?: string[];
  flavors?: string[];
  avoid?: string[];
  moods?: string[];
};

// group near-identical entries: lowercase, strip trailing plurals/punctuation
function norm(s: string): string {
  return String(s || "").toLowerCase().trim().replace(/[.!?,]+$/g, "").replace(/\s+/g, " ");
}
function tally(rows: Sig[], field: keyof Sig): { label: string; count: number }[] {
  const m = new Map<string, { label: string; count: number }>();
  for (const r of rows) {
    const arr = (r[field] as string[]) || [];
    const seen = new Set<string>(); // one conversation counts once per distinct entry
    for (const raw of arr) {
      const k = norm(raw);
      if (!k || seen.has(k)) continue;
      seen.add(k);
      const cur = m.get(k) || { label: raw.trim(), count: 0 };
      cur.count++;
      m.set(k, cur);
    }
  }
  return [...m.values()].sort((a, b) => b.count - a.count);
}

function within(iso: string | undefined, days: number): boolean {
  if (!iso) return false;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  return t >= Date.now() - days * 24 * 60 * 60 * 1000;
}

export async function GET(req: NextRequest) {
  const s = await requireBB(["admin"]);
  if (!s) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  try {
    const url = new URL(req.url);
    const days = Math.min(90, Math.max(1, Number(url.searchParams.get("days")) || 30));
    const outletQ = url.searchParams.get("outlet");
    const outlet = outletQ ? Number(outletQ) : null;

    const snap = await bbDb().collection(BB.signals).get();
    let rows: Sig[] = snap.docs.map((d) => d.data() as Sig);
    rows = rows.filter((r) => within(r.updated_at, days));
    if (outlet != null) rows = rows.filter((r) => (Number(r.outlet) || 1) === outlet);

    const conversations = rows.length;
    const gaps = tally(rows, "unavailable"); // demand we couldn't fill
    const flavors = tally(rows, "flavors"); // what guests love
    const avoid = tally(rows, "avoid");
    const moods = tally(rows, "moods");
    const asked = gaps.reduce((n, g) => n + g.count, 0);

    // ── Boards, from real orders ──────────────────────────────────────────────
    const oSnap = await bbDb().collection(BB.orders).orderBy("ticket", "desc").limit(800).get();
    let orders = oSnap.docs.map((d) => d.data() as { status?: string; created_at?: string; outlet?: number; total?: number; items?: { name: string; qty: number; price: number }[] });
    orders = orders.filter((o) => String(o.status) !== "cancelled" && within(o.created_at, days));
    if (outlet != null) orders = orders.filter((o) => (Number(o.outlet) || 1) === outlet);

    const itemMap = new Map<string, { label: string; qty: number; rev: number }>();
    for (const o of orders) {
      for (const it of o.items || []) {
        const k = norm(it.name);
        if (!k) continue;
        const cur = itemMap.get(k) || { label: it.name.trim(), qty: 0, rev: 0 };
        cur.qty += Number(it.qty) || 1;
        cur.rev += Number(it.price) || 0;
        itemMap.set(k, cur);
      }
    }
    const sold = [...itemMap.values()];
    const leaderboard = sold.slice().sort((a, b) => b.qty - a.qty).slice(0, 10);

    // "To improve" = live menu items that barely sold in the window (0 first)
    let toImprove: { label: string; qty: number }[] = [];
    try {
      const mSnap = await bbMenuCol(outlet != null ? String(outlet) : null).get();
      const menu = mSnap.docs
        .map((d) => d.data() as { name?: string; cat?: string; hidden?: number })
        .filter((m) => m.name && m.cat !== "addon" && !m.hidden);
      toImprove = menu
        .map((m) => ({ label: String(m.name), qty: itemMap.get(norm(String(m.name)))?.qty || 0 }))
        .sort((a, b) => a.qty - b.qty)
        .slice(0, 10);
    } catch {}

    // Daily trend (up to 14 buckets), oldest → newest
    const D = Math.min(days, 14);
    const byDay = new Map<string, { revenue: number; orders: number }>();
    for (const o of orders) {
      const key = String(o.created_at || "").slice(0, 10);
      if (!key) continue;
      const cur = byDay.get(key) || { revenue: 0, orders: 0 };
      cur.revenue += Number(o.total) || 0;
      cur.orders += 1;
      byDay.set(key, cur);
    }
    const trend: { day: string; revenue: number; orders: number }[] = [];
    for (let i = D - 1; i >= 0; i--) {
      const key = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      const c = byDay.get(key) || { revenue: 0, orders: 0 };
      trend.push({ day: key.slice(5), revenue: c.revenue, orders: c.orders });
    }
    const totalRevenue = orders.reduce((n, o) => n + (Number(o.total) || 0), 0);

    return NextResponse.json({
      days,
      conversations,
      askedButMissing: asked,
      gaps: gaps.slice(0, 12),
      flavors: flavors.slice(0, 12),
      avoid: avoid.slice(0, 8),
      moods: moods.slice(0, 8),
      orders: orders.length,
      totalRevenue,
      leaderboard,
      toImprove,
      trend,
    });
  } catch {
    return NextResponse.json({ error: "Could not build insights" }, { status: 500 });
  }
}
