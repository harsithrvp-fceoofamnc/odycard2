// ── Model adapter layer ──────────────────────────────────────────────────────
// The ONLY place that knows which AI model is running. Everything upstream deals in the
// portable policy (lib/bonbonPolicy.ts) and the fixed WaiterOut contract. To add a model,
// write one adapter that turns (system, user, schema) into a WaiterOut and register it
// below — then set AI_PROVIDER=<name>. The rest of the app doesn't change, so a new model
// behaves like the old one.

import { WAITER_GEN, type WaiterOut } from "@/lib/bonbonPolicy";

export type WaiterRequest = {
  system: string;
  user: string;
  schema: unknown;
};

// Which Gemini model runs the AI. Default to Flash (reliable, strong at Tamil/Tanglish + JSON).
// To try the cheaper Flash-Lite, set GEMINI_MODEL=gemini-2.5-flash-lite in the env — no code change.
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// Graceful, identical-across-models fallbacks so a bad model call never breaks the chat.
const FALLBACK_UNCONFIGURED: WaiterOut = { reply: "AI is not configured yet.", actions: [] };
const FALLBACK_ERROR: WaiterOut = { reply: "Sorry, I'm having a little trouble right now — please try again.", actions: [] };
const FALLBACK_PARSE: WaiterOut = { reply: "Sorry, could you say that again?", actions: [] };

// Pull JSON out of a model reply even if it's wrapped in ```json fences or has stray text.
function extractJson(text: string): unknown {
  let t = String(text || "").trim();
  t = t.replace(/^```(?:json)?/i, "").replace(/```\s*$/i, "").trim();
  const a = t.indexOf("{");
  const b = t.lastIndexOf("}");
  if (a >= 0 && b > a) t = t.slice(a, b + 1);
  return JSON.parse(t);
}

// Normalise any parsed model JSON to the WaiterOut contract.
function toWaiterOut(parsed: unknown): WaiterOut {
  const o = (parsed || {}) as Partial<WaiterOut>;
  return {
    reply: typeof o.reply === "string" ? o.reply : "",
    actions: Array.isArray(o.actions) ? o.actions : [],
    signals: o.signals,
  };
}

// ── Gemini adapter ───────────────────────────────────────────────────────────
async function gemini(req: WaiterRequest): Promise<WaiterOut> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return FALLBACK_UNCONFIGURED;
  const body = {
    systemInstruction: { parts: [{ text: req.system }] },
    contents: [{ role: "user", parts: [{ text: req.user }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: WAITER_GEN.temperature,
      maxOutputTokens: WAITER_GEN.maxTokens,
      thinkingConfig: { thinkingBudget: 0 },
      responseSchema: req.schema,
    },
  };
  const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent?key=" + key, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!r.ok || (j && j.error)) return FALLBACK_ERROR;
  try {
    const text = j?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return toWaiterOut(extractJson(text));
  } catch {
    return FALLBACK_PARSE;
  }
}

// ── Registry ─────────────────────────────────────────────────────────────────
// Add "openai" / "claude" adapters here with the same signature. They must return WaiterOut.
const PROVIDERS: Record<string, (req: WaiterRequest) => Promise<WaiterOut>> = {
  gemini,
};

export function activeProvider(): string {
  const p = (process.env.AI_PROVIDER || "gemini").toLowerCase();
  return PROVIDERS[p] ? p : "gemini";
}

/** Run one waiter turn through whichever model is configured. Never throws. */
export async function runWaiter(req: WaiterRequest): Promise<WaiterOut> {
  const fn = PROVIDERS[activeProvider()] || gemini;
  try {
    return await fn(req);
  } catch {
    return FALLBACK_ERROR;
  }
}

/** Generic single-shot text answer (no JSON schema) — powers the owner's AI Manager chat. */
export async function askText(system: string, user: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return "The AI isn't configured yet.";
  try {
    const body = {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { temperature: 0.5, maxOutputTokens: 400, thinkingConfig: { thinkingBudget: 0 } },
    };
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent?key=" + key, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (!r.ok || (j && j.error)) return "Sorry, I couldn't get to that just now — try again.";
    const text = j?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === "string" && text.trim() ? text.trim() : "Hmm, I didn't catch that — ask me again?";
  } catch {
    return "Sorry, something went wrong — try again.";
  }
}
