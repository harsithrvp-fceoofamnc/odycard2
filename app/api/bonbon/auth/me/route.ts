import { NextResponse } from "next/server";
import { bbCurrentSession, bbDb, BB } from "@/lib/bonbon";

export async function GET() {
  const s = await bbCurrentSession();
  if (!s) return NextResponse.json({ session: null }, { status: 200 });
  // waiters carry their assigned table numbers so the waiter dashboard can filter to their tables
  let tables: number[] = [];
  if (s.role === "waiter" && s.sub && s.sub !== "admin") {
    try {
      const doc = await bbDb().collection(BB.staff).doc(String(s.sub)).get();
      const t = doc.exists ? (doc.data() || {}).tables : null;
      if (Array.isArray(t)) tables = t as number[];
    } catch {}
  }
  return NextResponse.json({ session: { role: s.role, name: s.name, sub: s.sub, tables } });
}
