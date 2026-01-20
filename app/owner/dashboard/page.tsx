"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function OwnerDashboard() {
  const [userName, setUserName] = useState("");
  const [restaurantLogo, setRestaurantLogo] = useState("");

  useEffect(() => {
    setUserName(localStorage.getItem("userName") || "Owner");
    setRestaurantLogo(localStorage.getItem("restaurantLogo") || "");
  }, []);

  const card =
    "border border-gray-200 rounded-2xl p-4 bg-white";

  return (
    <div className="min-h-screen bg-black flex justify-center overflow-hidden">
      <div className="relative w-full max-w-md min-h-screen overflow-hidden">

        {/* DARK BACKGROUND */}
        <div className="absolute inset-0 bg-[#1c1c1c] z-0" />

        {/* TOP LOGO */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-[45vh] flex items-center justify-center z-10">
          {restaurantLogo && (
            <div className="w-44 h-44 rounded-full overflow-hidden">
              <img
                src={restaurantLogo}
                alt="Restaurant Logo"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* SPACE */}
        <div className="h-[45vh]" />

        {/* WHITE CARD */}
        <motion.div
          className="relative z-20 bg-white rounded-t-[36px] px-6 pt-10 pb-36 min-h-screen"
          initial={{ y: 140, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.8, ease: "easeOut" }}
        >
          {/* HEADER */}
          <div className="mb-10">
            <p className="text-gray-500 text-[18px] mb-1">Welcome,</p>
            <h1 className="text-black text-[36px] font-semibold">
              {userName}
            </h1>
          </div>

          {/* GRID */}
          <div className="grid grid-cols-2 gap-4 mb-12">

            {/* EDIT MENU */}
            <div className={card}>
              <div className="flex items-center justify-center gap-3 h-full">
                <img
                  src="/add.png"
                  alt="Add"
                  className="w-7 h-7"
                />
                <p className="text-black text-[16px] font-semibold">
                  Edit Menu
                </p>
              </div>
            </div>

            {/* AVG RATING */}
            <div className={card}>
              <p className="text-gray-500 text-sm">Avg Rating</p>
              <p className="text-black text-[22px] font-semibold">—</p>
            </div>

            {/* VIEW QR */}
            <div className={card}>
              <div className="flex items-center justify-center gap-3 h-full">
                <img
                  src="/qr.png"
                  alt="QR"
                  className="w-7 h-7"
                />
                <p className="text-black text-[16px] font-semibold">
                  View QR
                </p>
              </div>
            </div>

            {/* VIDEOS */}
            <div className={card}>
              <p className="text-gray-500 text-sm">Videos Uploaded</p>
              <p className="text-black text-[22px] font-semibold">0</p>
            </div>

            {/* TOTAL ITEMS */}
            <div className={card}>
              <p className="text-gray-500 text-sm">Total Items</p>
              <p className="text-black text-[22px] font-semibold">0</p>
            </div>

            {/* USER DETAILS — UPDATED */}
            <div className={card}>
              <div className="flex items-center justify-center gap-3 h-full">
                <img
                  src="/User.png"
                  alt="User"
                  className="w-7 h-7"
                />
                <p className="text-black text-[16px] font-semibold">
                  User Details
                </p>
              </div>
            </div>

          </div>

          {/* LEADERBOARD */}
          <div className="mb-12">
            <h2 className="text-black text-xl font-semibold mb-4">
              Leaderboard
            </h2>
            <div className="border border-dashed border-gray-300 rounded-2xl p-6 text-center text-gray-500">
              No data yet. Start getting reviews.
            </div>
          </div>

          {/* HIGHLIGHTS */}
          <div className="mb-12">
            <h2 className="text-black text-xl font-semibold mb-4">
              Highlights
            </h2>
            <div className="border border-dashed border-gray-300 rounded-2xl p-6 text-center text-gray-500">
              Best-performing dishes will appear here.
            </div>
          </div>

          {/* TO IMPROVE */}
          <div>
            <h2 className="text-black text-xl font-semibold mb-4">
              To Improve
            </h2>
            <div className="border border-dashed border-gray-300 rounded-2xl p-6 text-center text-gray-500">
              AI suggestions will appear here.
            </div>
          </div>
        </motion.div>

        {/* ASK ODY */}
        <div className="fixed bottom-6 right-[calc(50%-200px+16px)] z-50">
          <button className="flex items-center gap-3 bg-black/60 backdrop-blur-md text-white px-4 py-3 rounded-full shadow-lg border border-white/10">
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