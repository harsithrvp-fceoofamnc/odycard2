import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { bbDb, requireBB } from "@/lib/bonbon";
import {
  FEST_FEEDBACK, STALL_NAMES, isFeedbackStall, isStar, cleanComment, listFeedback,
} from "@/lib/festFeedback";

export const dynamic = "force-dynamic";

// ── Threat model ─────────────────────────────────────────────────────────────
// POST is open by design: the whole point is that a stranger who scanned a QR code
// can leave a rating without an account. So it is treated as hostile input:
//
//   • whitelist, don't sanitise — stall must be one of three literals, stars must be
//     integers 1..5. Anything else is a 400, not a coercion.
//   • the body is read with a size cap, so nobody can post a 50 MB comment.
//   • the comment is length-capped and stripped of control characters.
//   • only the four validated fields are written. The client's JSON is never spread
//     into the document, so it cannot smuggle extra keys in.
//   • per-IP rate limit, and the IP is only ever held in memory — the stored document
//     has no identifier of any kind in it.
//
// GET is owner-only. Reading what guests wrote is not public.

const BODY_MAX = 4 * 1024; // a rating + 500 chars; anything larger is not a real guest

// ── Rate limit ───────────────────────────────────────────────────────────────
// Per instance, in memory. Not bulletproof across serverless instances, but it turns
// "script 10,000 fake 1-stars into the report" into a nuisance rather than a click.
const HITS = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_IN_WINDOW = 5;

function clientKey(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for") || "";
  const raw = (fwd.split(",")[0] || req.headers.get("x-real-ip") || "unknown").trim();
  // hashed so a raw IP never sits in memory next to the content of a review
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 24);
}

function rateLimited(key: string): boolean {
  const now = Date.now();
  const seen = (HITS.get(key) || []).filter((t) => now - t < WINDOW_MS);
  if (seen.length >= MAX_IN_WINDOW) {
    HITS.set(key, seen);
    return true;
  }
  seen.push(now);
  HITS.set(key, seen);
  if (HITS.size > 5000) HITS.clear(); // crude cap so this cannot grow without bound
  return false;
}

async function readCapped(req: NextRequest): Promise<unknown | null> {
  const len = Number(req.headers.get("content-length") || 0);
  if (len > BODY_MAX) return null;
  const text = await req.text();
  if (text.length > BODY_MAX) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    if (rateLimited(clientKey(req))) {
      return NextResponse.json({ error: "Too many submissions. Try again later." }, { status: 429 });
    }

    const body = await readCapped(req);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }
    const b = body as Record<string, unknown>;

    if (!isFeedbackStall(b.stall)) {
      return NextResponse.json({ error: "Unknown stall" }, { status: 400 });
    }
    if (!isStar(b.food) || !isStar(b.app)) {
      return NextResponse.json({ error: "Ratings must be 1 to 5" }, { status: 400 });
    }

    // Only these five fields are ever written — never a spread of the caller's object.
    const doc = {
      stall: b.stall,
      stallName: STALL_NAMES[b.stall],
      food: b.food,
      app: b.app,
      comment: cleanComment(b.comment),
      created_at: new Date().toISOString(),
    };

    await bbDb().collection(FEST_FEEDBACK).add(doc);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/fest/feedback:", e);
    // never leak the internal error to an anonymous caller
    return NextResponse.json({ error: "Could not save feedback" }, { status: 500 });
  }
}

export async function GET() {
  const s = await requireBB(["admin"]);
  if (!s) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  try {
    return NextResponse.json({ feedback: await listFeedback() });
  } catch (e) {
    console.error("GET /api/fest/feedback:", e);
    return NextResponse.json({ feedback: [] });
  }
}
