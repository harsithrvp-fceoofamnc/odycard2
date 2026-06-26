import { NextRequest, NextResponse } from "next/server";
import { getDb, getNextId } from "@/lib/firebase";
import { currentSession, createToken, SESSION_COOKIE, cookieOptions, TTL_ADMIN } from "@/lib/auth";

// Sign-up step 2: the admin (already authenticated) gives their brand + first branch.
// Creates the branch (hotel), links it to the owner, and re-issues the session with the branch.

function slugify(s: string): string {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function POST(req: NextRequest) {
  const s = await currentSession();
  if (!s || s.role !== "admin") return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  try {
    const db = getDb();
    const { brand_name, branch_name } = await req.json();
    if (!brand_name || !String(brand_name).trim())
      return NextResponse.json({ error: "Brand name is required" }, { status: 400 });

    const brandSlug = slugify(brand_name) || `brand-${Date.now()}`;
    const branchName = (branch_name && String(branch_name).trim()) || "Main branch";

    const base = `${brandSlug}-${slugify(branchName) || "main"}`;
    let finalSlug = base;
    let attempt = 0;
    while (true) {
      const ex = await db.collection("hotels").where("slug", "==", finalSlug).limit(1).get();
      if (ex.empty) break;
      attempt++;
      finalSlug = `${base}-${attempt}`;
    }

    const hotelId = await getNextId("hotels");
    const now = new Date().toISOString();
    await db.collection("hotels").doc(String(hotelId)).set({
      name: branchName,
      slug: finalSlug,
      owner_id: s.oid,
      brand_name,
      brand_slug: brandSlug,
      address: null,
      logo_url: null,
      cover_url: null,
      cover_original_url: null,
      ody_menu_hidden: false,
      created_at: now,
    });

    await db.collection("owners").doc(String(s.oid)).set(
      { hotel_id: hotelId, brand_name, brand_slug: brandSlug },
      { merge: true }
    );

    // re-issue session now that the admin has a branch
    const token = createToken({ sub: s.sub, role: "admin", oid: s.oid, bid: hotelId, name: brand_name }, TTL_ADMIN);
    const res = NextResponse.json({ ok: true, redirect: "/admin" });
    res.cookies.set(SESSION_COOKIE, token, cookieOptions(TTL_ADMIN));
    return res;
  } catch (e: unknown) {
    console.error("POST /api/auth/setup:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
