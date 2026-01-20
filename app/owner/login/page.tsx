"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();

  const [gmail, setGmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!gmail.endsWith("@gmail.com")) {
      setError("Gmail not found");
      return;
    }

    if (password.length < 6) {
      setError("Incorrect password, try again");
      return;
    }

    setError("");
    router.push("/owner/otp");
  };

  return (
    <div className="min-h-screen bg-black flex justify-center overflow-hidden">
      {/* PHONE FRAME */}
      <div className="relative w-full max-w-md min-h-screen overflow-hidden">

        {/* DARK BACKGROUND */}
        <div className="absolute inset-0 bg-[#1c1c1c] z-0" />

        {/* LOGO (STATIC, NO ANIMATION) */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-[45vh] flex items-center justify-center z-10">
          <img
            src="/logo.png"
            alt="OdyCard Logo"
            className="w-[520px] h-[520px] object-contain"
          />
        </div>

        {/* SPACE FOR LOGO */}
        <div className="h-[45vh]" />

        {/* WHITE CARD */}
        <motion.div
          className="relative z-20 bg-white rounded-t-[36px] px-8 pt-14 pb-24 min-h-screen"
          initial={{ y: 140, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: 1.8,
            ease: "easeOut",
          }}
        >
          {/* TITLE */}
          <h1
            style={{
              fontSize: "52px",
              fontWeight: 600,
              textAlign: "center",
              marginBottom: "48px",
              color: "#000",
            }}
          >
            Log In
          </h1>

          {/* GMAIL */}
          <label className="block mb-3 text-[20px] font-semibold text-black">
            Gmail
          </label>
          <input
            type="email"
            value={gmail}
            onChange={(e) => {
              setGmail(e.target.value);
              setError("");
            }}
            className="w-full border border-gray-300 rounded-xl mb-10
                       focus:outline-none focus:border-black focus:ring-2 focus:ring-black"
            style={{
              fontSize: "20px",
              padding: "14px 16px",
              color: "#000",
            }}
          />

          {/* PASSWORD */}
          <label className="block mb-3 text-[20px] font-semibold text-black">
            Password
          </label>

          <div className="relative mb-6">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              className="w-full border border-gray-300 rounded-xl
                         focus:outline-none focus:border-black focus:ring-2 focus:ring-black"
              style={{
                fontSize: "22px",
                padding: "14px 56px 14px 16px",
                color: "#000",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[16px] font-medium text-gray-500"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {/* ERROR */}
          {error && (
            <p
              style={{
                color: "#DC2626",
                fontSize: "14px",
                marginBottom: "28px",
              }}
            >
              {error}
            </p>
          )}

          {/* LOGIN BUTTON */}
          <button
            onClick={handleLogin}
            className="w-full rounded-full bg-[#0A84C1] text-white font-semibold"
            style={{
              fontSize: "20px",
              padding: "14px",
            }}
          >
            Log In
          </button>
        </motion.div>
      </div>
    </div>
  );
}