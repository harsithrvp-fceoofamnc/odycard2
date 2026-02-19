"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import ProgressBar from "@/components/ProgressBar";
import { API_BASE } from "@/lib/api";

/* ---------- TIME OPTIONS (30 MIN GAP) ---------- */
const generateTimeOptions = () => {
  const times: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hh = h.toString().padStart(2, "0");
      const mm = m.toString().padStart(2, "0");
      times.push(`${hh}:${mm}`);
    }
  }
  return times;
};

const TIME_OPTIONS = generateTimeOptions();

const ADD_DISH_PHOTO_KEY = "addDishPhoto";
const ADD_DISH_VIDEO_ID_KEY = "addDishVideoId";
const ADD_DISH_TYPE_KEY = "addDishType";

export default function DishDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const restaurantId = params?.restaurantId as string | undefined;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [restaurantIdError, setRestaurantIdError] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurantId || typeof restaurantId !== "string") {
      setRestaurantIdError("Restaurant ID is missing. Please go back and try again.");
    } else {
      setRestaurantIdError(null);
    }
  }, [restaurantId]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // later this should come from selected dish type
  const isDrink = false;

  const [name, setName] = useState("");
  const [vegType, setVegType] = useState<"veg" | "nonveg" | null>(null);
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");

  // NEW: dish timing (from / to)
  const [fromTime, setFromTime] = useState("09:00");
  const [toTime, setToTime] = useState("22:00");

  /* ---------- VALIDATION ---------- */
  const canProceed =
    name.trim() !== "" &&
    price.trim() !== "" &&
    (isDrink || vegType !== null);

  /* ---------- PROGRESS ---------- */
  const TOTAL_PAGES = 3;
  const CURRENT_PAGE = 3;
  const BASE_PROGRESS = 66;
  const FINAL_PROGRESS = 100;

  const computedProgress = useMemo(() => {
    return canProceed ? FINAL_PROGRESS : BASE_PROGRESS;
  }, [canProceed]);

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-white px-6 pt-10 pb-28 relative">

        {/* HEADER */}
        <h1
          className="text-black mb-10"
          style={{ fontSize: 36, fontWeight: 600, lineHeight: "1.1" }}
        >
          Dish Details
        </h1>

        {/* DISH NAME */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dish Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Eg: Paneer Butter Masala"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-black
                       placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A84C1]"
          />
        </div>

        {/* VEG / NON-VEG */}
        {!isDrink && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Veg / Non-Veg *
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setVegType("veg")}
                className={`flex-1 rounded-xl py-3 border text-sm font-medium
                  flex items-center justify-center gap-2
                  ${
                    vegType === "veg"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-300 text-gray-600"
                  }`}
              >
                <img src="/veg.png" alt="Veg" className="w-4 h-4" />
                Veg
              </button>

              <button
                onClick={() => setVegType("nonveg")}
                className={`flex-1 rounded-xl py-3 border text-sm font-medium
                  flex items-center justify-center gap-2
                  ${
                    vegType === "nonveg"
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-gray-300 text-gray-600"
                  }`}
              >
                <img src="/non_veg.png" alt="Non Veg" className="w-4 h-4" />
                Non-Veg
              </button>
            </div>
          </div>
        )}

        {/* PRICE */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price (₹) *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-600">₹</span>
            <input
              type="text"
              value={price}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setPrice(value);
              }}
              placeholder=""
              className="w-full border border-gray-300 rounded-xl pl-8 pr-4 py-3 text-sm text-black
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A84C1]"
              style={{
                WebkitAppearance: "none",
                MozAppearance: "textfield",
              }}
            />
          </div>
        </div>

        {/* QUANTITY */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity
          </label>
          <input
            type="text"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Eg: Full / 250ml / 2 pcs"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-black
                       placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A84C1]"
          />
        </div>

        {/* DESCRIPTION */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description about the dish"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-black
                       placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#0A84C1]"
          />
        </div>

        {/* DISH TIMING — FROM / TO (30 MIN GAP) */}
        <div className="mb-12">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dish Timing
          </label>

          <div className="flex gap-3">
            {/* FROM */}
            <div className="relative flex-1">
              <select
                value={fromTime}
                onChange={(e) => setFromTime(e.target.value)}
                className="w-full appearance-none border border-gray-300 rounded-xl
                           px-4 py-3 pr-10 text-sm text-black
                           focus:outline-none focus:ring-2 focus:ring-[#0A84C1]"
              >
                {TIME_OPTIONS.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>

              <svg
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2
                           h-4 w-4 text-gray-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            {/* TO */}
            <div className="relative flex-1">
              <select
                value={toTime}
                onChange={(e) => setToTime(e.target.value)}
                className="w-full appearance-none border border-gray-300 rounded-xl
                           px-4 py-3 pr-10 text-sm text-black
                           focus:outline-none focus:ring-2 focus:ring-[#0A84C1]"
              >
                {TIME_OPTIONS.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>

              <svg
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2
                           h-4 w-4 text-gray-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        {(restaurantIdError || submitError) && (
          <p className="mb-4 text-sm text-red-600">
            {restaurantIdError || submitError}
          </p>
        )}

        {/* ---------- BOTTOM BAR ---------- */}
        <div className="absolute bottom-0 left-0 w-full border-t bg-white px-6 py-4">
          <div className="flex items-center justify-between gap-4">

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 rounded-md border border-gray-300
                           text-sm text-gray-700"
              >
                Back
              </button>

              <button
                type="button"
                disabled={!canProceed || isSubmitting || !restaurantId}
                onClick={async () => {
                  if (!canProceed) return;
                  if (!restaurantId) {
                    setRestaurantIdError("Restaurant ID is missing. Please go back and try again.");
                    return;
                  }

                  setSubmitError(null);
                  setIsSubmitting(true);

                  try {
                    // Resolve hotel_id from slug (multi-tenant: URL is source of truth)
                    const hotelRes = await fetch(
                      `${API_BASE}/api/hotels/${encodeURIComponent(restaurantId)}`
                    );
                    if (!hotelRes.ok) {
                      throw new Error("Hotel not found");
                    }
                    const hotel = await hotelRes.json();

                    const photoUrl =
                      typeof window !== "undefined"
                        ? localStorage.getItem(ADD_DISH_PHOTO_KEY) || "/food_item_logo.png"
                        : "/food_item_logo.png";
                    const videoId =
                      typeof window !== "undefined"
                        ? localStorage.getItem(ADD_DISH_VIDEO_ID_KEY)
                        : null;
                    const category =
                      typeof window !== "undefined"
                        ? localStorage.getItem(ADD_DISH_TYPE_KEY) || "food_item"
                        : "food_item";

                    const postRes = await fetch(`${API_BASE}/api/dishes`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        hotel_id: hotel.id,
                        name: name.trim(),
                        price: parseFloat(price.trim()) || 0,
                        category,
                        is_veg: vegType === "veg",
                        quantity: quantity.trim() || null,
                        description: description.trim() || null,
                        timing_from: fromTime,
                        timing_to: toTime,
                        photo_url: photoUrl.startsWith("data:") ? photoUrl : null,
                        video_url: videoId
                          ? `https://www.youtube.com/watch?v=${videoId}`
                          : null,
                      }),
                    });

                    if (!postRes.ok) {
                      const data = await postRes.json().catch(() => ({}));
                      throw new Error(data.error || "Failed to add dish");
                    }

                    localStorage.removeItem(ADD_DISH_PHOTO_KEY);
                    localStorage.removeItem(ADD_DISH_VIDEO_ID_KEY);
                    localStorage.removeItem(ADD_DISH_TYPE_KEY);

                    const target = `/owner/hotel/${restaurantId}/edit-menu`;
                    console.log("[DishDetails] Navigating to:", target);
                    router.push(target);
                  } catch (err) {
                    setSubmitError(
                      err instanceof Error ? err.message : "Failed to add dish"
                    );
                    setIsSubmitting(false);
                  }
                }}
                className={`px-6 py-2 rounded-md text-sm font-medium disabled:opacity-70
                  ${
                    canProceed && !isSubmitting
                      ? "bg-[#0A84C1] text-white"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
              >
                {isSubmitting ? "Adding..." : "Add"}
              </button>
            </div>

            <div className="flex items-center gap-3 min-w-[140px]">
              <span className="text-xs text-gray-500 whitespace-nowrap">
                Page {CURRENT_PAGE} of {TOTAL_PAGES}
              </span>
              <ProgressBar
                progress={computedProgress}
                className="flex-1 h-[4px]"
              />
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
