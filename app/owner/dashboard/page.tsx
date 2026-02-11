"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

export default function OwnerDashboard() {
  const router = useRouter();

  const [userName, setUserName] = useState("");
  const [restaurantLogo, setRestaurantLogo] = useState("");
  const [restaurantCover, setRestaurantCover] = useState("");
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showLogoSheet, setShowLogoSheet] = useState(false);
  const [showCoverSheet, setShowCoverSheet] = useState(false);

  // Load owner's hotel from API (multi-tenant: no localStorage fallbacks)
  useEffect(() => {
    const slug = localStorage.getItem("restaurantId");
    if (!slug) {
      setLoadError("No restaurant found. Please complete signup.");
      setIsLoading(false);
      return;
    }

    const slugVal = slug;
    let cancelled = false;

    async function loadHotel() {
      try {
        const res = await fetch(
          `${API_BASE}/api/hotels/${encodeURIComponent(slugVal)}`
        );
        if (!res.ok) {
          if (res.status === 404) {
            setLoadError("Hotel not found. Please complete signup.");
          } else {
            setLoadError("Failed to load dashboard.");
          }
          return;
        }
        const hotel = await res.json();
        if (cancelled) return;

        setRestaurantId(hotel.slug);
        setRestaurantLogo(hotel.logo_url && hotel.logo_url !== "null" ? hotel.logo_url : "");
        setRestaurantCover(hotel.cover_url && hotel.cover_url !== "null" ? hotel.cover_url : "");
        setLoadError(null);
      } catch (err) {
        if (!cancelled) {
          console.error("Dashboard load error:", err);
          setLoadError("Failed to load dashboard.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadHotel();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setUserName(localStorage.getItem("userName") || "Owner");
  }, []);

  const card = "border border-gray-200 rounded-2xl p-4 bg-white";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/80">Loading dashboard...</p>
      </div>
    );
  }

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

        {/* 🔥 COVER + LOGO FIXED SECTION */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-[50vh] z-10 overflow-hidden">

          {/* COVER */}
          {restaurantCover ? (
            <>
              <img
                src={restaurantCover}
                alt="Cover"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30" />
            </>
          ) : (
            <div className="w-full h-full bg-[#1c1c1c]" />
          )}

          {/* ✅ FIX 1: COVER TOGGLE ALWAYS VISIBLE */}
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={() => setShowCoverSheet(true)}
              className="px-4 py-2 rounded-full bg-black/60 backdrop-blur-md text-white text-sm shadow-lg"
            >
              {restaurantCover ? "Edit Cover" : "Add Cover"}
            </button>
          </div>

          {/* LOGO + LOGO TOGGLE */}
          <div className="absolute inset-0 flex flex-col items-center justify-center -translate-y-6 gap-4">

            {restaurantLogo ? (
              <div className="w-44 h-44 rounded-full overflow-hidden shadow-[0_35px_70px_rgba(0,0,0,0.85)]">
                <img
                  src={restaurantLogo}
                  alt="Restaurant Logo"
                  className="w-full h-full object-cover"
                />
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
            <h1 className="text-black text-[36px] font-semibold">
              {userName}
            </h1>
          </div>

          {/* GRID */}
          <div className="grid grid-cols-2 gap-4 mb-12">

            <div
              className={`${card} cursor-pointer hover:shadow-md transition`}
              onClick={() => {
                const slug = restaurantId || localStorage.getItem("restaurantId");
                if (!slug) {
                  alert("Restaurant not found");
                  return;
                }
                router.push(`/owner/hotel/${slug}/edit-menu`);
              }}
            >
              <div className="flex items-center justify-center gap-3 h-full">
                <img src="/add.png" className="w-7 h-7" />
                <p className="text-black text-[16px] font-semibold">
                  Edit Menu
                </p>
              </div>
            </div>

            <div className={card}>
              <p className="text-gray-500 text-sm">Avg Rating</p>
              <p className="text-black text-[22px] font-semibold">—</p>
            </div>

            <div
              className={`${card} cursor-pointer hover:shadow-md transition`}
              onClick={() => router.push("/owner/qr")}
            >
              <div className="flex items-center justify-center gap-3 h-full">
                <img src="/qr.png" className="w-7 h-7" />
                <p className="text-black text-[16px] font-semibold">
                  View QR
                </p>
              </div>
            </div>

            <div className={card}>
              <p className="text-gray-500 text-sm">Videos Uploaded</p>
              <p className="text-black text-[22px] font-semibold">0</p>
            </div>

            <div className={card}>
              <p className="text-gray-500 text-sm">Total Items</p>
              <p className="text-black text-[22px] font-semibold">0</p>
            </div>

            <div className={card}>
              <div className="flex items-center justify-center gap-3 h-full">
                <img src="/User.png" className="w-7 h-7" />
                <p className="text-black text-[16px] font-semibold">
                  User Details
                </p>
              </div>
            </div>

          </div>

          {/* LEADERBOARD */}
          <div className="mb-12">
            <h2 className="text-black text-xl font-semibold mb-4">
              Leaderboard
            </h2>
            <div className="border border-dashed border-gray-300 rounded-2xl p-6 text-center text-gray-500">
              No data yet. Start getting reviews.
            </div>
          </div>

          {/* HIGHLIGHTS */}
          <div className="mb-12">
            <h2 className="text-black text-xl font-semibold mb-4">
              Highlights
            </h2>
            <div className="border border-dashed border-gray-300 rounded-2xl p-6 text-center text-gray-500">
              Best-performing dishes will appear here.
            </div>
          </div>

          {/* TO IMPROVE */}
          <div>
            <h2 className="text-black text-xl font-semibold mb-4">
              To Improve
            </h2>
            <div className="border border-dashed border-gray-300 rounded-2xl p-6 text-center text-gray-500">
              AI suggestions will appear here.
            </div>
          </div>
        </motion.div>

        {/* ASK ODY */}
        <div className="fixed bottom-6 right-[calc(50%-200px+16px)] z-50">
          <button className="flex items-center gap-3 bg-black/70 backdrop-blur-md text-white px-4 py-3 rounded-full shadow-lg border border-white/10">
            <img src="/ody-face.png" className="w-8 h-8 rounded-full" />
            <span className="text-sm font-medium">Ask Ody</span>
          </button>
        </div>

        {/* LOGO SHEET */}
        {showLogoSheet && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-end">
            <div className="w-full max-w-md mx-auto bg-white rounded-t-3xl p-6">
              <p className="text-center text-gray-700 mb-6 text-lg font-medium">
                Change restaurant logo?
              </p>

              <button
                onClick={() => {
                  setShowLogoSheet(false);
                  router.push("/owner/edit-logo");
                }}
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
                {restaurantCover
                  ? "Change cover photo?"
                  : "Add a cover photo?"}
              </p>

              <button
                onClick={() => {
                  setShowCoverSheet(false);
                  router.push("/owner/edit-cover");
                }}
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
