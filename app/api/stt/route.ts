import { NextRequest, NextResponse } from "next/server";

// Speech-to-text via Sarvam AI (great Indian-language accuracy, incl. Tamil).
// The browser records audio and POSTs it here; we forward it to Sarvam using the
// server-side SARVAM_API_KEY (never exposed to the browser) and return the transcript.
// If the key isn't set, we return 503 so the chatbot falls back to the browser engine.

const SARVAM_URL = "https://api.sarvam.ai/speech-to-text";
const MODEL = "saarika:v2.5";
const LANG: Record<string, string> = {
  en: "en-IN", ta: "ta-IN", hi: "hi-IN", ml: "ml-IN", te: "te-IN", kn: "kn-IN",
};

export async function POST(req: NextRequest) {
  const key = process.env.SARVAM_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "stt_not_configured" }, { status: 503 });
  }

  let inForm: FormData;
  try {
    inForm = await req.formData();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const file = inForm.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "no_audio" }, { status: 400 });
  }
  const lang = String(inForm.get("lang") ?? "en");
  const languageCode = LANG[lang] || "unknown"; // "unknown" lets Sarvam auto-detect

  const out = new FormData();
  out.append("file", file, "audio.webm");
  out.append("model", MODEL);
  out.append("language_code", languageCode);

  try {
    const r = await fetch(SARVAM_URL, {
      method: "POST",
      headers: { "api-subscription-key": key },
      body: out,
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      return NextResponse.json({ error: "stt_failed", detail }, { status: 502 });
    }
    const j: any = await r.json();
    return NextResponse.json({
      text: j.transcript ?? "",
      lang: j.language_code ?? languageCode,
    });
  } catch {
    return NextResponse.json({ error: "stt_error" }, { status: 502 });
  }
}
