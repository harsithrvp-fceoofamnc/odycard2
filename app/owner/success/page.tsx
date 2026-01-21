"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useState } from "react";

export default function SuccessPage() {
  const router = useRouter();

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [ownerPageUrl, setOwnerPageUrl] = useState<string>("");

  // 🔥 READ RESTAURANT ID ENTERED BY OWNER
  useEffect(() => {
    const id = localStorage.getItem("restaurantId");

    if (!id) {
      // safety fallback (should not happen normally)
      console.error("Restaurant ID missing");
      return;
    }

    setRestaurantId(id);

    // 🔥 THIS IS THE FINAL PUBLIC HOTEL PAGE URL
    setOwnerPageUrl(`https://odysra.com/hotel/${id}`);
  }, []);

  const downloadQR = () => {
    const canvas = document.getElementById("ody-qr") as HTMLCanvasElement;
    if (!canvas) return;

    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");

    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = "odysra-qr.png";
    link.click();
  };

  if (!restaurantId) return null;

  return (
    <div className="min-h-screen bg-black flex justify-center overflow-hidden">
      {/* 📱 PHONE FRAME */}
      <div className="relative w-full max-w-md min-h-screen overflow-hidden bg-[#F5F7FB] flex flex-col items-center px-6 pt-20 pb-24">

        {/* ✅ SUCCESS ICON */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-6"
        >
          <div className="w-24 h-24 rounded-full bg-[#E8F2FF] flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="56"
              height="56"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0A84C1"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
        </motion.div>

        {/* TITLE */}
        <h1 className="text-black text-[32px] font-semibold text-center mb-2">
          Successfully Registered
        </h1>

        <p className="text-gray-500 text-center mb-10">
          Your restaurant page is live on OdyCard
        </p>

        {/* 🔥 REAL QR — OPENS HOTEL PAGE */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-3xl p-6 shadow-md mb-6"
        >
          <QRCodeCanvas
            id="ody-qr"
            value={ownerPageUrl}
            size={220}
            bgColor="#ffffff"
            fgColor="#000000"
            level="H"
          />
        </motion.div>

        {/* SHOW URL (for your testing only) */}
        <p className="text-sm text-gray-500 mb-6 text-center break-all">
          {ownerPageUrl}
        </p>

        {/* DOWNLOAD QR */}
        <button
          onClick={downloadQR}
          className="w-full rounded-full bg-[#0A84C1] text-white font-semibold mb-4"
          style={{ fontSize: "18px", padding: "14px" }}
        >
          Download QR
        </button>

        {/* GO HOME */}
        <button
          onClick={() => router.push("/owner/dashboard")}
          className="w-full rounded-full bg-[#E5E7EB] text-black font-semibold"
          style={{ fontSize: "18px", padding: "14px" }}
        >
          Home
        </button>

      </div>
    </div>
  );
}