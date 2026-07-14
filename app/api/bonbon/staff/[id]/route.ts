import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { BB, bbDb, requireBB } from "@/lib/bonbon";

// Passwords are bcrypt-hashed, so an existing one can never be read back. Instead the owner
// RESETS it: we generate (or accept) a new password, store only its hash, and return the
// plaintext ONCE in this response so the owner can hand it to the staff member.
function genPassword(len: number): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789"; // no ambiguous chars (l/1/o/0) — easy to read out
  const b = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += chars[b[i] % chars.length];
  return out;
}

// Enable/disable, reset password, or delete a staff login — admin-only.
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await requireBB(["admin"]);
  if (!s) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  try {
    const { id } = await ctx.params;
    const b = await req.json();
    const ref = bbDb().collection(BB.staff).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const patch: Record<string, unknown> = {};
    if (b.active !== undefined) patch.active = !!b.active;

    let newPassword: string | null = null;
    if (b.resetPassword || typeof b.password === "string") {
      const role = String((snap.data() || {}).role || "waiter");
      const isSup = role === "supervisor";
      const pwd = typeof b.password === "string" && b.password ? String(b.password) : genPassword(isSup ? 12 : 8);
      const min = isSup ? 8 : 4;
      if (pwd.length < min)
        return NextResponse.json({ error: `Password needs at least ${min} characters` }, { status: 400 });
      patch.password_hash = await bcrypt.hash(pwd, isSup ? 12 : 10);
      newPassword = pwd;
    }

    if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    await ref.set(patch, { merge: true });
    return NextResponse.json(newPassword ? { ok: true, password: newPassword } : { ok: true });
  } catch (e) {
    console.error("PATCH /api/bonbon/staff/[id]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await requireBB(["admin"]);
  if (!s) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  try {
    const { id } = await ctx.params;
    await bbDb().collection(BB.staff).doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/bonbon/staff/[id]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
