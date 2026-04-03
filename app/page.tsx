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
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img
        src="/logo.png"
        alt="Splash"
        style={{
          width: "70%",
          maxWidth: "320px",
          objectFit: "contain",
          opacity: visible ? 1 : 0,
          transition: "opacity 1s",
        }}
      />
    </div>
  );
}