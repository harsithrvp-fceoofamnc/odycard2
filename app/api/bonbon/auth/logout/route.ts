import { NextResponse } from "next/server";
import { BB_COOKIE } from "@/lib/bonbon";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(BB_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
