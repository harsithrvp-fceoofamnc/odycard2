"use client";

import { useEffect, useRef, useState } from "react";

const tabs = ["Ody Menu", "Menu", "Eat Later", "Favorites"];

export default function HotelHomePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [logo, setLogo] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLogo(localStorage.getItem("restaurantLogo") || "");
  }, []);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollLeft, clientWidth } = containerRef.current;
    const index = Math.round(scrollLeft / clientWidth);
    setActiveTab(index);
  };

  const goToTab = (index: number) => {
    if (!containerRef.current) return;
    containerRef.current.scrollTo({
      left: containerRef.current.clientWidth * index,
      behavior: "smooth",
    });
    setActiveTab(index);
  };

  return (
    <div className="min-h-screen bg-black flex justify-center">
      {/* PHONE FRAME */}
      <div className="w-full max-w-md min-h-screen bg-white overflow-hidden">

        {/* HEADER WITH LOGO */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gray-200">
          {logo && (
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <img
                src={logo}
                alt="Restaurant Logo"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <h1 className="text-lg font-semibold text-black">
            Restaurant
          </h1>
        </div>

        {/* TAB BAR */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              onClick={() => goToTab(index)}
              className={`flex-1 py-3 text-sm font-medium transition ${
                activeTab === index
                  ? "text-[#0A84C1] border-b-2 border-[#0A84C1]"
                  : "text-gray-500"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* SWIPE CONTAINER */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="
            flex w-full
            h-[calc(100vh-120px)]
            overflow-x-auto
            overflow-y-hidden
            snap-x snap-mandatory
            touch-pan-x
            scrollbar-hide
          "
          style={{
            WebkitOverflowScrolling: "touch",
            scrollSnapType: "x mandatory",
          }}
        >
          {/* ODY MENU */}
          <div className="min-w-full h-full overflow-y-auto snap-center snap-always px-4 py-6">
            <h2 className="text-lg font-semibold mb-4">
              Ody Menu (Video Menu)
            </h2>
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="mb-4 h-48 bg-gray-200 rounded-xl flex items-center justify-center text-gray-600"
              >
                Video Item {i + 1}
              </div>
            ))}
          </div>

          {/* MENU */}
          <div className="min-w-full h-full overflow-y-auto snap-center snap-always px-4 py-6">
            <h2 className="text-lg font-semibold mb-4">Menu</h2>
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="mb-3 p-4 border border-gray-200 rounded-xl"
              >
                Menu Item {i + 1}
              </div>
            ))}
          </div>

          {/* EAT LATER */}
          <div className="min-w-full h-full overflow-y-auto snap-center snap-always px-4 py-6">
            <h2 className="text-lg font-semibold mb-4">Eat Later</h2>
            {Array.from({ length: 15 }).map((_, i) => (
              <div
                key={i}
                className="mb-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl"
              >
                Saved Item {i + 1}
              </div>
            ))}
          </div>

          {/* FAVORITES */}
          <div className="min-w-full h-full overflow-y-auto snap-center snap-always px-4 py-6">
            <h2 className="text-lg font-semibold mb-4">Favorites</h2>
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="mb-3 p-4 bg-pink-50 border border-pink-200 rounded-xl"
              >
                Favorite Item {i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}