"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";
import { useLoader } from "@/context/LoaderContext";

export default function OwnerDashboard() {
  const router = useRouter();
  const { hideLoader } = useLoader();

  const [userName, setUserName] = useState("");
  const [restaurantLogo, setRestaurantLogo] = useState("");
  const [restaurantCover, setRestaurantCover] = useState("");
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showLogoSheet, setShowLogoSheet] = useState(false);
  const [showCoverSheet, setShowCoverSheet] = useState(false);

  const [stats, setStats] = useState({
    total_dishes: 0,
    videos_uploaded: 0,
    avg_rating: "—",
    total_ratings: 0,
  });

  // Hide global loader when dashboard mounts
  useEffect(() => {
    hideLoader();
  }, [hideLoader]);

  // Load hotel data
  useEffect(() => {
    const slug = localStorage.getItem("restaurantId");
    if (!slug) {
      setLoadError("No restaurant found. Please complete signup.");
      return;
    }

    let cancelled = false;

    async function loadHotel() {
      try {
        const res = await fetch(`${API_BASE}/api/hotels/${encodeURIComponent(slug!)}`);
        if (!res.ok) {
          setLoadError(res.status === 404
            ? "Hotel not found. Please complete signup."
            : "Failed to load dashboard."
          );
          return;
        }
        const hotel = await res.json();
        if (cancelled) return;

        setRestaurantId(hotel.slug);
        setHotelId(String(hotel.id));
        setRestaurantLogo(hotel.logo_url || "");
        setRestaurantCover(hotel.cover_url || "");
        setLoadError(null);

        // load stats using numeric hotel id
        const statsRes = await fetch(`${API_BASE}/api/stats/${hotel.id}`);
        if (statsRes.ok) {
          const s = await statsRes.json();
          if (!cancelled) {
            setStats({
              total_dishes: s.total_dishes ?? 0,
              videos_uploaded: s.videos_uploaded ?? 0,
              avg_rating: s.avg_rating && s.avg_rating > 0 ? String(s.avg_rating) : "—",
              total_ratings: s.total_ratings ?? 0,
            });
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Dashboard load error:", err);
          setLoadError("Failed to load dashboard.");
        }
      }
    }

    loadHotel();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setUserName(localStorage.getItem("userName") || "Owner");
  }, []);

  const card = "border border-gray-200 rounded-2xl p-4 bg-white";

  if (loadError) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-white/80 text-center">{loadError}</p>
        <button
          onClick={() => router.push("/owner/details")}
          className="px-6 py-2 rounded-full bg-[#0A84C1] text-white"
        >
          Complete signup
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="relative w-full max-w-md min-h-screen overflow-hidden bg-[#1c1c1c]">

        {/* COVER + LOGO FIXED SECTION */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-[50vh] z-10 overflow-hidden">

          {/* COVER */}
          {restaurantCover ? (
            <>
              <img src={restaurantCover} alt="Cover" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30" />
            </>
          ) : (
            <div className="w-full h-full bg-[#1c1c1c]" />
          )}

          {/* COVER EDIT BUTTON */}
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={() => setShowCoverSheet(true)}
              className="px-4 py-2 rounded-full bg-black/60 backdrop-blur-md text-white text-sm shadow-lg"
            >
              {restaurantCover ? "Edit Cover" : "Add Cover"}
            </button>
          </div>

          {/* LOGO */}
          <div className="absolute inset-0 flex flex-col items-center justify-center -translate-y-6 gap-4">
            {restaurantLogo ? (
              <div className="w-44 h-44 rounded-full overflow-hidden shadow-[0_35px_70px_rgba(0,0,0,0.85)]">
                <img src={restaurantLogo} alt="Restaurant Logo" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-44 h-44 rounded-full bg-black/30 flex items-center justify-center">
                <span className="text-white/60 text-sm">No Logo</span>
              </div>
            )}
            <button
              onClick={() => setShowLogoSheet(true)}
              className="px-5 py-2 rounded-full bg-black/60 backdrop-blur-md text-white text-sm shadow-lg"
            >
              {restaurantLogo ? "Edit Logo" : "Add Logo"}
            </button>
          </div>
        </div>

        {/* SPACE FOR FIXED AREA */}
        <div className="h-[47vh]" />

        {/* MAIN CONTENT */}
        <motion.div
          className="relative z-20 bg-white rounded-t-[36px] px-6 pt-10 pb-36 min-h-screen -mt-10"
          initial={{ y: 140, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.6, ease: "easeOut" }}
        >
          <div className="mb-10">
            <p className="text-gray-500 text-[18px] mb-1">Welcome,</p>
            <h1 className="text-black text-[36px] font-semibold">{userName}</h1>
          </div>

          {/* STATS GRID */}
          <div className="grid grid-cols-2 gap-4 mb-12">

            <div
              className={`${card} cursor-pointer hover:shadow-md transition`}
              onClick={() => {
                const slug = restaurantId || localStorage.getItem("restaurantId");
                if (!slug) { alert("Restaurant not found"); return; }
                router.push(`/owner/hotel/${slug}/edit-menu`);
              }}
            >
              <div className="flex items-center justify-center gap-3 h-full py-1">
                <img src="/add.png" className="w-7 h-7" alt="" />
                <p className="text-black text-[16px] font-semibold">Edit Menu</p>
              </div>
            </div>

            <div className={card}>
              <p className="text-gray-500 text-sm">Avg Rating</p>
              <p className="text-black text-[22px] font-semibold">
                {stats.avg_rating !== "—" ? `⭐ ${stats.avg_rating}` : "—"}
              </p>
              {stats.total_ratings > 0 && (
                <p className="text-gray-400 text-xs mt-1">{stats.total_ratings} reviews</p>
              )}
            </div>

            <div
              className={`${card} cursor-pointer hover:shadow-md transition`}
              onClick={() => router.push("/owner/qr")}
            >
              <div className="flex items-center justify-center gap-3 h-full py-1">
                <img src="/qr.png" className="w-7 h-7" alt="" />
                <p className="text-black text-[16px] font-semibold">View QR</p>
              </div>
            </div>

            <div className={card}>
              <p className="text-gray-500 text-sm">Videos Uploaded</p>
              <p className="text-black text-[22px] font-semibold">{stats.videos_uploaded}</p>
            </div>

            <div className={card}>
              <p className="text-gray-500 text-sm">Total Items</p>
              <p className="text-black text-[22px] font-semibold">{stats.total_dishes}</p>
            </div>

            <div
              className={`${card} cursor-pointer hover:shadow-md transition`}
              onClick={() => router.push("/owner/details")}
            >
              <div className="flex items-center justify-center gap-3 h-full py-1">
                <img src="/User.png" className="w-7 h-7" alt="" />
                <p className="text-black text-[16px] font-semibold">Profile</p>
              </div>
            </div>

          </div>

          {/* RATINGS BREAKDOWN */}
          {stats.total_ratings > 0 && (
            <div className="mb-12">
              <h2 className="text-black text-xl font-semibold mb-4">Rating Breakdown</h2>
              <div
                className="border border-gray-200 rounded-2xl p-4 cursor-pointer hover:shadow-md transition"
                onClick={() => {
                  const id = hotelId || localStorage.getItem("ody_hotel_id");
                  router.push(`/owner/ratings?hotel_id=${id}`);
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl font-bold text-black">{stats.avg_rating}</span>
                  <div>
                    <p className="text-yellow-400 text-lg">{"★".repeat(Math.round(Number(stats.avg_rating)))}</p>
                    <p className="text-gray-400 text-sm">{stats.total_ratings} total reviews</p>
                  </div>
                </div>
                <p className="text-[#0A84C1] text-sm font-medium">View all reviews →</p>
              </div>
            </div>
          )}

          {/* LEADERBOARD */}
          <div className="mb-12">
            <h2 className="text-black text-xl font-semibold mb-4">Leaderboard</h2>
            <div className="border border-dashed border-gray-300 rounded-2xl p-6 text-center text-gray-500">
              {stats.total_ratings === 0
                ? "No data yet. Start getting reviews."
                : "Top-rated dishes will appear here soon."}
            </div>
          </div>

          {/* HIGHLIGHTS */}
          <div className="mb-12">
            <h2 className="text-black text-xl font-semibold mb-4">Highlights</h2>
            <div className="border border-dashed border-gray-300 rounded-2xl p-6 text-center text-gray-500">
              Best-performing dishes will appear here.
            </div>
          </div>

          {/* TO IMPROVE */}
          <div>
            <h2 className="text-black text-xl font-semibold mb-4">To Improve</h2>
            <div className="border border-dashed border-gray-300 rounded-2xl p-6 text-center text-gray-500">
              AI suggestions will appear here.
            </div>
          </div>
        </motion.div>

        {/* ASK ODY */}
        <div className="fixed bottom-6 right-[calc(50%-200px+16px)] z-50">
          <button className="flex items-center gap-3 bg-black/70 backdrop-blur-md text-white px-4 py-3 rounded-full shadow-lg border border-white/10">
            <img src="/ody-face.png" className="w-8 h-8 rounded-full" alt="" />
            <span className="text-sm font-medium">Ask Ody</span>
          </button>
        </div>

        {/* LOGO SHEET */}
        {showLogoSheet && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-end">
            <div className="w-full max-w-md mx-auto bg-white rounded-t-3xl p-6">
              <p className="text-center text-gray-700 mb-6 text-lg font-medium">Change restaurant logo?</p>
              <button
                onClick={() => { setShowLogoSheet(false); router.push("/owner/edit-logo"); }}
                className="w-full py-3 rounded-xl bg-[#0A84C1] text-white font-semibold mb-3"
              >
                Edit Logo
              </button>
              <button
                onClick={() => setShowLogoSheet(false)}
                className="w-full py-3 rounded-xl bg-gray-100 text-black font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* COVER SHEET */}
        {showCoverSheet && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-end">
            <div className="w-full max-w-md mx-auto bg-white rounded-t-3xl p-6">
              <p className="text-center text-gray-700 mb-6 text-lg font-medium">
                {restaurantCover ? "Change cover photo?" : "Add a cover photo?"}
              </p>
              <button
                onClick={() => { setShowCoverSheet(false); router.push("/owner/edit-cover"); }}
                className="w-full py-3 rounded-xl bg-[#0A84C1] text-white font-semibold mb-3"
              >
                {restaurantCover ? "Edit Cover Photo" : "Add Cover Photo"}
              </button>
              <button
                onClick={() => setShowCoverSheet(false)}
                className="w-full py-3 rounded-xl bg-gray-100 text-black font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
