// ── Guest feedback from the three fest stalls ────────────────────────────────
//
// Two ratings, deliberately kept apart: the FOOD (which belongs to the stall) and
// the APP (which belongs to us). Averaging them together would hide the thing each
// one is for — a great burger behind a clumsy menu, or the reverse.
//
// Everything here is Firestore. There is no SQL anywhere in this path, so there is
// no SQL to inject; the protection that does matter is strict validation of what a
// stranger with a QR code is allowed to write, and that lives in the API route.

import crypto from "crypto";
import { bbDb } from "@/lib/bonbon";

export const FEST_FEEDBACK = "fest_feedback";

// ── Access to the feedback board ─────────────────────────────────────────────
// Same code as the hub (GATE_CODE), but its own cookie: unlocking the board does not
// unlock the chatbot demo, and unlocking the demo does not reveal the board.
export const FEEDBACK_COOKIE = "ody_fb";

/** Signed cookie value, so nobody can just set ody_fb=ok in devtools. */
export function feedbackCookieValue(): string {
  const secret = process.env.SESSION_SECRET || "dev-insecure-secret-change-me";
  return crypto.createHmac("sha256", secret).update("fest-feedback:v1").digest("hex").slice(0, 32);
}


/** The only stalls that may appear on a feedback document. */
export const FEEDBACK_STALLS = ["bonbon", "kimchi", "dvour"] as const;
export type FeedbackStall = (typeof FEEDBACK_STALLS)[number];

export const COMMENT_MAX = 500;

export type Feedback = {
  id: string;
  stall: FeedbackStall;
  stallName: string;
  food: number; // 1..5
  app: number; // 1..5
  comment: string; // "" when they only rated
  created_at: string; // ISO
};

export const STALL_NAMES: Record<FeedbackStall, string> = {
  bonbon: "Bon Bon Ice Creams",
  kimchi: "Kim Chi & Ramen",
  dvour: "D'VOUR",
};

export function isFeedbackStall(v: unknown): v is FeedbackStall {
  return typeof v === "string" && (FEEDBACK_STALLS as readonly string[]).includes(v);
}

/** A star must be a whole number from 1 to 5 — not 4.5, not "5", not 1e9. */
export function isStar(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 5;
}

/**
 * Make a free-text comment safe to store.
 *
 * Strips control characters (which can garble a terminal or a CSV export), collapses
 * runaway whitespace, and hard-caps the length. React escapes on render, so the read
 * side is safe from HTML injection regardless — this is about keeping the data itself
 * sane and bounded.
 */
export function cleanComment(v: unknown): string {
  if (typeof v !== "string") return "";
  return v
    // control characters would garble a CSV export or a terminal; newlines and tabs stay
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[ \t]{3,}/g, "  ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, COMMENT_MAX);
}

export async function listFeedback(): Promise<Feedback[]> {
  const snap = await bbDb().collection(FEST_FEEDBACK).get();
  return snap.docs
    .map((d) => ({ ...(d.data() as Omit<Feedback, "id">), id: d.id }))
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
}

/** Averages + counts for the summary strip on the viewer page. */
export function summarise(rows: Feedback[]) {
  const avg = (pick: (r: Feedback) => number) =>
    rows.length ? Math.round((rows.reduce((t, r) => t + pick(r), 0) / rows.length) * 10) / 10 : 0;
  const byStall = {} as Record<string, { n: number; food: number; app: number }>;
  for (const r of rows) {
    const b = (byStall[r.stall] ||= { n: 0, food: 0, app: 0 });
    b.n++;
    b.food += r.food;
    b.app += r.app;
  }
  return {
    total: rows.length,
    food: avg((r) => r.food),
    app: avg((r) => r.app),
    withComment: rows.filter((r) => r.comment).length,
    byStall: Object.entries(byStall).map(([stall, b]) => ({
      stall,
      name: STALL_NAMES[stall as FeedbackStall] || stall,
      n: b.n,
      food: Math.round((b.food / b.n) * 10) / 10,
      app: Math.round((b.app / b.n) * 10) / 10,
    })),
  };
}
