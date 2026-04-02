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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobile.length === 10) {
      sessionStorage.setItem("signup_mobile", mobile);
      sessionStorage.setItem("signup_method", "mobile");
      router.push("/owner/otp");
    }
  };

  const handleGoogleSignup = () => {
    sessionStorage.setItem("signup_method", "google");
    router.push("/owner/details");
  };

  const isValid = mobile.length === 10;

  return (
    <div className="min-h-screen bg-black flex justify-center overflow-hidden">
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
            Let's<br />
            Get<br />
            Started
          </h1>

          {/* MOBILE INPUT + GET OTP */}
          <form onSubmit={handleSubmit}>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="Enter mobile number"
              value={mobile}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-2xl mb-6
                         focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
              style={{
                fontSize: "20px",
                padding: "18px 20px",
                color: "#000",
              }}
            />

            <button
              type="submit"
              disabled={!isValid}
              className={`w-full rounded-full font-semibold transition ${
                isValid
                  ? "bg-[#0A84C1] text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              style={{ fontSize: "18px", padding: "14px" }}
            >
              Get OTP
            </button>
          </form>

          {/* OR DIVIDER */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-[14px]">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* SIGN UP WITH GOOGLE */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-full"
            style={{ fontSize: "17px", fontWeight: 500, padding: "13px", color: "#000" }}
          >
            <svg width="22" height="22" viewBox="0 0 48 48">
              <path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.1 33.1 29.6 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l6-6C34.5 6.5 29.5 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5c11 0 20.5-8 20.5-20.5 0-1.4-.1-2.7-.5-4z"/>
              <path fill="#34A853" d="M6.3 14.7l7 5.1C15 16.1 19.2 13 24 13c3 0 5.8 1.1 7.9 3l6-6C34.5 6.5 29.5 4.5 24 4.5c-7.6 0-14.2 4.3-17.7 10.2z"/>
              <path fill="#FBBC05" d="M24 45.5c5.4 0 10.3-1.8 14.1-4.9l-6.5-5.3C29.6 36.8 26.9 37.5 24 37.5c-5.6 0-10.3-3.8-11.9-9l-7 5.4C8.6 41 15.8 45.5 24 45.5z"/>
              <path fill="#EA4335" d="M44.5 20H24v8.5h11.7c-.8 2.3-2.3 4.2-4.3 5.5l6.5 5.3c3.8-3.5 6.1-8.7 6.1-14.3 0-1.4-.1-2.7-.5-4z"/>
            </svg>
            Sign up with Google
          </button>

          {/* ALREADY HAVE AN ACCOUNT */}
          <div
            style={{
              marginTop: "24px",
              fontSize: "17px",
              textAlign: "center",
              color: "#374151",
            }}
          >
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/owner/login")}
              style={{
                background: "none",
                border: "none",
                color: "#2563EB",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "17px",
                padding: 0,
              }}
            >
              Log In
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
