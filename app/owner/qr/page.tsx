"use client";

import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OwnerQRPage() {
  const router = useRouter();
  const [ownerPageUrl, setOwnerPageUrl] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("restaurantId");
    if (!id) return;

    setOwnerPageUrl(`${window.location.origin}/hotel/${id}`);
  }, []);

  const downloadQR = () => {
    const canvas = document.getElementById("ody-qr") as HTMLCanvasElement;
    if (!canvas) return;

    const pngUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = "odysra-qr.png";
    link.click();
  };

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-white flex flex-col items-center px-6 pt-20">

        {/* TITLE */}
        <h1 className="text-black text-[28px] font-semibold mb-6">
          Your QR Code
        </h1>

        {/* QR */}
        <div className="bg-white rounded-3xl p-6 shadow-md mb-8">
          <QRCodeCanvas
            id="ody-qr"
            value={ownerPageUrl}
            size={240}
            bgColor="#ffffff"
            fgColor="#000000"
            level="H"
          />
        </div>

        {/* URL (optional but useful) */}
        <p className="text-sm text-gray-500 text-center break-all mb-8">
          {ownerPageUrl}
        </p>

        {/* DOWNLOAD */}
        <button
          onClick={downloadQR}
          className="w-full rounded-full bg-[#0A84C1] text-white font-semibold mb-4"
          style={{ fontSize: "18px", padding: "14px" }}
        >
          Download QR
        </button>

        {/* BACK */}
        <button
          onClick={() => router.back()}
          className="w-full rounded-full bg-[#E5E7EB] text-black font-semibold"
          style={{ fontSize: "18px", padding: "14px" }}
        >
          Back
        </button>
      </div>
    </div>
  );
}