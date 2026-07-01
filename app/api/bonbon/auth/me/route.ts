import { NextResponse } from "next/server";
import { bbCurrentSession } from "@/lib/bonbon";

export async function GET() {
  const s = await bbCurrentSession();
  if (!s) return NextResponse.json({ session: null }, { status: 200 });
  return NextResponse.json({ session: { role: s.role, name: s.name, sub: s.sub } });
}
