"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function PhonePage() {
  const router = useRouter();
  const [mobile, setMobile] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) setMobile(value);
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobile.length === 10) {
      // Clear any leftover form data from a previous signup attempt
      sessionStorage.removeItem("signup_form");
      sessionStorage.removeItem("signup_password");
      sessionStorage.removeItem("signup_google_gmail");
      sessionStorage.setItem("signup_mobile", mobile);
      sessionStorage.setItem("signup_method", "mobile");
      router.push("/owner/otp");
    }
  };

  const isValid = mobile.length === 10;

  return (
    <div className="min-h-screen bg-black flex justify-center overflow-hidden">
      <div className="relative w-full max-w-md min-h-screen overflow-hidden">

        {/* DARK BACKGROUND */}
        <div className="absolute inset-0 bg-black z-0" />

        {/* LOGO */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-[40vh] flex items-center justify-center z-10">
          <img
            src="/logo.png"
            alt="OdyCard Logo"
            className="w-[520px] h-[520px] object-contain"
          />
        </div>

        <div className="h-[40vh]" />

        {/* WHITE CARD */}
        <motion.div
          className="relative z-20 bg-white rounded-t-[36px] px-8 pt-12 pb-24 min-h-screen"
          initial={{ y: 140, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.6, ease: "easeOut" }}
        >
          {/* BACK ARROW */}
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1 text-gray-600 mb-8"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="text-[16px] font-medium">Back</span>
          </button>

          {/* TITLE */}
          <h1
            className="text-center mb-10"
            style={{ fontSize: "40px", fontWeight: 600, color: "#000" }}
          >
            Enter Your Number
          </h1>

          <form onSubmit={handleSendOtp}>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="Enter mobile number"
              value={mobile}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-2xl mb-10
                         focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
              style={{ fontSize: "20px", padding: "18px 20px", color: "#000" }}
            />

            <button
              type="submit"
              disabled={!isValid}
              className={`w-full rounded-full font-semibold transition ${
                isValid
                  ? "bg-[#0A84C1] text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              style={{ fontSize: "20px", padding: "14px" }}
            >
              Send OTP
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
