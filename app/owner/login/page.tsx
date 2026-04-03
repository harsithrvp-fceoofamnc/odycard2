"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black flex justify-center overflow-hidden">
      <div className="relative w-full max-w-md min-h-screen overflow-hidden">

        {/* DARK BACKGROUND */}
        <div className="absolute inset-0 bg-[#1c1c1c] z-0" />

        {/* LOGO */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-[40vh] flex items-center justify-center z-10">
          <motion.img
            src="/logo.png"
            alt="OdyCard Logo"
            className="w-[480px] h-[480px] object-contain"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
          />
        </div>

        <div className="h-[40vh]" />

        {/* WHITE CARD */}
        <motion.div
          className="relative z-20 bg-white rounded-t-[36px] px-8 pt-10 pb-24 min-h-screen"
          initial={{ y: "60vh" }}
          animate={{ y: 0 }}
          transition={{ duration: 2, ease: "easeOut" }}
        >
          {/* BACK ARROW */}
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1 text-gray-400 mb-6"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="text-[15px] font-medium">Back</span>
          </button>

          {/* TITLE */}
          <h1
            style={{
              fontSize: "48px",
              fontWeight: 700,
              lineHeight: "1.1",
              color: "#000",
              marginBottom: "6px",
            }}
          >
            Welcome<br />Back
          </h1>

          {/* SUBTITLE */}
          <p style={{ fontSize: "16px", color: "#9ca3af", marginBottom: "36px", fontWeight: 400 }}>
            Sign in to manage your restaurant
          </p>

          {/* LOGIN WITH MOBILE */}
          <button
            type="button"
            onClick={() => router.push("/owner/login-mobile")}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-full mb-4"
            style={{ fontSize: "17px", fontWeight: 500, padding: "14px", color: "#000" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12" y2="18" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            Login with Mobile Number
          </button>

          {/* OR DIVIDER */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-[14px]">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* LOGIN WITH GOOGLE */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-full"
            style={{ fontSize: "17px", fontWeight: 500, padding: "14px", color: "#000" }}
          >
            <svg width="22" height="22" viewBox="0 0 48 48">
              <path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.1 33.1 29.6 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l6-6C34.5 6.5 29.5 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5c11 0 20.5-8 20.5-20.5 0-1.4-.1-2.7-.5-4z"/>
              <path fill="#34A853" d="M6.3 14.7l7 5.1C15 16.1 19.2 13 24 13c3 0 5.8 1.1 7.9 3l6-6C34.5 6.5 29.5 4.5 24 4.5c-7.6 0-14.2 4.3-17.7 10.2z"/>
              <path fill="#FBBC05" d="M24 45.5c5.4 0 10.3-1.8 14.1-4.9l-6.5-5.3C29.6 36.8 26.9 37.5 24 37.5c-5.6 0-10.3-3.8-11.9-9l-7 5.4C8.6 41 15.8 45.5 24 45.5z"/>
              <path fill="#EA4335" d="M44.5 20H24v8.5h11.7c-.8 2.3-2.3 4.2-4.3 5.5l6.5 5.3c3.8-3.5 6.1-8.7 6.1-14.3 0-1.4-.1-2.7-.5-4z"/>
            </svg>
            Login with Google
          </button>

          {/* DON'T HAVE AN ACCOUNT */}
          <div style={{ marginTop: "28px", fontSize: "16px", textAlign: "center", color: "#6b7280" }}>
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/owner/start")}
              style={{ background: "none", border: "none", color: "#2563EB", fontWeight: 600, cursor: "pointer", fontSize: "16px", padding: 0 }}
            >
              Sign Up
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
