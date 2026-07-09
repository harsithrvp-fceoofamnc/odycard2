import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";

// Personal study-planner state store (single user: Harsith).
// Protected by the planner's own access code, separate from the site's demo gate.
export const dynamic = "force-dynamic";

const CODE = () => process.env.HARSITH_CODE || "499853";
const stateDoc = () => getDb().collection("harsith").doc("state");
const authed = (req: NextRequest) => (req.headers.get("x-harsith-code") || "") === CODE();

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const snap = await stateDoc().get();
    return NextResponse.json({ state: snap.exists ? snap.data() : null });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    await stateDoc().set(body.state || {}, { merge: false });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
