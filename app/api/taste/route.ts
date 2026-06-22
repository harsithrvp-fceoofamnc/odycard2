import { NextRequest, NextResponse } from "next/server";
import { getDb, getNextId } from "@/lib/firebase";

// Saves an (optional) customer taste profile from the chatbot onboarding pop-up.
// One doc per submission so we can analyse taste trends per restaurant over time.
export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const restaurant = String(raw.restaurant || "unknown").slice(0, 80);
    const visitor = String(raw.visitor || "anon").slice(0, 60);

    // sanitise answers: keep only strings / arrays-of-strings, capped in size
    const answers: Record<string, unknown> = {};
    const src = raw.answers && typeof raw.answers === "object" ? raw.answers : {};
    for (const k of Object.keys(src).slice(0, 12)) {
      const key = String(k).slice(0, 40);
      const v = (src as Record<string, unknown>)[k];
      if (typeof v === "string") {
        if (v.trim()) answers[key] = v.slice(0, 60);
      } else if (Array.isArray(v)) {
        const arr = v.slice(0, 15).map((x) => String(x).slice(0, 40));
        if (arr.length) answers[key] = arr;
      }
    }

    const db = getDb();
    const id = await getNextId("taste_profiles");
    const doc = {
      restaurant,
      visitor,
      answers,
      created_at: new Date().toISOString(),
    };
    await db.collection("taste_profiles").doc(String(id)).set(doc);
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (e) {
    // Never hard-fail the client — the device copy is the source of truth.
    console.error("POST /api/taste:", e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
