import { NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";

export async function GET() {
  const s = await currentSession();
  if (!s) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({
    authenticated: true,
    user: { id: s.sub, role: s.role, owner_id: s.oid, branch_id: s.bid, name: s.name ?? null },
  });
}
