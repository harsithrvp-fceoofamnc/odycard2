// ── Site-wide login ──────────────────────────────────────────────────────────
//
// One username and password in front of the whole site. Replaces the old 333221
// access code, which was a single shared number with no identity behind it and no
// way to change it without a deploy.
//
// Everything here uses Web Crypto (globalThis.crypto.subtle) rather than node:crypto,
// because the same functions have to run in TWO places:
//   • the middleware, which is Edge runtime — node:crypto is not available there
//   • the login route, which is Node
// Web Crypto exists in both, so there is one implementation and no chance of the
// signer and the verifier drifting apart.
//
// The token is "<base64url(json)>.<base64url(hmac)>" — the same shape as the existing
// staff session, so it is verified the same way: recompute the MAC over the payload
// and compare. A visitor cannot edit the payload (say, push out the expiry) without
// invalidating the signature, and cannot forge a signature without SESSION_SECRET.

export const SITE_COOKIE = "ody_site";

/** 7 days. Long enough not to nag, short enough that a borrowed phone expires. */
export const SITE_TTL_SEC = 7 * 24 * 60 * 60;

export type SitePayload = { u: string; exp: number };

function secret(): string {
  return process.env.SESSION_SECRET || "dev-insecure-secret-change-me";
}

/** Credentials come from the environment only — never from this file. */
export function siteUser(): string {
  return (process.env.SITE_USER || "").trim();
}
export function sitePass(): string {
  return process.env.SITE_PASS || "";
}
/** With either unset the site fails CLOSED: nobody gets in, rather than everybody. */
export function siteAuthConfigured(): boolean {
  return siteUser().length > 0 && sitePass().length > 0;
}

// ── encoding helpers ─────────────────────────────────────────────────────────
const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s: string): string {
  let b = s.replace(/-/g, "+").replace(/_/g, "/");
  while (b.length % 4) b += "=";
  const bin = atob(b);
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return b64url(new Uint8Array(sig));
}

/** Compare without leaking, through timing, how much of the value was correct. */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ── tokens ───────────────────────────────────────────────────────────────────

export async function createSiteToken(username: string): Promise<string> {
  const payload: SitePayload = { u: username, exp: Math.floor(Date.now() / 1000) + SITE_TTL_SEC };
  const body = b64url(enc.encode(JSON.stringify(payload)));
  return body + "." + (await hmac(body));
}

/** Valid signature AND not expired. Anything else is a no. */
export async function verifySiteToken(token: string | undefined | null): Promise<SitePayload | null> {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    if (!constantTimeEqual(await hmac(body), sig)) return null;
    const p = JSON.parse(b64urlDecode(body)) as SitePayload;
    if (!p || typeof p.exp !== "number" || p.exp <= Math.floor(Date.now() / 1000)) return null;
    return p;
  } catch {
    return null;
  }
}

// ── where to send someone after they sign in ─────────────────────────────────

/**
 * Sanitise a ?next= value.
 *
 * Without this, /enter?next=https://evil.example is an open redirect: the link looks
 * like it belongs to odysra.com, and the site itself bounces the visitor somewhere
 * else. Only a single-slash, same-site path is ever accepted — note that "//evil.com"
 * is protocol-relative and would leave the site, so it is rejected too.
 */
export function safeNext(next: string | null | undefined): string {
  if (!next) return "/hub";
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/hub";
  if (next.startsWith("/enter")) return "/hub"; // don't bounce back to the login
  return next;
}
