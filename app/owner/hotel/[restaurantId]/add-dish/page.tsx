"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

type DishType = "food_item" | "dessert" | "beverage" | null;

export default function AddDishPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [selectedType, setSelectedType] = useState<DishType>(null);

  /* ---------- PAGE / PROGRESS LOGIC ---------- */
  const TOTAL_PAGES = 3;
  const CURRENT_PAGE = 1;

  // Progress fills ONLY after selection
  const progress =
    selectedType !== null
      ? Math.round((CURRENT_PAGE / TOTAL_PAGES) * 100) // 33%
      : 0;

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-white px-6 pt-10 pb-28 relative">

        {/* HEADER */}
        <h1
          className="text-black mb-10"
          style={{ fontSize: 42, fontWeight: 600, lineHeight: "1.1" }}
        >
          Set Up <br />
          Your Dish
        </h1>

        {/* QUESTION */}
        <p className="text-black text-xl font-semibold mb-10">
          What type of dish is this?
        </p>

        {/* OPTIONS */}
        <div className="flex flex-col items-center gap-8">
          <div className="flex gap-8">
            <DishCard
              type="food_item"
              label="Food item"
              img="/food_item_logo.png"
              selectedType={selectedType}
              setSelectedType={setSelectedType}
            />
            <DishCard
              type="dessert"
              label="Dessert"
              img="/dessert_logo.png"
              selectedType={selectedType}
              setSelectedType={setSelectedType}
            />
          </div>

          <DishCard
            type="beverage"
            label="Beverage"
            img="/beverages_logo.png"
            selectedType={selectedType}
            setSelectedType={setSelectedType}
          />
        </div>

        {/* ---------- GOOGLE FORMS STYLE BOTTOM BAR ---------- */}
        <div className="absolute bottom-0 left-0 w-full border-t bg-white px-6 py-4">
          <div className="flex items-center justify-between gap-4">

            {/* NEXT BUTTON (LEFT) */}
            <button
              disabled={!selectedType}
              onClick={() => router.push(`${pathname}/visuals`)}
              className={`px-6 py-2 rounded-md text-sm font-medium transition
                ${
                  selectedType
                    ? "bg-[#0A84C1] text-white"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
            >
              Next
            </button>

            {/* PROGRESS (RIGHT) */}
            <div className="flex items-center gap-3 min-w-[140px]">
              <span className="text-xs text-gray-500 whitespace-nowrap">
                Page {CURRENT_PAGE} of {TOTAL_PAGES}
              </span>

              <div className="flex-1 h-[4px] bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: "#0A84C1",
                  }}
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- DISH CARD ---------- */

function DishCard({
  type,
  label,
  img,
  selectedType,
  setSelectedType,
}: {
  type: DishType;
  label: string;
  img: string;
  selectedType: DishType;
  setSelectedType: (type: DishType) => void;
}) {
  return (
    <button
      onClick={() => setSelectedType(type)}
      className={`w-36 h-36 border-2 rounded-3xl flex flex-col items-center justify-center gap-3 transition
        ${
          selectedType === type
            ? "border-[#0A84C1] bg-[#EAF4FB]"
            : "border-gray-200 bg-white"
        }`}
    >
      <img src={img} alt={label} className="w-20 h-20" />
      <span className="text-base font-semibold text-black">
        {label}
      </span>
    </button>
  );
}
