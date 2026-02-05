"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DishType = "food_item" | "dessert" | "beverage" | null;

export default function AddDishPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<DishType>(null);

  const progress = selectedType ? 20 : 0;

  const handleNext = () => {
    if (!selectedType) return;
    router.push("?step=media");
  };

  const Card = ({
    type,
    label,
    img,
  }: {
    type: DishType;
    label: string;
    img: string;
  }) => (
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
      <span className="text-base font-semibold text-black">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-white px-6 pt-10 pb-24">

        {/* HEADER */}
        <h1
          className="text-black mb-6"
          style={{ fontSize: "42px", fontWeight: 600, lineHeight: "1.1" }}
        >
          Set Up <br />
          Your Dish
        </h1>

        {/* PROGRESS */}
        <div className="mb-10">
          <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0A84C1] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {progress}% completed
          </p>
        </div>

        {/* QUESTION */}
        <p className="text-black text-xl font-semibold mb-10">
          What type of dish is this?
        </p>

        {/* OPTIONS – BOWLING BALL LAYOUT */}
        <div className="flex flex-col items-center gap-8">

          {/* TOP ROW */}
          <div className="flex gap-8">
            <Card
              type="food_item"
              label="Food item"
              img="/food_item_logo.png"
            />
            <Card
              type="dessert"
              label="Dessert"
              img="/dessert_logo.png"
            />
          </div>

          {/* BOTTOM CENTER */}
          <Card
            type="beverage"
            label="Beverage"
            img="/beverages_logo.png"
          />
        </div>

        {/* NEXT BUTTON */}
        <div className="mt-16">
          <button
            onClick={handleNext}
            disabled={!selectedType}
            className={`w-full rounded-full font-semibold text-white py-4 transition
              ${
                selectedType
                  ? "bg-[#0A84C1]"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
          >
            Next
          </button>
        </div>

      </div>
    </div>
  );
}
