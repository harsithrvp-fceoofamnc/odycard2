"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ProgressBar from "@/components/ProgressBar";
import { API_BASE } from "@/lib/api";

const PREDEFINED_TAGS = [
  "Must Try",
  "Best Selling",
  "New Arrival",
  "Kid's Favorite",
  "Couple's Favorite",
  "Chef's Special",
  "High-on-Protein",
  "Hot & Spicy",
];

const MAX_TAGS = 2;
const CUSTOM_MAX_CHARS = 14;

// All localStorage keys used across the add-dish flow
const ALL_DISH_KEYS = [
  "addDishPhoto",
  "addDishVideoId",
  "addDishType",
  "addDishMenuCategoryId",
  "addDishTags",
  "addDishName",
  "addDishPrice",
  "addDishIsVeg",
  "addDishQuantity",
  "addDishDescription",
  "addDishTimingFrom",
  "addDishTimingTo",
];

export default function DishTagsPage() {
  const router = useRouter();
  const params = useParams();
  const restaurantId = params?.restaurantId as string;

  const [selected, setSelected] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [customAdded, setCustomAdded] = useState<string | null>(null);
  const [customError, setCustomError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingMode, setSubmittingMode] = useState<"skip" | "add" | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const totalSelected = selected.length + (customAdded ? 1 : 0);
  const canAddMore = totalSelected < MAX_TAGS;

  const toggleTag = (tag: string) => {
    if (selected.includes(tag)) {
      setSelected(selected.filter((t) => t !== tag));
    } else {
      if (!canAddMore) return;
      setSelected([...selected, tag]);
    }
  };

  const addCustomTag = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (trimmed.length > CUSTOM_MAX_CHARS) {
      setCustomError(`Max ${CUSTOM_MAX_CHARS} characters`);
      return;
    }
    if (!canAddMore) {
      setCustomError(`Max ${MAX_TAGS} tags allowed`);
      return;
    }
    setCustomAdded(trimmed);
    setCustomInput("");
    setCustomError("");
  };

  const removeCustom = () => {
    setCustomAdded(null);
    setCustomError("");
  };

  const fetchWithRetry = async (url: string, options?: RequestInit, maxAttempts = 4): Promise<Response> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const res = await fetch(url, options);
      if (res.status >= 500 && attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 6000));
        continue;
      }
      return res;
    }
    throw new Error("Server unreachable");
  };

  const proceed = async (skip = false) => {
    if (!restaurantId) return;
    setSubmitError(null);
    setIsSubmitting(true);
    setSubmittingMode(skip ? "skip" : "add");

    try {
      // Build tags list (empty if skipping)
      const dishTags = skip ? [] : [...selected, ...(customAdded ? [customAdded] : [])];

      // Read all dish data saved by previous steps
      const rawPhoto = localStorage.getItem("addDishPhoto") || "";
      const videoId = localStorage.getItem("addDishVideoId");
      const category = localStorage.getItem("addDishType") || "food_item";
      const menuCategoryId = localStorage.getItem("addDishMenuCategoryId");
      const dishName = localStorage.getItem("addDishName") || "";
      const dishPrice = localStorage.getItem("addDishPrice") || "0";
      const dishIsVeg = localStorage.getItem("addDishIsVeg") !== "nonveg";
      const dishQuantity = localStorage.getItem("addDishQuantity") || "";
      const dishDescription = localStorage.getItem("addDishDescription") || "";
      const dishTimingFrom = localStorage.getItem("addDishTimingFrom") || "09:00";
      const dishTimingTo = localStorage.getItem("addDishTimingTo") || "22:00";

      // Resolve hotel from slug
      const hotelRes = await fetchWithRetry(
        `${API_BASE}/api/hotels/${encodeURIComponent(restaurantId)}`
      );
      if (!hotelRes.ok) throw new Error("Hotel not found");
      const hotel = await hotelRes.json();

      // Only send photo if it's a base64 data URL AND under 800KB
      const MAX_PHOTO_BYTES = 800 * 1024;
      const photoUrl =
        rawPhoto.startsWith("data:") && rawPhoto.length <= MAX_PHOTO_BYTES
          ? rawPhoto
          : null;

      const postRes = await fetchWithRetry(`${API_BASE}/api/dishes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotel_id: hotel.id,
          name: dishName,
          price: parseFloat(dishPrice) || 0,
          category,
          is_veg: dishIsVeg,
          quantity: dishQuantity || null,
          description: dishDescription || null,
          timing_from: dishTimingFrom,
          timing_to: dishTimingTo,
          photo_url: photoUrl,
          video_url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : null,
          menu_category_id: menuCategoryId ? parseInt(menuCategoryId) : null,
          tags: dishTags.length > 0 ? dishTags : null,
        }),
      });

      if (!postRes.ok) {
        const data = await postRes.json().catch(() => ({}));
        throw new Error(data.error || `Failed to add dish (HTTP ${postRes.status})`);
      }

      // Clear all localStorage keys used across the flow
      ALL_DISH_KEYS.forEach((k) => localStorage.removeItem(k));

      // Navigate back to Menu tab
      router.push(`/owner/hotel/${restaurantId}/edit-menu?tab=1`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to add dish");
      setIsSubmitting(false);
    }
  };

  const progress = totalSelected > 0 ? 100 : 75;

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-white px-6 pt-10 pb-28 relative">

        {/* HEADER */}
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-black" style={{ fontSize: 36, fontWeight: 600, lineHeight: "1.1" }}>
            Add Tags
          </h1>
          <button
            type="button"
            onClick={() => proceed(true)}
            disabled={isSubmitting}
            className="mt-2 text-sm font-medium text-gray-400 underline underline-offset-2 disabled:opacity-50"
          >
            {isSubmitting && submittingMode === "skip" ? "Skipping..." : "Skip"}
          </button>
        </div>
        <p className="text-gray-400 text-sm mb-8">
          Optional · max {MAX_TAGS} tags — helps customers find this dish
        </p>

        {/* PREDEFINED TAGS */}
        <div className="flex flex-wrap gap-3 mb-8">
          {PREDEFINED_TAGS.map((tag) => {
            const isSelected = selected.includes(tag);
            const isDisabled = !isSelected && !canAddMore;
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                disabled={isDisabled || isSubmitting}
                style={isSelected ? { background: "linear-gradient(135deg, #0D5F8E 0%, #14AADA 100%)" } : {}}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition
                  ${isSelected
                    ? "text-white border-[#0A84C1]"
                    : isDisabled
                    ? "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed"
                    : "bg-white text-gray-700 border-gray-300 hover:border-[#0A84C1]"
                  }`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* CUSTOM TAG */}
        <div className="mb-6">
          <label className="block text-base font-semibold text-gray-700 mb-2">
            Custom Tag
          </label>

          {customAdded ? (
            <div className="flex items-center gap-2">
              <span className="px-4 py-2 rounded-full text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #0D5F8E 0%, #14AADA 100%)" }}>
                {customAdded}
              </span>
              <button
                onClick={removeCustom}
                disabled={isSubmitting}
                className="text-sm text-red-500 font-medium"
              >
                Remove
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => {
                    setCustomInput(e.target.value.slice(0, CUSTOM_MAX_CHARS));
                    setCustomError("");
                  }}
                  disabled={isSubmitting}
                  placeholder={`e.g. House Special (max ${CUSTOM_MAX_CHARS} chars)`}
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm text-black
                             placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A84C1]"
                />
                <button
                  onClick={addCustomTag}
                  disabled={!customInput.trim() || !canAddMore || isSubmitting}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold
                    ${customInput.trim() && canAddMore && !isSubmitting
                      ? "bg-[#0A84C1] text-white"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                >
                  Add
                </button>
              </div>
              <div className="flex justify-between mt-1">
                {customError
                  ? <p className="text-xs text-red-500">{customError}</p>
                  : <span />
                }
                <p className="text-xs text-gray-400 ml-auto">{customInput.length}/{CUSTOM_MAX_CHARS}</p>
              </div>
            </>
          )}
        </div>

        {/* SELECTED SUMMARY */}
        {totalSelected > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            <p className="w-full text-sm text-gray-500 mb-1">Selected ({totalSelected}/{MAX_TAGS}):</p>
            {[...selected, ...(customAdded ? [customAdded] : [])].map((t) => (
              <span key={t} className="px-3 py-1 rounded-full text-white text-sm font-semibold" style={{ background: "linear-gradient(135deg, #0D5F8E 0%, #14AADA 100%)" }}>
                {t}
              </span>
            ))}
          </div>
        )}

        {submitError && (
          <p className="mb-4 text-sm text-red-600">{submitError}</p>
        )}

        {/* BOTTOM BAR */}
        <div className="absolute bottom-0 left-0 w-full border-t bg-white px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="px-6 py-3 rounded-xl border border-gray-300 text-base font-medium text-gray-700 disabled:opacity-50"
              >
                Back
              </button>

              <button
                type="button"
                disabled={totalSelected === 0 || isSubmitting}
                onClick={() => proceed(false)}
                className={`px-6 py-3 rounded-xl text-base font-semibold disabled:opacity-50
                  ${totalSelected > 0 && !isSubmitting
                    ? "bg-[#0A84C1] text-white"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
              >
                {isSubmitting && submittingMode === "add" ? "Adding..." : "Add"}
              </button>
            </div>

            <div className="flex items-center gap-3 min-w-[130px]">
              <span className="text-sm text-gray-500 whitespace-nowrap">Page 4 of 4</span>
              <ProgressBar progress={progress} className="flex-1 h-[6px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
