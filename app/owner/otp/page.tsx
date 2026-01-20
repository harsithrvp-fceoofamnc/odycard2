"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function OtpPage() {
  const router = useRouter();

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  /* TIMER */
  useEffect(() => {
    if (timeLeft === 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    if (otp.join("").length === 4) {
      router.push("/owner/details");
    }
  };

  const handleResend = () => {
    setOtp(["", "", "", ""]);
    setTimeLeft(30);
    setCanResend(false);
    inputsRef.current[0]?.focus();
  };

  return (
    <div className="min-h-screen bg-black flex justify-center overflow-hidden">
      {/* PHONE FRAME */}
      <div className="relative w-full max-w-md min-h-screen overflow-hidden">

        {/* DARK BACKGROUND */}
        <div className="absolute inset-0 bg-[#1c1c1c] z-0" />

        {/* LOGO */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-[40vh] flex items-center justify-center z-10">
          <img
            src="/logo.png"
            alt="OdyCard Logo"
            className="w-[520px] h-[520px] object-contain"
          />
        </div>

        {/* SPACE FOR LOGO */}
        <div className="h-[40vh]" />

        {/* WHITE CARD */}
        <motion.div
          className="relative z-20 bg-white rounded-t-[36px] px-8 pt-12 pb-24 min-h-screen"
          initial={{ y: 140, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.6, ease: "easeOut" }}
        >
          {/* ENTER OTP — SMALLER */}
          <h1
            className="text-center mb-10"
            style={{
              fontSize: "40px",   // 👈 reduced size
              fontWeight: 600,
              color: "#000",
            }}
          >
            Enter OTP
          </h1>

          {/* OTP BOXES */}
          <div className="flex justify-center gap-4 mb-10">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputsRef.current[index] = el)}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="
                  w-14 h-14
                  border border-gray-400 rounded-xl
                  bg-white
                  text-center
                  text-2xl font-semibold text-black
                  focus:outline-none
                  focus:border-black focus:ring-2 focus:ring-black
                "
              />
            ))}
          </div>

          {/* TIMER / RESEND */}
          {!canResend ? (
            <p className="text-center text-gray-500 mb-12">
              Resend OTP in 0:{timeLeft.toString().padStart(2, "0")}
            </p>
          ) : (
            <button
              onClick={handleResend}
              className="block mx-auto mb-12 text-[#0A84C1] font-semibold"
            >
              Resend OTP
            </button>
          )}

          {/* VERIFY BUTTON */}
          <button
            onClick={handleVerify}
            disabled={otp.join("").length !== 4}
            className={`w-full rounded-full font-semibold ${
              otp.join("").length === 4
                ? "bg-[#0A84C1] text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            style={{
              fontSize: "20px",
              padding: "14px",
            }}
          >
            Verify
          </button>
        </motion.div>
      </div>
    </div>
  );
}