"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function StartScreen() {
  const router = useRouter();
  const [mobile, setMobile] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) setMobile(value);
  };

  const isValid = mobile.length === 10;

  return (
    <div className="min-h-screen bg-black flex justify-center overflow-hidden">
      {/* PHONE FRAME */}
      <div className="relative w-full max-w-md min-h-screen overflow-hidden">

        {/* DARK BACKGROUND */}
        <div className="absolute inset-0 bg-[#1c1c1c] z-0" />

        {/* LOGO */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-[50vh] flex items-center justify-center z-10">
          <motion.img
            src="/logo.png"
            alt="OdyCard Logo"
            className="w-[480px] h-[480px] object-contain"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
          />
        </div>

        {/* SPACE FOR LOGO */}
        <div className="h-[50vh]" />

        {/* WHITE CARD */}
        <motion.div
          className="relative z-20 bg-white rounded-t-[36px] px-8 pt-14 pb-24 min-h-screen"
          initial={{ y: "60vh" }}
          animate={{ y: 0 }}
          transition={{ duration: 2, ease: "easeOut" }}
        >
          {/* TITLE */}
          <h1
            style={{
              fontSize: "52px",
              fontWeight: 600,
              lineHeight: "1.08",
              marginBottom: "36px",
              color: "#000",
            }}
          >
            Let’s<br />
            Get<br />
            Started
          </h1>

          {/* MOBILE INPUT — FIXED SIZE */}
          <input
            type="tel"
            inputMode="numeric"
            placeholder="Enter mobile number"
            value={mobile}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-2xl mb-10
                       focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
            style={{
              fontSize: "20px",          // 👈 MATCH LOGIN
              padding: "18px 20px",      // 👈 MATCH LOGIN HEIGHT
              color: "#000",
            }}
          />

          {/* GET OTP BUTTON */}
          <button
            disabled={!isValid}
            onClick={() => router.push("/owner/otp")}
            className={`w-full rounded-full font-semibold transition ${
              isValid
                ? "bg-[#0A84C1] text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            style={{
              fontSize: "18px",
              padding: "14px",
            }}
          >
            Get OTP
          </button>

          {/* LOGIN LINK */}
          <div
            style={{
              marginTop: "32px",
              fontSize: "18px",
              textAlign: "center",
              color: "#374151",
            }}
          >
            already have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/owner/login")}
              style={{
                background: "none",
                border: "none",
                color: "#2563EB",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "18px",
                padding: 0,
              }}
            >
              login
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}