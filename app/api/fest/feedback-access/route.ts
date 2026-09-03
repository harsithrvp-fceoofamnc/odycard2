import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { FEEDBACK_COOKIE, feedbackCookieValue } from "@/lib/festFeedback";

export const dynamic = "force-dynamic";

// Access code for the feedback board — the same hub code (GATE_CODE, 333221 by default),
// so there is one code to remember rather than two.
//
// It still gets its OWN cookie rather than reusing ody_gate: ody_gate unlocks the chatbot
// demo, and the two should not imply each other. Unlocking the board does not unlock the
// demo, and vice versa.
//
// FEEDBACK_CODE, if set, overrides it — that is the escape hatch if the board ever needs
// to be locked separately from the hub without a code change.
//
// The code never reaches the browser. It is compared here, server-side, in constant time.

function expectedCode(): string {
  return process.env.FEEDBACK_CODE || process.env.GATE_CODE || "333221";
}

// ── Brute-force throttle ─────────────────────────────────────────────────────
// Without it, a short numeric code can be machine-gunned in seconds.
const ATTEMPTS = new Map<string, { n: number; until: number }>();
const MAX_TRIES = 6;
const LOCK_MS = 15 * 60 * 1000;

function clientKey(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for") || "";
  const raw = (fwd.split(",")[0] || req.headers.get("x-real-ip") || "unknown").trim();
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 24);
}
function lockedFor(key: string): number {
  const e = ATTEMPTS.get(key);
  if (!e) return 0;
  if (Date.now() > e.until) { ATTEMPTS.delete(key); return 0; }
  return e.n >= MAX_TRIES ? Math.ceil((e.until - Date.now()) / 60000) : 0;
}
function noteFail(key: string) {
  const e = ATTEMPTS.get(key);
  const n = (e && Date.now() <= e.until ? e.n : 0) + 1;
  ATTEMPTS.set(key, { n, until: Date.now() + LOCK_MS });
  if (ATTEMPTS.size > 5000) ATTEMPTS.clear();
}

/** Length-safe constant-time compare — timingSafeEqual throws on a length mismatch. */
function sameCode(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export async function POST(req: NextRequest) {
  const key = clientKey(req);
  const mins = lockedFor(key);
  if (mins) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.` },
      { status: 429 }
    );
  }

  let code = "";
  try {
    const text = await req.text();
    if (text.length > 512) return NextResponse.json({ error: "Bad request" }, { status: 400 });
    code = String(JSON.parse(text).code ?? "");
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (!sameCode(code, expectedCode())) {
    noteFail(key);
    return NextResponse.json({ error: "Wrong code" }, { status: 401 });
  }

  ATTEMPTS.delete(key);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(FEEDBACK_COOKIE, feedbackCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 12 * 60 * 60, // one long event day, then it asks again
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(FEEDBACK_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
