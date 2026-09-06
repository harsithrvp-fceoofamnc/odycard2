import { NextResponse } from "next/server";
import { SITE_COOKIE } from "@/lib/siteAuth";

export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SITE_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
