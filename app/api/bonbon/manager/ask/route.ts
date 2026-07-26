import { NextRequest, NextResponse } from "next/server";
import { BB, bbDb, requireBB } from "@/lib/bonbon";
import { JUNE_SALES, JUNE_TOTALS } from "@/lib/bonbonSalesSeed";
import { askText } from "@/lib/aiProvider";

// The owner's "Ask your manager" chat. Owner-only. Builds a compact context from the shop's real
// sales (June report + any live orders) plus demand signals from customer chats, then answers the
// owner's question with a real model — specific advice, not canned lines.

export async function POST(req: NextRequest) {
  const s = await requireBB(["admin"]);
  if (!s) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  try {
    const { question } = await req.json();
    const q = String(question || "").trim();
    if (!q) return NextResponse.json({ answer: "Ask me anything about your shop — sales, what to promote, what to stock." });

    // Best + slowest sellers from the real June sales.
    const byRev = [...JUNE_SALES].sort((a, b) => b.total - a.total);
    const byQty = [...JUNE_SALES].sort((a, b) => a.qty - b.qty);
    const top = byRev.slice(0, 12).map((x) => `${x.item} (${x.qty} sold, ₹${x.total})`).join("; ");
    const slow = byQty.slice(0, 10).map((x) => `${x.item} (${x.qty})`).join("; ");

    // Demand gaps from customer chats (items asked for that aren't stocked / were sold out).
    let gaps = "";
    try {
      const snap = await bbDb().collection(BB.signals).get();
      const m = new Map<string, number>();
      snap.docs.forEach((d) => {
        const arr = (d.data().unavailable as string[]) || [];
        const seen = new Set<string>();
        for (const u of arr) {
          const k = String(u).toLowerCase().trim();
          if (!k || seen.has(k)) continue;
          seen.add(k);
          m.set(k, (m.get(k) || 0) + 1);
        }
      });
      gaps = [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, c]) => `${k} (${c})`).join(", ");
    } catch {}

    const system = [
      "You are the AI business manager for Bon Bon, an ice cream parlour. You advise the OWNER directly.",
      "Answer THE ACTUAL QUESTION asked, specifically and practically, in 2-4 short sentences. Never give a generic catch-all answer, and never repeat yourself.",
      "Use the shop's real numbers below. Money is in rupees (₹). Only reference items that appear in the data.",
      "When asked what to promote: name specific items and WHY — push proven high-volume winners for more volume, bundle them to lift the bill, revive slow movers, or add items guests keep asking for. End with one concrete action.",
      "",
      `Sales so far: ₹${JUNE_TOTALS.total} across ${JUNE_TOTALS.qty} items (${JUNE_TOTALS.month}).`,
      `Top sellers: ${top}.`,
      `Slowest movers: ${slow}.`,
      gaps ? `Guests keep asking for these (not on the menu or sold out): ${gaps}.` : "No unmet-demand signals from customer chats yet.",
    ].join("\n");

    const answer = await askText(system, q.slice(0, 500));
    return NextResponse.json({ answer });
  } catch {
    return NextResponse.json({ answer: "Sorry, something went wrong — please try again." });
  }
}
