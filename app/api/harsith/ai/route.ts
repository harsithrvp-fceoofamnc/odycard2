import { NextRequest, NextResponse } from "next/server";

// Server-side Gemini proxy for the study planner. Uses its OWN key (HARSITH_GEMINI_KEY),
// separate from any other project key. The key never reaches the browser.
export const dynamic = "force-dynamic";

const CODE = () => process.env.HARSITH_CODE || "499853";

export async function POST(req: NextRequest) {
  if ((req.headers.get("x-harsith-code") || "") !== CODE())
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const key = process.env.HARSITH_GEMINI_KEY;
  if (!key)
    return NextResponse.json({ error: "HARSITH_GEMINI_KEY is not set in Vercel." }, { status: 500 });

  try {
    const { contents, systemInstruction, model, jsonMode } = await req.json();
    const m = model || "gemini-flash-latest";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`;

    const gbody: Record<string, unknown> = { contents };
    if (systemInstruction) gbody.systemInstruction = { parts: [{ text: systemInstruction }] };
    if (jsonMode) gbody.generationConfig = { responseMimeType: "application/json" };

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(gbody),
    });
    const d = await r.json();
    if (!r.ok)
      return NextResponse.json({ error: d?.error?.message || `Gemini ${r.status}` }, { status: r.status });

    const text = d?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
