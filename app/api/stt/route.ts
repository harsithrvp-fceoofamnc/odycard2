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

  // Name the file with an extension that matches what the browser actually recorded,
  // so Sarvam accepts it (Chrome = webm, Safari = mp4/m4a).
  const type = (file.type || "").toLowerCase();
  const ext = type.includes("mp4") || type.includes("m4a") || type.includes("aac") ? "m4a"
    : type.includes("ogg") || type.includes("opus") ? "ogg"
    : type.includes("wav") ? "wav"
    : "webm";

  const out = new FormData();
  out.append("file", file, "audio." + ext);
  out.append("model", MODEL);
  out.append("language_code", languageCode);

  try {
    const r = await fetch(SARVAM_URL, {
      method: "POST",
      headers: { "api-subscription-key": key },
      body: out,
    });
    const detail = await r.text().catch(() => "");
    if (!r.ok) {
      // Return 200 with the reason so the chat can show it (helps debugging).
      return NextResponse.json({ error: "stt_failed", status: r.status, detail: detail.slice(0, 300) });
    }
    let j: any = {};
    try { j = JSON.parse(detail); } catch {}
    return NextResponse.json({
      text: j.transcript ?? "",
      lang: j.language_code ?? languageCode,
    });
  } catch (e: any) {
    return NextResponse.json({ error: "stt_error", detail: String(e?.message || e).slice(0, 300) });
  }
}
