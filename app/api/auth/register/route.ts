import { NextRequest, NextResponse } from "next/server";
import { getDb, getNextId } from "@/lib/firebase";
import { hashPassword, createToken, SESSION_COOKIE, cookieOptions, TTL_ADMIN } from "@/lib/auth";

// Admin sign-up. Creates the owner (admin) account, the brand, and the first branch,
// then signs the owner straight in. Owner === admin (full access, incl. sales).

function slugify(s: string): string {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const { brand_name, branch_name, mobile, gmail, password } = await req.json();

    if (!brand_name || !password || (!mobile && !gmail))
      return NextResponse.json({ error: "Brand name, a mobile or email, and a password are required" }, { status: 400 });
    if (String(password).length < 8)
      return NextResponse.json({ error: "Use at least 8 characters for the admin password" }, { status: 400 });

    if (mobile) {
      const ex = await db.collection("owners").where("mobile", "==", String(mobile).trim()).limit(1).get();
      if (!ex.empty) return NextResponse.json({ error: "An account with this mobile already exists" }, { status: 409 });
    }
    if (gmail) {
      const ex = await db.collection("owners").where("gmail", "==", String(gmail).toLowerCase().trim()).limit(1).get();
      if (!ex.empty) return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const brandSlug = slugify(brand_name) || `brand-${Date.now()}`;
    const branchName = (branch_name && String(branch_name).trim()) || "Main branch";

    // unique branch slug (brand + branch)
    const baseSlug = `${brandSlug}-${slugify(branchName) || "main"}`;
    let finalSlug = baseSlug;
    let attempt = 0;
    while (true) {
      const ex = await db.collection("hotels").where("slug", "==", finalSlug).limit(1).get();
      if (ex.empty) break;
      attempt++;
      finalSlug = `${baseSlug}-${attempt}`;
    }

    const hotelId = await getNextId("hotels");
    const ownerId = await getNextId("owners");
    const now = new Date().toISOString();

    await db.collection("hotels").doc(String(hotelId)).set({
      name: branchName,
      slug: finalSlug,
      owner_id: ownerId,
      brand_name,
      brand_slug: brandSlug,
      address: null,
      logo_url: null,
      cover_url: null,
      cover_original_url: null,
      ody_menu_hidden: false,
      created_at: now,
    });

    const password_hash = await hashPassword(password, true);
    await db.collection("owners").doc(String(ownerId)).set({
      hotel_id: hotelId,
      brand_name,
      brand_slug: brandSlug,
      mobile: mobile ? String(mobile).trim() : null,
      gmail: gmail ? String(gmail).toLowerCase().trim() : null,
      password_hash,
      signup_method: mobile ? "mobile" : "google",
      role: "admin",
      created_at: now,
    });

    const token = createToken({ sub: ownerId, role: "admin", oid: ownerId, bid: hotelId, name: brand_name }, TTL_ADMIN);
    const res = NextResponse.json(
      { ok: true, admin: { id: ownerId, brand_name }, branch: { id: hotelId, name: branchName, slug: finalSlug } },
      { status: 201 }
    );
    res.cookies.set(SESSION_COOKIE, token, cookieOptions(TTL_ADMIN));
    return res;
  } catch (e: unknown) {
    console.error("POST /api/auth/register:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
