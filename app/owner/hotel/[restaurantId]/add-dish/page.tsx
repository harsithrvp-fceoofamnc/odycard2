"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

type DishType = "food_item" | "dessert" | "beverage" | "combo" | null;

export default function AddDishPage() {
  const router = useRouter();
  const params = useParams();
  const restaurantId = params?.restaurantId as string;

  const [selectedType, setSelectedType] = useState<DishType>(null);
  const [navError, setNavError] = useState<string | null>(null);

  // Restore saved type when coming back
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("addDishType") as DishType;
    if (saved === "food_item" || saved === "dessert" || saved === "beverage" || saved === "combo") {
      setSelectedType(saved);
    }
  }, []);

  const handleNext = () => {
    if (!restaurantId || typeof restaurantId !== "string") {
      setNavError("Restaurant ID missing. Please refresh.");
      return;
    }
    if (!selectedType) {
      setNavError("Please select a dish type first.");
      return;
    }

    setNavError(null);
    localStorage.setItem("addDishType", selectedType);

    // Combos skip the visuals step and go straight to combo-picker
    const target =
      selectedType === "combo"
        ? `/owner/hotel/${restaurantId}/add-dish/combo-picker`
        : `/owner/hotel/${restaurantId}/add-dish/visuals`;
    router.push(target);
  };

  const isMenuDish = typeof window !== "undefined" && !!localStorage.getItem("addDishMenuCategoryId");
  const TOTAL_PAGES = isMenuDish ? 4 : 3;
  const CURRENT_PAGE = 1;
  const progress = selectedType !== null ? Math.round((CURRENT_PAGE / TOTAL_PAGES) * 100) : 0;

  const handleReturn = () => {
    if (restaurantId && typeof restaurantId === "string") {
      router.push(`/owner/hotel/${restaurantId}/edit-menu`);
    }
  };

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-white px-6 pt-10 pb-28 relative">

        <button
          type="button"
          onClick={handleReturn}
          disabled={!restaurantId || typeof restaurantId !== "string"}
          className="mb-6 px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Return
        </button>

        {(!restaurantId || typeof restaurantId !== "string") && (
          <p className="mb-4 text-sm text-red-600 font-medium">
            Restaurant ID missing. Please refresh.
          </p>
        )}

        <h1
          className="text-black mb-10"
          style={{ fontSize: 42, fontWeight: 600, lineHeight: "1.1" }}
        >
          Set Up <br />
          Your Dish
        </h1>

        <p className="text-black text-xl font-semibold mb-10">
          What type of dish is this?
        </p>

        {/* 2×2 grid for all four types */}
        <div className="grid grid-cols-2 gap-6 justify-items-center">
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
          <DishCard
            type="beverage"
            label="Beverage"
            img="/beverages_logo.png"
            selectedType={selectedType}
            setSelectedType={setSelectedType}
          />
          <DishCard
            type="combo"
            label="Combo"
            img="/combo_logo.png"
            selectedType={selectedType}
            setSelectedType={setSelectedType}
          />
        </div>

        {navError && (
          <p className="mt-6 text-sm text-red-600">{navError}</p>
        )}

        {/* BOTTOM BAR */}
        <div className="absolute bottom-0 left-0 w-full border-t bg-white px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleNext}
              className={`px-8 py-3 rounded-xl text-base font-semibold transition
                ${selectedType
                  ? "bg-[#0A84C1] text-white"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
            >
              Next
            </button>

            <div className="flex items-center gap-3 min-w-[140px]">
              <span className="text-sm text-gray-500 whitespace-nowrap">
                Page {CURRENT_PAGE} of {TOTAL_PAGES}
              </span>
              <div className="flex-1 h-[6px] bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, backgroundColor: "#0A84C1" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
      className={`w-36 h-36 border-2 rounded-3xl flex flex-col items-center justify-center gap-2 transition
        ${selectedType === type ? "border-[#0A84C1] bg-[#EAF4FB]" : "border-gray-200 bg-white"}`}
    >
      <img src={img} alt={label} className="w-28 h-28 object-contain" />
      <span className="text-base font-semibold text-black">{label}</span>
    </button>
  );
}
