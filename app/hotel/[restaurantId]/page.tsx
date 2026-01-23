"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const tabs = ["Ody Menu", "Menu", "Eat Later", "Favorites"];

export default function HotelHomePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [logo, setLogo] = useState("");
  const [cover, setCover] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLogo(localStorage.getItem("restaurantLogo") || "");
    setCover(localStorage.getItem("restaurantCover") || "");
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
      <div className="relative w-full max-w-md min-h-screen overflow-hidden bg-[#1c1c1c]">

        {/* 🔥 COVER + LOGO */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-[50vh] z-10 overflow-hidden">
          {cover ? (
            <>
              <img src={cover} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30" />
            </>
          ) : (
            <div className="w-full h-full bg-[#1c1c1c]" />
          )}

          <div className="absolute inset-0 flex items-center justify-center -translate-y-6">
            {logo && (
              <div className="w-44 h-44 rounded-full overflow-hidden shadow-[0_35px_70px_rgba(0,0,0,0.85)]">
                <img src={logo} className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>

        <div className="h-[47vh]" />

        {/* 🔥 WHITE LAYER */}
        <motion.div
          className="
            relative z-20
            bg-white
            rounded-t-[36px]
            min-h-screen
            -mt-10
            overflow-hidden
          "
          initial={{ y: 140, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.6, ease: "easeOut" }}
        >
          {/* 🔥 TAB BAR */}
          <div className="sticky top-0 bg-white z-20 border-b border-gray-200">
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

          {/* 🔥 SWIPE AREA */}
          <div
            ref={containerRef}
            onScroll={handleScroll}
            className="
              flex w-full
              h-[calc(100vh-50vh)]
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
            <div className="min-w-full h-full snap-center flex items-center justify-center">
              <p className="text-gray-400 text-xl font-medium">Coming soon</p>
            </div>

            <div className="min-w-full h-full snap-center flex items-center justify-center">
              <p className="text-gray-400 text-xl font-medium">Coming soon</p>
            </div>

            <div className="min-w-full h-full snap-center flex flex-col items-center justify-center px-6">
              <img src="/User.png" className="w-20 h-20 mb-6 opacity-90" />
              <p className="text-gray-500 mb-6 text-center">
                Sign in or log in to use Eat Later
              </p>
              <div className="flex gap-4">
                <button className="px-6 py-3 rounded-full bg-[#0A84C1] text-white font-semibold">
                  Sign In
                </button>
                <button className="px-6 py-3 rounded-full bg-white border border-[#0A84C1] text-[#0A84C1] font-semibold">
                  Log In
                </button>
              </div>
            </div>

            <div className="min-w-full h-full snap-center flex flex-col items-center justify-center px-6">
              <img src="/User.png" className="w-20 h-20 mb-6 opacity-90" />
              <p className="text-gray-500 mb-6 text-center">
                Sign in or log in to save favorites
              </p>
              <div className="flex gap-4">
                <button className="px-6 py-3 rounded-full bg-[#0A84C1] text-white font-semibold">
                  Sign In
                </button>
                <button className="px-6 py-3 rounded-full bg-white border border-[#0A84C1] text-[#0A84C1] font-semibold">
                  Log In
                </button>
              </div>
            </div>
          </div>

          {/* 🔥 WHITE HOME INDICATOR MASK (THIS FIXES YOUR ISSUE) */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-32 h-[6px] rounded-full bg-white opacity-90" />

        </motion.div>

        {/* 🔥 ASK ODY */}
        <div className="fixed bottom-6 right-[calc(50%-200px+16px)] z-50">
          <button className="flex items-center gap-3 bg-black/70 backdrop-blur-md text-white px-4 py-3 rounded-full shadow-lg border border-white/10">
            <img src="/ody-face.png" className="w-8 h-8 rounded-full" />
            <span className="text-sm font-medium">Ask Ody</span>
          </button>
        </div>

      </div>
    </div>
  );
}