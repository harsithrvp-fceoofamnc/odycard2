import { NextRequest, NextResponse } from "next/server";
import { getDb, getNextId } from "@/lib/firebase";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const { hotel_id, mobile, password, gmail, signup_method } = await req.json();
    const method = signup_method || "mobile";
    if (!hotel_id) return NextResponse.json({ error: "hotel_id is required" }, { status: 400 });

    if (method === "google") {
      if (!gmail)
        return NextResponse.json({ error: "gmail is required for Google signup" }, { status: 400 });

      const id = await getNextId("owners");
      await db.collection("owners").doc(String(id)).set({
        hotel_id: parseInt(hotel_id, 10),
        gmail: gmail.toLowerCase().trim(),
        signup_method: "google",
        mobile: null,
        password_hash: null,
        created_at: new Date().toISOString(),
      });
    } else {
      if (!mobile || !password)
        return NextResponse.json({ error: "mobile and password are required" }, { status: 400 });
      if (password.length < 6)
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

      // Check if mobile already exists
      const existing = await db.collection("owners").where("mobile", "==", mobile.trim()).limit(1).get();
      if (!existing.empty)
        return NextResponse.json({ error: "An account with this mobile number already exists" }, { status: 409 });

      const password_hash = await bcrypt.hash(password, 10);
      const id = await getNextId("owners");
      await db.collection("owners").doc(String(id)).set({
        hotel_id: parseInt(hotel_id, 10),
        mobile: mobile.trim(),
        password_hash,
        gmail: null,
        signup_method: "mobile",
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (e: unknown) {
    console.error("POST /api/owners:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
