import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { BB, bbDb, requireBB } from "@/lib/bonbon";
import { getNextId } from "@/lib/firebase";

// Bon Bon staff = supervisors + waiters. Admin-only: list, create, enable/disable, delete.

function cleanUsername(u: string): string {
  return String(u).toLowerCase().trim().replace(/[^a-z0-9._-]/g, "");
}

export async function GET() {
  const s = await requireBB(["admin"]);
  if (!s) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  const db = bbDb();
  const snap = await db.collection(BB.staff).get();
  const staff = snap.docs
    .map((d) => {
      const x = d.data();
      return { id: d.id, name: x.name, username: x.username, role: x.role, active: x.active !== false, created_at: x.created_at ?? null };
    })
    .sort((a, b) => Number(a.id) - Number(b.id));
  return NextResponse.json({ staff });
}

export async function POST(req: NextRequest) {
  const s = await requireBB(["admin"]);
  if (!s) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  try {
    const db = bbDb();
    const b = await req.json();
    const role = b.role === "supervisor" ? "supervisor" : "waiter";
    const name = String(b.name || "").trim();
    const username = cleanUsername(b.username || "");
    const password = String(b.password || "");
    if (!name || !username || !password)
      return NextResponse.json({ error: "Name, username and password are required" }, { status: 400 });
    if (role === "supervisor" && password.length < 8)
      return NextResponse.json({ error: "Supervisor passwords need at least 8 characters" }, { status: 400 });
    if (role === "waiter" && password.length < 4)
      return NextResponse.json({ error: "Waiter password needs at least 4 characters" }, { status: 400 });
    if (username === "admin") return NextResponse.json({ error: "That username is reserved" }, { status: 409 });

    const ex = await db.collection(BB.staff).where("username", "==", username).limit(1).get();
    if (!ex.empty) return NextResponse.json({ error: "That username is taken" }, { status: 409 });

    const password_hash = await bcrypt.hash(password, role === "supervisor" ? 12 : 10);
    const id = await getNextId(BB.staff);
    const doc = { role, name, username, password_hash, active: true, created_at: new Date().toISOString() };
    await db.collection(BB.staff).doc(String(id)).set(doc);
    return NextResponse.json({ id: String(id), name, username, role }, { status: 201 });
  } catch (e) {
    console.error("POST /api/bonbon/staff:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
