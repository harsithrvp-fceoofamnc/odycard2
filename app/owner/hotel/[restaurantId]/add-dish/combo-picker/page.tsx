"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import ProgressBar from "@/components/ProgressBar";
import { API_BASE } from "@/lib/api";

type PickerDish = {
  id: string;
  name: string;
  price: number;
  photoUrl: string;
  timingFrom: string;
  timingTo: string;
  isVeg: boolean;
};

export default function ComboPickerPage() {
  const router = useRouter();
  const params = useParams();
  const restaurantId = params?.restaurantId as string;

  const [allDishes, setAllDishes] = useState<PickerDish[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [dish1, setDish1] = useState<PickerDish | null>(null);
  const [dish2, setDish2] = useState<PickerDish | null>(null);
  const [navError, setNavError] = useState<string | null>(null);

  // Load all Menu tab dishes
  useEffect(() => {
    if (!restaurantId) return;
    async function load() {
      setIsLoading(true);
      try {
        const hotelRes = await fetch(
          `${API_BASE}/api/hotels/${encodeURIComponent(restaurantId)}`
        );
        if (!hotelRes.ok) throw new Error("Hotel not found");
        const hotel = await hotelRes.json();

        const dishesRes = await fetch(
          `${API_BASE}/api/dishes?hotel_id=${encodeURIComponent(hotel.id)}&all=true`
        );
        if (!dishesRes.ok) throw new Error("Failed to load dishes");
        const rows = await dishesRes.json();

        // Only Menu tab dishes (those inside a category)
        const menuDishes: PickerDish[] = rows
          .filter((r: { menu_category_id?: number | null }) => r.menu_category_id)
          .map((r: {
            id: number | string;
            name: string;
            price: number;
            photo_url?: string | null;
            timing_from?: string;
            timing_to?: string;
            is_veg?: boolean;
          }) => ({
            id: String(r.id),
            name: r.name,
            price: Number(r.price),
            photoUrl: r.photo_url || "/food_item_logo.png",
            timingFrom: r.timing_from ?? "09:00",
            timingTo: r.timing_to ?? "22:00",
            isVeg: r.is_veg !== false,
          }));

        setAllDishes(menuDishes);

        // Restore saved combo picks
        const saved = localStorage.getItem("addDishComboIds");
        if (saved) {
          try {
            const ids: string[] = JSON.parse(saved);
            if (Array.isArray(ids) && ids.length === 2) {
              const d1 = menuDishes.find((d) => d.id === ids[0]) ?? null;
              const d2 = menuDishes.find((d) => d.id === ids[1]) ?? null;
              setDish1(d1);
              setDish2(d2);
            }
          } catch {}
        }
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Failed to load dishes");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [restaurantId]);

  // If dish1 changes, clear dish2 if it no longer matches timing
  const handleSelectDish1 = (dish: PickerDish) => {
    setDish1(dish);
    setDish2(null);
    setNavError(null);
  };

  // Dishes eligible for item 2: same timing as dish1, not dish1 itself
  const matchingDishes = dish1
    ? allDishes.filter(
        (d) =>
          d.id !== dish1.id &&
          d.timingFrom === dish1.timingFrom &&
          d.timingTo === dish1.timingTo
      )
    : [];

  const canProceed = !!dish1 && !!dish2;

  const handleNext = () => {
    if (!canProceed || !restaurantId) return;
    localStorage.setItem(
      "addDishComboIds",
      JSON.stringify([dish1!.id, dish2!.id])
    );
    router.push(`/owner/hotel/${restaurantId}/add-dish/dish-details`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex justify-center">
        <div className="w-full max-w-md min-h-screen bg-white flex items-center justify-center">
          <p className="text-gray-400 text-sm">Loading dishes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-white px-6 pt-10 pb-28 relative">

        {/* HEADER */}
        <h1
          className="text-black mb-2"
          style={{ fontSize: 36, fontWeight: 600, lineHeight: "1.1" }}
        >
          Pick Your<br />Combo Items
        </h1>
        <p className="text-gray-400 text-sm mb-8">
          Select 2 dishes · both must share the same timing
        </p>

        {loadError && (
          <p className="mb-4 text-sm text-red-600">{loadError}</p>
        )}

        {/* ITEM 1 */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Item 1
          </p>

          {allDishes.length === 0 ? (
            <div className="rounded-xl border border-gray-200 p-5 text-center">
              <p className="text-sm text-gray-400">No menu dishes found.</p>
              <p className="text-xs text-gray-300 mt-1">
                Add dishes to your Menu tab categories first.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {allDishes.map((dish) => (
                <DishPickerCard
                  key={dish.id}
                  dish={dish}
                  isSelected={dish1?.id === dish.id}
                  onSelect={() => handleSelectDish1(dish)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ITEM 2 — only shown after item 1 is picked */}
        {dish1 && (
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Item 2
            </p>
            <p className="text-xs text-gray-400 mb-3">
              Must match timing: {dish1.timingFrom} – {dish1.timingTo}
            </p>

            {matchingDishes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-5 text-center">
                <p className="text-sm font-medium text-gray-500">
                  No items found with matching timings
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Other dishes need the same timing window as{" "}
                  <span className="font-medium">"{dish1.name}"</span>
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {matchingDishes.map((dish) => (
                  <DishPickerCard
                    key={dish.id}
                    dish={dish}
                    isSelected={dish2?.id === dish.id}
                    onSelect={() => {
                      setDish2(dish);
                      setNavError(null);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selected summary */}
        {dish1 && dish2 && (
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-[#EAF4FB] px-4 py-3 border border-[#0A84C1]/20">
            <img
              src={dish1.photoUrl}
              className="w-10 h-10 rounded-lg object-cover shrink-0"
            />
            <span className="text-xs text-gray-400">+</span>
            <img
              src={dish2.photoUrl}
              className="w-10 h-10 rounded-lg object-cover shrink-0"
            />
            <p className="text-sm font-semibold text-[#0A84C1] flex-1 min-w-0 truncate">
              {dish1.name} + {dish2.name}
            </p>
          </div>
        )}

        {navError && (
          <p className="mb-4 text-sm text-red-600">{navError}</p>
        )}

        {/* BOTTOM BAR */}
        <div className="absolute bottom-0 left-0 w-full border-t bg-white px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-8 py-3 rounded-xl border border-gray-300 text-base text-gray-700 font-medium"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed}
                className={`px-8 py-3 rounded-xl text-base font-semibold disabled:opacity-70 disabled:cursor-not-allowed ${
                  canProceed ? "bg-[#0A84C1] text-white" : "bg-gray-200 text-gray-400"
                }`}
              >
                Next
              </button>
            </div>
            <div className="flex items-center gap-3 min-w-[140px]">
              <span className="text-xs text-gray-500 whitespace-nowrap">
                Page 2 of 4
              </span>
              <ProgressBar
                progress={canProceed ? 50 : 25}
                className="flex-1 h-[6px]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- DISH PICKER CARD ---------- */
function DishPickerCard({
  dish,
  isSelected,
  onSelect,
}: {
  dish: PickerDish;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`flex items-center gap-3 w-full rounded-xl border-2 px-3 py-3 text-left transition ${
        isSelected
          ? "border-[#0A84C1] bg-[#EAF4FB]"
          : "border-gray-200 bg-white"
      }`}
    >
      <img
        src={dish.photoUrl}
        alt={dish.name}
        className="w-12 h-12 rounded-lg object-cover shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-black truncate">{dish.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          ₹{dish.price} · {dish.timingFrom} – {dish.timingTo}
        </p>
      </div>
      {/* Radio circle */}
      <div
        className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
          isSelected ? "border-[#0A84C1] bg-[#0A84C1]" : "border-gray-300 bg-white"
        }`}
      >
        {isSelected && (
          <svg viewBox="0 0 10 8" width="10" height="8" fill="none">
            <path
              d="M1 4l3 3 5-6"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </button>
  );
}
