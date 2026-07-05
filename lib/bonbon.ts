import crypto from "crypto";
import { cookies } from "next/headers";
import { getDb } from "@/lib/firebase";

// ── Bon Bon dashboards: self-contained auth + data helpers ──────────────────────
// Kept separate from the multi-tenant platform (lib/auth.ts) so the Bon Bon demo is
// simple and can't collide with owner/hotel sessions. Its own cookie: bb_session.

export type BBRole = "admin" | "supervisor" | "waiter" | "kitchen";

export interface BBSession {
  sub: string; // "admin" for the owner, or the staff doc id
  role: BBRole;
  name: string;
  exp: number; // unix seconds
}

export const BB_COOKIE = "bb_session";
export const BB_TTL_ADMIN = 8 * 60 * 60; // 8h
export const BB_TTL_SUPERVISOR = 8 * 60 * 60; // 8h
export const BB_TTL_WAITER = 12 * 60 * 60; // 12h

export function bbTtl(role: BBRole): number {
  // floor roles (waiter, kitchen) get a longer session so staff aren't re-typing passwords mid-shift
  return role === "waiter" || role === "kitchen" ? BB_TTL_WAITER : BB_TTL_ADMIN;
}

function secret(): string {
  return process.env.SESSION_SECRET || "dev-insecure-secret-change-me";
}
function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}
function sign(data: string): string {
  return b64url(crypto.createHmac("sha256", secret()).update("bb:" + data).digest());
}

export function bbCreateToken(payload: Omit<BBSession, "exp">, ttlSec: number): string {
  const full: BBSession = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSec };
  const body = b64url(Buffer.from(JSON.stringify(full)));
  return body + "." + sign(body);
}

export function bbVerifyToken(token?: string | null): BBSession | null {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(fromB64url(body).toString("utf8")) as BBSession;
    if (!p.exp || p.exp < Math.floor(Date.now() / 1000)) return null;
    return p;
  } catch {
    return null;
  }
}

export function bbCookieOptions(ttlSec: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: ttlSec,
  };
}

export async function bbCurrentSession(): Promise<BBSession | null> {
  const c = await cookies();
  return bbVerifyToken(c.get(BB_COOKIE)?.value);
}

/** Returns the session only if its role is allowed, else null. */
export async function requireBB(roles: BBRole[]): Promise<BBSession | null> {
  const s = await bbCurrentSession();
  if (!s || !roles.includes(s.role)) return null;
  return s;
}

// ── Admin bootstrap ─────────────────────────────────────────────────────────────
// The Bon Bon owner login is config, not stored fake data. Set BONBON_ADMIN_USER /
// BONBON_ADMIN_PASS in the host env for production; the defaults only keep the demo running.
export function bbAdminUser(): string {
  return (process.env.BONBON_ADMIN_USER || "admin").toLowerCase();
}
export function bbAdminPass(): string {
  return process.env.BONBON_ADMIN_PASS || "bonbon123";
}

// ── Firestore collections ───────────────────────────────────────────────────────
export const BB = {
  menu: "bonbon_menu", // the DEFAULT outlet's menu lives here (keeps the live chatbot untouched)
  staff: "bonbon_staff",
  orders: "bonbon_orders",
  restaurants: "bonbon_restaurants",
  outlets: "bonbon_outlets",
};

// The original Bon Bon is restaurant #1 / outlet #1. Its menu stays in the top-level `bonbon_menu`
// collection so nothing that already works breaks; every NEW outlet gets its own menu subcollection.
export const DEFAULT_RESTAURANT_ID = 1;
export const DEFAULT_OUTLET_ID = 1;

export function bbDb() {
  return getDb();
}

export function isDefaultOutlet(outletId: unknown): boolean {
  return outletId == null || outletId === "" || String(outletId) === String(DEFAULT_OUTLET_ID);
}

/** Menu collection for a given outlet. Default outlet -> top-level `bonbon_menu`; others -> a
 *  per-outlet subcollection, so each outlet keeps its own independent menu. */
export function bbMenuCol(outletId?: unknown) {
  const db = getDb();
  return isDefaultOutlet(outletId)
    ? db.collection(BB.menu)
    : db.collection(BB.outlets).doc(String(outletId)).collection("menu");
}

/** Make sure the first restaurant + outlet exist (the original Bon Bon). Idempotent. */
export async function ensureDefaultTenant() {
  const db = getDb();
  const rRef = db.collection(BB.restaurants).doc(String(DEFAULT_RESTAURANT_ID));
  const oRef = db.collection(BB.outlets).doc(String(DEFAULT_OUTLET_ID));
  const [r, o] = await Promise.all([rRef.get(), oRef.get()]);
  const now = new Date().toISOString();
  if (!r.exists) await rRef.set({ name: "Bon Bon", created_at: now });
  if (!o.exists)
    await oRef.set({ restaurant_id: DEFAULT_RESTAURANT_ID, name: "Bon Bon", slug: "bon-bon", created_at: now });
}
