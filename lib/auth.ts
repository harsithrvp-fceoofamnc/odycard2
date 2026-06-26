import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

// ── Roles ─────────────────────────────────────────────────────────────────────
export type Role = "admin" | "supervisor" | "waiter";

export interface Session {
  sub: number; // user id (owner id for admin, staff id otherwise)
  role: Role;
  oid: number; // owner id (the tenant / brand this user belongs to)
  bid: number | null; // branch (hotel) id this user is scoped to, if any
  name?: string;
  exp: number; // unix seconds
}

export const SESSION_COOKIE = "ody_session";

// Admin & supervisor sessions are short-lived (high security); waiters get a longer one
// so floor staff aren't re-typing passwords mid-shift.
export const TTL_ADMIN = 8 * 60 * 60; // 8h
export const TTL_SUPERVISOR = 8 * 60 * 60; // 8h
export const TTL_WAITER = 12 * 60 * 60; // 12h

function secret(): string {
  // Set SESSION_SECRET in the host env for production. The fallback only keeps dev running.
  return process.env.SESSION_SECRET || "dev-insecure-secret-change-me";
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}
function sign(data: string): string {
  return b64url(crypto.createHmac("sha256", secret()).update(data).digest());
}

/** Build a signed session token. Tamper-proof (HMAC-SHA256) and self-expiring. */
export function createToken(payload: Omit<Session, "exp">, ttlSec: number): string {
  const full: Session = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSec };
  const body = b64url(Buffer.from(JSON.stringify(full)));
  return body + "." + sign(body);
}

/** Verify a signed session token. Returns the session, or null if invalid/expired/tampered. */
export function verifyToken(token?: string | null): Session | null {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  // constant-time compare
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(fromB64url(body).toString("utf8")) as Session;
    if (!p.exp || p.exp < Math.floor(Date.now() / 1000)) return null;
    return p;
  } catch {
    return null;
  }
}

// ── Passwords ────────────────────────────────────────────────────────────────
/** strong=true → bcrypt cost 12 (admin/supervisor). strong=false → cost 10 (waiter). */
export function hashPassword(pw: string, strong = true): Promise<string> {
  return bcrypt.hash(pw, strong ? 12 : 10);
}
export function checkPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

// ── Cookie helpers (for route handlers using NextResponse.cookies.set) ─────────
export function cookieOptions(ttlSec: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: ttlSec,
  };
}
export function ttlForRole(role: Role): number {
  return role === "waiter" ? TTL_WAITER : role === "supervisor" ? TTL_SUPERVISOR : TTL_ADMIN;
}

// ── Server-side session access (server components / route handlers) ───────────
export async function currentSession(): Promise<Session | null> {
  const c = await cookies();
  return verifyToken(c.get(SESSION_COOKIE)?.value);
}

/** Returns the session only if its role is allowed, else null. */
export async function requireRole(roles: Role[]): Promise<Session | null> {
  const s = await currentSession();
  if (!s || !roles.includes(s.role)) return null;
  return s;
}
