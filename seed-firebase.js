/**
 * seed-firebase.js
 *
 * Seeds Firestore with all OdyCard data migrated from Supabase.
 *
 * Run ONCE from the project root:
 *   node seed-firebase.js
 *
 * Requires FIREBASE_SERVICE_ACCOUNT env var to be set, e.g.:
 *   FIREBASE_SERVICE_ACCOUNT='<contents of service account JSON>' node seed-firebase.js
 *
 * Or place the service account JSON path in the script directly (see below).
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// ─── Init ────────────────────────────────────────────────────────────────────
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  // Fallback: load from the uploaded JSON file
  const saPath = path.join(__dirname, "../uploads/odycard-firebase-adminsdk-fbsvc-f7a8996df5.json");
  if (fs.existsSync(saPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(saPath, "utf8"));
  } else {
    console.error("No service account found. Set FIREBASE_SERVICE_ACCOUNT env var.");
    process.exit(1);
  }
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// ─── Data ─────────────────────────────────────────────────────────────────────

const hotels = [
  { id: 1, name: "u", slug: "u", created_at: "2026-04-01T09:29:42.102Z", ody_menu_hidden: false, logo_url: null, cover_url: null, cover_original_url: null },
  { id: 2, name: "m", slug: "m", created_at: "2026-04-01T09:39:36.206Z", ody_menu_hidden: false, logo_url: null, cover_url: null, cover_original_url: null },
  { id: 3, name: "Annapoorna", slug: "annapoorna", created_at: "2026-04-01T09:51:36.405Z", ody_menu_hidden: false, logo_url: null, cover_url: null, cover_original_url: null },
  { id: 4, name: "Bon Bon Icecreams", slug: "bon-bon-icecreams", created_at: "2026-04-01T10:03:29.231Z", ody_menu_hidden: false, logo_url: null, cover_url: null, cover_original_url: null },
  { id: 5, name: "Bon Bon Icecreams", slug: "bon-bon-icecreams-1", created_at: "2026-04-01T10:13:13.285Z", ody_menu_hidden: false, logo_url: null, cover_url: null, cover_original_url: null },
  { id: 6, name: "Bon Bon Icecreams", slug: "bon-bon-icecreams-2", created_at: "2026-04-02T03:33:51.538Z", ody_menu_hidden: false, logo_url: null, cover_url: null, cover_original_url: null },
  { id: 7, name: "Bon Bon Icecreams", slug: "bon-bon-icecreams-3", created_at: "2026-04-02T03:52:35.335Z", ody_menu_hidden: false, logo_url: null, cover_url: null, cover_original_url: null },
  { id: 8, name: "Bon Bon Icecreams", slug: "bon-bon-icecreams-4", created_at: "2026-04-02T04:48:13.040Z", ody_menu_hidden: false, logo_url: null, cover_url: null, cover_original_url: null },
  { id: 9, name: "Bon Bon Icecreams", slug: "bon-bon-icecreams-5", created_at: "2026-04-02T07:21:12.571Z", ody_menu_hidden: false, logo_url: null, cover_url: null, cover_original_url: null },
  { id: 10, name: "Bon Bon", slug: "bon-bon", created_at: "2026-04-03T18:18:39.468Z", ody_menu_hidden: false, logo_url: null, cover_url: null, cover_original_url: null },
  { id: 11, name: "skldd", slug: "skldd", created_at: "2026-04-09T04:40:48.162Z", ody_menu_hidden: false, logo_url: null, cover_url: null, cover_original_url: null },
  { id: 12, name: "123456", slug: "123456", created_at: "2026-04-09T04:42:10.690Z", ody_menu_hidden: false, logo_url: null, cover_url: null, cover_original_url: null },
  { id: 13, name: "I", slug: "i", created_at: "2026-04-17T17:37:24.583Z", ody_menu_hidden: false, logo_url: null, cover_url: null, cover_original_url: null },
];

const owners = [
  { id: 1, hotel_id: 2, gmail: "u@gmail.com", password_hash: "$2b$10$P3p..MvaJPqKIBmuqkxv/ud.A8YT/Os3xB3tqOHt.q9o2U6BSWsgi", created_at: "2026-04-01T09:39:48.778Z", mobile: null, signup_method: "mobile" },
  { id: 2, hotel_id: 3, gmail: "harsith@gmail.com", password_hash: "$2b$10$tg6Ryq730GnyDaXJUJq6nOejys1dLa88hgGeG6jXRbyrShm7K8ls.", created_at: "2026-04-01T09:51:50.370Z", mobile: null, signup_method: "mobile" },
  { id: 7, hotel_id: 8, gmail: null, password_hash: "$2b$10$ItQayv6LiqZkXLZfT7empeKZpIE8BsesOaT4sXE7z5yt/cJz6IiQq", created_at: "2026-04-02T04:48:23.539Z", mobile: "1234567890", signup_method: "mobile" },
  { id: 8, hotel_id: 9, gmail: null, password_hash: "$2b$10$lwKUgBBfgifvucqNjr6Ap.cjXMfWCKuIPDpeVPsVZL1DhHehzsVBe", created_at: "2026-04-02T07:21:25.777Z", mobile: "7890123456", signup_method: "mobile" },
  { id: 9, hotel_id: 10, gmail: null, password_hash: "$2b$10$72/G/veRmlWknSN3kR7Vpuv5gSIsKdeaN/6pUtlmlPKGztab2BwJ2", created_at: "2026-04-03T18:19:03.771Z", mobile: "1234568900", signup_method: "mobile" },
  { id: 10, hotel_id: 12, gmail: null, password_hash: "$2b$10$2W5N5JNHSqeBR2I/4arZu.ST/X3YUQEl56B8b6r.Hl7dsdW8kpywy", created_at: "2026-04-09T04:42:19.763Z", mobile: "1234567894", signup_method: "mobile" },
  { id: 11, hotel_id: 13, gmail: null, password_hash: "$2a$10$.Yz4gi92Gi3pviOUPAYqbuh9QMTurR8aThIH.Px9bn.krxj2E46OG", created_at: "2026-04-17T17:37:47.556Z", mobile: "1234566666", signup_method: "mobile" },
];

const categories = [
  { id: 1, hotel_id: 10, name: "Starters", display_order: 0, created_at: "2026-05-25T18:21:26.526Z" },
  { id: 2, hotel_id: 10, name: "Category - 2", display_order: 0, created_at: "2026-05-27T19:19:31.389Z" },
];

const dishes = [
  { id: 1, hotel_id: 9, name: "Veg Rice", price: 200, category: "food_item", is_veg: true, is_active: true, created_at: "2026-04-03T03:07:14.932Z", quantity: "250g", description: "Thai style Vegetable Fried rice with special Thai sauce.", timing_from: "09:00", timing_to: "22:00", video_url: "https://www.youtube.com/watch?v=s2OccJMWwkM", hidden_at: null, favorite_count: 0, eat_later_count: 0, menu_category_id: null, tags: [], photo_url: null },
  { id: 3, hotel_id: 10, name: "Veg Rice", price: 200, category: "food_item", is_veg: true, is_active: false, created_at: "2026-04-05T07:59:34.266Z", quantity: "250g", description: "Thai style Hot and Spicy Veg Fried Rice.", timing_from: "09:00", timing_to: "22:00", video_url: "https://www.youtube.com/watch?v=8tnQYBs4ZpY", hidden_at: null, favorite_count: 0, eat_later_count: 0, menu_category_id: null, tags: [], photo_url: null },
  { id: 6, hotel_id: 10, name: "Chicken Rice", price: 250, category: "food_item", is_veg: false, is_active: true, created_at: "2026-04-05T15:38:50.483Z", quantity: "250g", description: "Hot and Spicy, Thai Chicken fried rice", timing_from: "09:00", timing_to: "23:30", video_url: "https://www.youtube.com/watch?v=bJa3-9DsE8E", hidden_at: null, favorite_count: 2, eat_later_count: 1, menu_category_id: null, tags: [], photo_url: null },
  { id: 7, hotel_id: 10, name: "Chicken Noodles", price: 250, category: "food_item", is_veg: false, is_active: true, created_at: "2026-04-05T15:55:50.337Z", quantity: "250g", description: null, timing_from: "16:00", timing_to: "22:00", video_url: "https://www.youtube.com/watch?v=bJa3-9DsE8E", hidden_at: null, favorite_count: 0, eat_later_count: 0, menu_category_id: null, tags: [], photo_url: null },
  { id: 8, hotel_id: 10, name: "Chicken Biriyani", price: 300, category: "food_item", is_veg: false, is_active: true, created_at: "2026-04-06T19:53:40.375Z", quantity: "250g", description: "Ambur style authentic Chicken Biriyani.", timing_from: "09:00", timing_to: "09:00", video_url: "https://www.youtube.com/watch?v=bJa3-9DsE8E", hidden_at: null, favorite_count: 3, eat_later_count: 1, menu_category_id: null, tags: [], photo_url: null },
  { id: 11, hotel_id: 10, name: "mm", price: 666, category: "food_item", is_veg: true, is_active: true, created_at: "2026-05-26T19:28:38.304Z", quantity: "77g", description: "jjjjjjjjjjjjjjjjj", timing_from: "09:00", timing_to: "03:00", video_url: null, hidden_at: null, favorite_count: 1, eat_later_count: 1, menu_category_id: 1, tags: ["Must Try", "chumma"], photo_url: null },
];

const ratings = [
  { id: 2, dish_id: 8, stars: 1, low_rating_reason: "Taste", created_at: "2026-04-09T18:07:29.167Z", hotel_id: 10, comment: null, visitor_name: "Harsith" },
  { id: 3, dish_id: 8, stars: 5, low_rating_reason: null, created_at: "2026-04-09T18:16:52.473Z", hotel_id: 10, comment: null, visitor_name: "Harsith" },
  { id: 4, dish_id: 8, stars: 5, low_rating_reason: null, created_at: "2026-04-10T03:20:13.330Z", hotel_id: 10, comment: null, visitor_name: "Hh" },
  { id: 6, dish_id: 6, stars: 5, low_rating_reason: null, created_at: "2026-04-10T15:20:14.795Z", hotel_id: 10, comment: null, visitor_name: "Harsith" },
  { id: 8, dish_id: 6, stars: 4, low_rating_reason: null, created_at: "2026-04-13T04:17:34.834Z", hotel_id: 10, comment: null, visitor_name: "Hh" },
  { id: 10, dish_id: 11, stars: 4, low_rating_reason: null, created_at: "2026-05-27T06:34:46.933Z", hotel_id: 10, comment: null, visitor_name: "jojo" },
];

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seedCollection(name, items) {
  console.log(`\nSeeding ${name} (${items.length} items)...`);
  let maxId = 0;
  for (const item of items) {
    const { id, ...rest } = item;
    await db.collection(name).doc(String(id)).set(rest);
    if (id > maxId) maxId = id;
    process.stdout.write(".");
  }
  // Set counter so new inserts don't conflict
  await db.collection("_counters").doc(name).set({ value: maxId });
  console.log(`\n✓ ${name} done — counter set to ${maxId}`);
}

async function main() {
  console.log("🔥 Starting Firestore seed...");
  await seedCollection("hotels", hotels);
  await seedCollection("owners", owners);
  await seedCollection("categories", categories);
  await seedCollection("dishes", dishes);
  await seedCollection("ratings", ratings);
  console.log("\n✅ Seed complete! All data imported into Firestore.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
