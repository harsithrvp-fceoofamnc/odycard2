"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { API_BASE } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) setMobile(value);
    setError("");
  };

  const handleLogin = async () => {
    if (!mobile.trim()) {
      setError("Enter your mobile number");
      return;
    }
    if (mobile.length !== 10) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    if (password.length < 6) {
      setError("Incorrect password, try again");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: mobile.trim(), password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Invalid mobile number or password");
        setIsLoading(false);
        return;
      }

      const { hotel } = data;
      if (!hotel) {
        setError("Invalid response. Please try again.");
        setIsLoading(false);
        return;
      }

      localStorage.setItem("ody_hotel_id", String(hotel.id));
      localStorage.setItem("restaurantId", hotel.slug);
      localStorage.setItem("restaurantName", hotel.name);
      localStorage.setItem("userName", hotel.name);

      router.push("/owner/dashboard");
    } catch {
      setError("Connection error. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex justify-center overflow-hidden">
      <div className="relative w-full max-w-md min-h-screen overflow-hidden">

        {/* DARK BACKGROUND */}
        <div className="absolute inset-0 bg-[#1c1c1c] z-0" />

        {/* LOGO */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-[45vh] flex items-center justify-center z-10">
          <img
            src="/logo.png"
            alt="OdyCard Logo"
            className="w-[520px] h-[520px] object-contain"
          />
        </div>

        <div className="h-[45vh]" />

        {/* WHITE CARD */}
        <motion.div
          className="relative z-20 bg-white rounded-t-[36px] px-8 pt-14 pb-24 min-h-screen"
          initial={{ y: 140, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.8, ease: "easeOut" }}
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

          {/* MOBILE NUMBER */}
          <label className="block mb-3 text-[20px] font-semibold text-black">
            Mobile Number
          </label>
          <input
            type="tel"
            inputMode="numeric"
            value={mobile}
            onChange={handleMobileChange}
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
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              className="w-full border border-gray-300 rounded-xl
                         focus:outline-none focus:border-black focus:ring-2 focus:ring-black"
              style={{
                fontSize: "20px",
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
            <p style={{ color: "#DC2626", fontSize: "14px", marginBottom: "28px" }}>
              {error}
            </p>
          )}

          {/* LOGIN BUTTON */}
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full rounded-full bg-[#0A84C1] text-white font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
            style={{ fontSize: "20px", padding: "14px" }}
          >
            {isLoading ? "Logging in..." : "Log In"}
          </button>

          {/* OR DIVIDER */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-[14px]">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* SIGN IN WITH GOOGLE */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-full"
            style={{ fontSize: "17px", fontWeight: 500, padding: "13px", color: "#000" }}
          >
            <svg width="22" height="22" viewBox="0 0 48 48">
              <path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.1 33.1 29.6 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l6-6C34.5 6.5 29.5 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5c11 0 20.5-8 20.5-20.5 0-1.4-.1-2.7-.5-4z"/>
              <path fill="#34A853" d="M6.3 14.7l7 5.1C15 16.1 19.2 13 24 13c3 0 5.8 1.1 7.9 3l6-6C34.5 6.5 29.5 4.5 24 4.5c-7.6 0-14.2 4.3-17.7 10.2z"/>
              <path fill="#FBBC05" d="M24 45.5c5.4 0 10.3-1.8 14.1-4.9l-6.5-5.3C29.6 36.8 26.9 37.5 24 37.5c-5.6 0-10.3-3.8-11.9-9l-7 5.4C8.6 41 15.8 45.5 24 45.5z"/>
              <path fill="#EA4335" d="M44.5 20H24v8.5h11.7c-.8 2.3-2.3 4.2-4.3 5.5l6.5 5.3c3.8-3.5 6.1-8.7 6.1-14.3 0-1.4-.1-2.7-.5-4z"/>
            </svg>
            Sign in with Google
          </button>
        </motion.div>
      </div>
    </div>
  );
}
