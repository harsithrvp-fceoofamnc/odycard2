import { NextRequest, NextResponse } from "next/server";
import { getDb, getNextId } from "@/lib/firebase";
import { requireRole, hashPassword, Role } from "@/lib/auth";

// Staff = supervisors + waiters, in the `staff` collection.
//  - Admin can list all their staff and create supervisors or waiters for any of their branches.
//  - Supervisor can list their branch's waiters and create waiters for their own branch only.
// Supervisors get a strong-hashed password (high security); waiters get a normal one.

function cleanUsername(u: string): string {
  return String(u).toLowerCase().trim().replace(/[^a-z0-9._-]/g, "");
}

export async function GET() {
  const s = await requireRole(["admin", "supervisor"]);
  if (!s) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  const db = getDb();

  let q;
  if (s.role === "admin") {
    q = db.collection("staff").where("owner_id", "==", s.oid);
  } else {
    // supervisor: only the waiters on their branch
    q = db.collection("staff").where("branch_id", "==", s.bid);
  }
  const snap = await q.get();
  const staff = snap.docs
    .map((d) => {
      const x = d.data();
      return {
        id: parseInt(d.id, 10),
        name: x.name,
        username: x.username,
        role: x.role,
        branch_id: x.branch_id ?? null,
        active: x.active !== false,
        created_at: x.created_at ?? null,
      };
    })
    .filter((x) => (s.role === "supervisor" ? x.role === "waiter" : true))
    .sort((a, b) => a.id - b.id);
  return NextResponse.json({ staff });
}

export async function POST(req: NextRequest) {
  const s = await requireRole(["admin", "supervisor"]);
  if (!s) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  try {
    const db = getDb();
    const body = await req.json();
    const name = String(body.name || "").trim();
    const username = cleanUsername(body.username || "");
    const password = String(body.password || "");

    if (!name || !username || !password)
      return NextResponse.json({ error: "Name, username and password are required" }, { status: 400 });

    // Decide role + branch + whom this user belongs to, based on who's creating.
    let role: Role;
    let branch_id: number;
    if (s.role === "admin") {
      role = body.role === "supervisor" ? "supervisor" : "waiter";
      branch_id = parseInt(String(body.branch_id), 10);
      if (!branch_id) return NextResponse.json({ error: "Choose a branch" }, { status: 400 });
      // branch must belong to this owner
      const bdoc = await db.collection("hotels").doc(String(branch_id)).get();
      if (!bdoc.exists || bdoc.data()!.owner_id !== s.oid)
        return NextResponse.json({ error: "That branch isn't yours" }, { status: 403 });
    } else {
      // supervisor → can only create waiters on their own branch
      role = "waiter";
      branch_id = s.bid as number;
      if (!branch_id) return NextResponse.json({ error: "No branch assigned" }, { status: 400 });
    }

    // password rules: supervisors high-security, waiters simpler
    if (role === "supervisor" && password.length < 8)
      return NextResponse.json({ error: "Supervisor passwords need at least 8 characters" }, { status: 400 });
    if (role === "waiter" && password.length < 4)
      return NextResponse.json({ error: "Waiter password needs at least 4 characters" }, { status: 400 });

    // username must be globally unique (it's the login)
    const ex = await db.collection("staff").where("username", "==", username).limit(1).get();
    if (!ex.empty) return NextResponse.json({ error: "That username is taken" }, { status: 409 });

    const password_hash = await hashPassword(password, role === "supervisor");
    const id = await getNextId("staff");
    const doc = {
      owner_id: s.oid,
      branch_id,
      role,
      name,
      username,
      password_hash,
      active: true,
      created_by: s.sub,
      created_at: new Date().toISOString(),
    };
    await db.collection("staff").doc(String(id)).set(doc);
    return NextResponse.json({ id, name, username, role, branch_id }, { status: 201 });
  } catch (e: unknown) {
    console.error("POST /api/staff:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
