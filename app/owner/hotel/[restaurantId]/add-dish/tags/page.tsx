"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ProgressBar from "@/components/ProgressBar";

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
const CUSTOM_MAX_CHARS = 20;

const ADD_DISH_TAGS_KEY = "addDishTags";

export default function DishTagsPage() {
  const router = useRouter();
  const params = useParams();
  const restaurantId = params?.restaurantId as string;

  const [selected, setSelected] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [customAdded, setCustomAdded] = useState<string | null>(null);
  const [customError, setCustomError] = useState("");

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

  const proceed = (skip = false) => {
    if (!skip && totalSelected > 0) {
      const allTags = [...selected, ...(customAdded ? [customAdded] : [])];
      localStorage.setItem(ADD_DISH_TAGS_KEY, JSON.stringify(allTags));
    } else {
      localStorage.removeItem(ADD_DISH_TAGS_KEY);
    }
    router.push(`/owner/hotel/${restaurantId}/add-dish/dish-details`);
  };

  const progress = totalSelected > 0 ? 90 : 66;

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-white px-6 pt-10 pb-28 relative">

        {/* HEADER */}
        <h1 className="text-black mb-2" style={{ fontSize: 36, fontWeight: 600, lineHeight: "1.1" }}>
          Add Tags
        </h1>
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
                disabled={isDisabled}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition
                  ${isSelected
                    ? "bg-[#0A84C1] text-white border-[#0A84C1]"
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
              <span className="px-4 py-2 rounded-full text-sm font-semibold bg-[#0A84C1] text-white">
                {customAdded}
              </span>
              <button
                onClick={removeCustom}
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
                  placeholder={`e.g. House Special (max ${CUSTOM_MAX_CHARS} chars)`}
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm text-black
                             placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A84C1]"
                />
                <button
                  onClick={addCustomTag}
                  disabled={!customInput.trim() || !canAddMore}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold
                    ${customInput.trim() && canAddMore
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
              <span key={t} className="px-3 py-1 rounded-full bg-[#0A84C1] text-white text-xs font-semibold">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* BOTTOM BAR */}
        <div className="absolute bottom-0 left-0 w-full border-t bg-white px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 rounded-xl border border-gray-300 text-base font-medium text-gray-700"
              >
                Back
              </button>

              <button
                type="button"
                onClick={() => proceed(true)}
                className="px-6 py-3 rounded-xl border border-gray-300 text-base font-medium text-gray-500"
              >
                Skip
              </button>

              <button
                type="button"
                disabled={totalSelected === 0}
                onClick={() => proceed(false)}
                className={`px-6 py-3 rounded-xl text-base font-semibold disabled:opacity-50
                  ${totalSelected > 0 ? "bg-[#0A84C1] text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
              >
                Next
              </button>
            </div>

            <div className="flex items-center gap-3 min-w-[130px]">
              <span className="text-sm text-gray-500 whitespace-nowrap">Page 3 of 4</span>
              <ProgressBar progress={progress} className="flex-1 h-[6px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
