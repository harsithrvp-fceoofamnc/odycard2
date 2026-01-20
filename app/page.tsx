"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SplashPage() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // fade in
    setVisible(true);

    // fade out after 3s
    const fadeOut = setTimeout(() => {
      setVisible(false);
    }, 3000);

    // navigate after fade out
    const navigate = setTimeout(() => {
      router.replace("/owner/start");
    }, 4000);

    return () => {
      clearTimeout(fadeOut);
      clearTimeout(navigate);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex justify-center items-center">
      {/* PHONE FRAME */}
      <div className="w-full max-w-md h-screen bg-black flex items-center justify-center overflow-hidden">
        <img
          src="/splash.png"
          alt="Splash"
          className={`w-full h-full object-cover transition-opacity duration-1000 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
    </div>
  );
}