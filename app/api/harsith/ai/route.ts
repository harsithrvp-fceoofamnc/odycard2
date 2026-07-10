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
    const m = model || "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`;

    const gbody: Record<string, unknown> = { contents };
    if (systemInstruction) gbody.systemInstruction = { parts: [{ text: systemInstruction }] };
    if (jsonMode) gbody.generationConfig = { responseMimeType: "application/json" };

    // Retry transient overloads (429/503) a couple of times before giving up.
    type GeminiResp = {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      error?: { message?: string };
    };
    let r: Response | null = null;
    let d: GeminiResp = {};
    for (let attempt = 0; attempt < 3; attempt++) {
      r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gbody),
      });
      d = await r.json();
      if (r.ok || (r.status !== 429 && r.status !== 503)) break;
      if (attempt < 2) await new Promise((res) => setTimeout(res, 700 * (attempt + 1)));
    }
    if (!r || !r.ok) {
      const err = d?.error?.message;
      return NextResponse.json({ error: err || `Gemini ${r?.status || "error"}` }, { status: r?.status || 502 });
    }

    const text = d?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
