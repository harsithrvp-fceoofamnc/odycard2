import { NextRequest, NextResponse } from "next/server";

// Server-side Gemini proxy for the study planner. Uses its OWN key (HARSITH_GEMINI_KEY),
// separate from any other project key. The key never reaches the browser.
export const dynamic = "force-dynamic";

const CODE = () => process.env.HARSITH_CODE || "499853";
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

type GeminiResp = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string };
};

export async function POST(req: NextRequest) {
  if ((req.headers.get("x-harsith-code") || "") !== CODE())
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const key = process.env.HARSITH_GEMINI_KEY;
  if (!key)
    return NextResponse.json({ error: "HARSITH_GEMINI_KEY is not set in Vercel." }, { status: 500 });

  try {
    const { contents, systemInstruction, model, jsonMode } = await req.json();

    const gbody: Record<string, unknown> = { contents };
    if (systemInstruction) gbody.systemInstruction = { parts: [{ text: systemInstruction }] };
    if (jsonMode) gbody.generationConfig = { responseMimeType: "application/json" };

    // Try the requested model first, then fall back to others open to new keys.
    // Handles "model not available to this key" (skip to next) and transient
    // overloads 429/503 (retry, then next). First success wins.
    const candidates = [
      ...new Set([
        model || "gemini-flash-lite-latest",
        "gemini-flash-lite-latest",
        "gemini-flash-latest",
        "gemini-3.1-flash-lite",
      ]),
    ];

    let lastErr = "No model responded.";
    let lastStatus = 502;

    for (const mm of candidates) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${mm}:generateContent?key=${key}`;
      let r: Response | null = null;
      let d: GeminiResp = {};
      for (let attempt = 0; attempt < 2; attempt++) {
        r = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(gbody),
        });
        d = await r.json();
        if (r.ok || (r.status !== 429 && r.status !== 503)) break;
        if (attempt < 1) await sleep(600);
      }
      if (r && r.ok) {
        const text = d?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        return NextResponse.json({ text, model: mm });
      }
      lastErr = d?.error?.message || `Gemini ${r?.status || "error"}`;
      lastStatus = r?.status || 502;
      // otherwise try the next candidate model
    }

    return NextResponse.json({ error: lastErr }, { status: lastStatus });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
