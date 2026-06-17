import { NextRequest, NextResponse } from "next/server";

// Validates the access code server-side (the code is never sent to the browser).
export async function POST(req: NextRequest) {
  let code = "";
  try {
    const body = await req.json();
    code = String(body.code ?? "");
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const expected = process.env.GATE_CODE || "333221";
  if (code !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  // Session cookie (no maxAge) — exists only so the iframe's /ody + /api/ody requests
  // pass middleware after unlocking. The homepage gate itself always starts locked in
  // memory and re-asks on every load/refresh, so this cookie never "remembers" a login.
  res.cookies.set("ody_gate", "ok", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
  return res;
}
