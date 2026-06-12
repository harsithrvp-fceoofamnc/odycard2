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

  const expected = process.env.GATE_CODE || "654321";
  if (code !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("ody_gate", "ok", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 hours
  });
  return res;
}
