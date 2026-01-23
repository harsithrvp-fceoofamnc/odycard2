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

  // Update active tab while swiping
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollLeft, clientWidth } = containerRef.current;
    const index = Math.round(scrollLeft / clientWidth);
    setActiveTab(index);
  };

  // Jump to tab when clicking tab button
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
      {/* 📱 PHONE FRAME */}
      <div className="relative w-full max-w-md min-h-screen bg-[#1c1c1c] overflow-hidden">

        {/* 🔥 TOP LOGO — FIXED */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-[40vh] flex items-center justify-center z-20 bg-[#1c1c1c]">
          {logo && (
            <div className="w-44 h-44 rounded-full overflow-hidden shadow-xl">
              <img
                src={logo}
                alt="Restaurant Logo"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* SPACE FOR LOGO */}
        <div className="h-[40vh]" />

        {/* 🔥 TAB BAR — FIXED */}
        <div className="sticky top-[40vh] z-20 bg-[#1c1c1c] border-b border-gray-700">
          <div className="flex">
            {tabs.map((tab, index) => (
              <button
                key={tab}
                onClick={() => goToTab(index)}
                className={`flex-1 py-3 text-sm font-medium transition ${
                  activeTab === index
                    ? "text-[#0A84C1] border-b-2 border-[#0A84C1]"
                    : "text-gray-400"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* 🔥 HORIZONTAL SWIPE AREA */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="
            flex w-full
            h-[calc(100vh-40vh-48px)]
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
          {/* ================= ODY MENU ================= */}
          <div className="min-w-full h-full snap-center overflow-y-auto flex items-center justify-center">
            <p className="text-gray-400 text-xl font-medium">
              Coming soon
            </p>
          </div>

          {/* ================= MENU ================= */}
          <div className="min-w-full h-full snap-center overflow-y-auto flex items-center justify-center">
            <p className="text-gray-400 text-xl font-medium">
              Coming soon
            </p>
          </div>

          {/* ================= EAT LATER ================= */}
          <div className="min-w-full h-full snap-center overflow-y-auto flex flex-col items-center justify-center px-6">

            {/* 🔥 WHITE USER ICON */}
            <img
              src="/User.png"
              className="w-20 h-20 mb-6 opacity-90 invert"
            />

            <p className="text-gray-400 mb-6 text-center">
              Sign in or log in to use Eat Later
            </p>

            <div className="flex gap-4">
              <button className="px-6 py-3 rounded-full bg-[#0A84C1] text-white font-semibold">
                Sign In
              </button>

              <button className="px-6 py-3 rounded-full bg-white text-[#0A84C1] font-semibold">
                Log In
              </button>
            </div>
          </div>

          {/* ================= FAVORITES ================= */}
          <div className="min-w-full h-full snap-center overflow-y-auto flex flex-col items-center justify-center px-6">

            {/* 🔥 WHITE USER ICON */}
            <img
              src="/User.png"
              className="w-20 h-20 mb-6 opacity-90 invert"
            />

            <p className="text-gray-400 mb-6 text-center">
              Sign in or log in to save favorites
            </p>

            <div className="flex gap-4">
              <button className="px-6 py-3 rounded-full bg-[#0A84C1] text-white font-semibold">
                Sign In
              </button>

              <button className="px-6 py-3 rounded-full bg-white text-[#0A84C1] font-semibold">
                Log In
              </button>
            </div>
          </div>

        </div>

        {/* 🔥 ASK ODY — ALWAYS FLOATING */}
        <div className="fixed bottom-6 right-[calc(50%-200px+16px)] z-50">
          <button
            className="
              flex items-center gap-3
              bg-black/70 backdrop-blur-md
              text-white
              px-4 py-3 rounded-full
              shadow-lg border border-white/10
            "
          >
            <img
              src="/ody-face.png"
              alt="Ask Ody"
              className="w-8 h-8 rounded-full"
            />
            <span className="text-sm font-medium">Ask Ody</span>
          </button>
        </div>

      </div>
    </div>
  );
}