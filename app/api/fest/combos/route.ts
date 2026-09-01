import { NextRequest, NextResponse } from "next/server";
import { bbDb, requireBB } from "@/lib/bonbon";
import { findFestItem } from "@/lib/festMenu";
import { FEST_COMBOS, listCombos, comboLive, comboStalls, comboOriginal, type Combo } from "@/lib/festCombos";

export const dynamic = "force-dynamic";

// Public read. ?all=1 (owner only) returns scheduled/paused ones too.
export async function GET(req: NextRequest) {
  try {
    const wantAll = req.nextUrl.searchParams.get("all") === "1";
    let combos = await listCombos();

    if (wantAll) {
      const s = await requireBB(["admin"]);
      if (!s) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
    } else {
      combos = combos.filter((c) => comboLive(c));
    }

    const out = combos.map((c) => ({
      ...c,
      stalls: comboStalls(c),
      original: comboOriginal(c),
      items: c.itemIds.map((id) => {
        const it = findFestItem(id);
        return it ? { id, n: it.n, p: it.p, stall: it.stall, stallName: it.stallName, veg: it.veg } : null;
      }).filter(Boolean),
    }));
    return NextResponse.json({ combos: out });
  } catch (e) {
    console.error("GET /api/fest/combos:", e);
    return NextResponse.json({ combos: [] });
  }
}

export async function POST(req: NextRequest) {
  const s = await requireBB(["admin"]);
  if (!s) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  try {
    const b = await req.json();
    const name = String(b.name || "").trim();
    const price = parseInt(String(b.price), 10);
    const itemIds: string[] = Array.isArray(b.itemIds) ? b.itemIds.filter((x: unknown) => typeof x === "string") : [];

    if (!name) return NextResponse.json({ error: "Give the combo a name" }, { status: 400 });
    if (!price || price <= 0) return NextResponse.json({ error: "Enter a valid combo price" }, { status: 400 });
    if (itemIds.length < 2) return NextResponse.json({ error: "Pick at least 2 items" }, { status: 400 });
    const unknown = itemIds.filter((id) => !findFestItem(id));
    if (unknown.length) return NextResponse.json({ error: "Unknown item: " + unknown[0] }, { status: 400 });

    const doc: Omit<Combo, "id"> = {
      name,
      desc: String(b.desc || "").slice(0, 200),
      price,
      itemIds,
      active: b.active !== false,
      startsAt: b.startsAt ? new Date(b.startsAt).toISOString() : null,
      endsAt: b.endsAt ? new Date(b.endsAt).toISOString() : null,
      created_at: new Date().toISOString(),
    };
    const ref = await bbDb().collection(FEST_COMBOS).add(doc);
    return NextResponse.json({ combo: { ...doc, id: ref.id } }, { status: 201 });
  } catch (e) {
    console.error("POST /api/fest/combos:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const s = await requireBB(["admin"]);
  if (!s) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  try {
    const b = await req.json();
    const id = String(b.id || "");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const patch: Record<string, unknown> = {};
    if (typeof b.active === "boolean") patch.active = b.active;
    if (b.price != null) patch.price = parseInt(String(b.price), 10) || 0;
    if (b.endsAt !== undefined) patch.endsAt = b.endsAt ? new Date(b.endsAt).toISOString() : null;
    if (b.startsAt !== undefined) patch.startsAt = b.startsAt ? new Date(b.startsAt).toISOString() : null;
    await bbDb().collection(FEST_COMBOS).doc(id).update(patch);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("PATCH /api/fest/combos:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const s = await requireBB(["admin"]);
  if (!s) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await bbDb().collection(FEST_COMBOS).doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/fest/combos:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
