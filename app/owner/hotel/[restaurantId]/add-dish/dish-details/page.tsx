"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "@/components/ProgressBar";

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

export default function DishDetailsPage() {
  const router = useRouter();

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
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Eg: ₹180"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-black
                       placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A84C1]"
          />
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

        {/* ---------- BOTTOM BAR ---------- */}
        <div className="absolute bottom-0 left-0 w-full border-t bg-white px-6 py-4">
          <div className="flex items-center justify-between gap-4">

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="px-6 py-2 rounded-md border border-gray-300
                           text-sm text-gray-700"
              >
                Back
              </button>

              <button
                disabled={!canProceed}
                onClick={() => router.push("../create")}
                className={`px-6 py-2 rounded-md text-sm font-medium
                  ${
                    canProceed
                      ? "bg-[#0A84C1] text-white"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
              >
                Add Dish
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
