import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const { mobile, password } = await req.json();
    if (!mobile || !password)
      return NextResponse.json({ error: "mobile and password are required" }, { status: 400 });

    const ownerSnap = await db
      .collection("owners")
      .where("mobile", "==", mobile.trim())
      .limit(1)
      .get();

    if (ownerSnap.empty)
      return NextResponse.json({ error: "Invalid mobile number or password" }, { status: 401 });

    const ownerDoc = ownerSnap.docs[0];
    const owner = ownerDoc.data();

    const valid = await bcrypt.compare(password, owner.password_hash);
    if (!valid)
      return NextResponse.json({ error: "Invalid mobile number or password" }, { status: 401 });

    const hotelSnap = await db.collection("hotels").doc(String(owner.hotel_id)).get();
    if (!hotelSnap.exists)
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });

    const h = hotelSnap.data()!;
    const hotel = {
      id: parseInt(hotelSnap.id, 10),
      name: h.name,
      slug: h.slug,
      logo_url: h.logo_url ?? null,
      cover_url: h.cover_url ?? null,
      cover_original_url: h.cover_original_url ?? null,
    };

    return NextResponse.json({ hotel });
  } catch (e: unknown) {
    console.error("POST /api/auth/login:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
