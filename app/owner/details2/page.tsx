"use client";

import { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import { API_BASE } from "@/lib/api";

/* helpers */
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, crop: any) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  return canvas.toDataURL("image/png");
}

export default function DetailsPart2() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  const [coverSrc, setCoverSrc] = useState<string | null>(null);
  const [croppedCover, setCroppedCover] = useState<string | null>(null);

  const [showCrop, setShowCrop] = useState(false);
  const [cropType, setCropType] = useState<"logo" | "cover">("logo");

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔥 PROGRESS — START 50, LOGO MAKES IT 100
  let progress = 50;
  if (croppedImage) progress = 100;

  const onCropComplete = useCallback((_: any, area: any) => {
    setCroppedAreaPixels(area);
  }, []);

  // Reset zoom and crop when switching between logo and cover
  useEffect(() => {
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  }, [cropType]);

  // LOGO UPLOAD (REQUIRED)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) return;

    setImageSrc(URL.createObjectURL(file));
    setCropType("logo");
    setShowCrop(true);
  };

  // COVER UPLOAD (OPTIONAL)
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) return;

    setCoverSrc(URL.createObjectURL(file));
    setCropType("cover");
    setShowCrop(true);
  };

  // SAVE CROP
  const saveCrop = async () => {
    if (!croppedAreaPixels) return;

    // LOGO SAVE
    if (cropType === "logo" && imageSrc) {
      const cropped = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!cropped) return;

      setCroppedImage(cropped);
      localStorage.setItem("restaurantLogo", cropped);
    }

    // COVER SAVE (ONLY IF USER ADDS)
    if (cropType === "cover" && coverSrc) {
      const cropped = await getCroppedImg(coverSrc, croppedAreaPixels);
      if (!cropped) return;

      setCroppedCover(cropped);
      localStorage.setItem("restaurantCover", cropped);
    }

    setShowCrop(false);
    setError("");
  };

  // SUBMIT — create hotel, upload logo/cover, then redirect
  const handleSubmit = async () => {
    if (!croppedImage) {
      setError("Please upload your logo");
      return;
    }

    const restaurantName = localStorage.getItem("restaurantName") || "";
    const restaurantId = localStorage.getItem("restaurantId") || "";

    if (!restaurantName || !restaurantId) {
      setError("Missing restaurant details. Please go back and fill the form.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // 1. Create new hotel (unique slug generated server-side)
      const createRes = await fetch(`${API_BASE}/api/hotels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: restaurantName,
          slug: restaurantId,
        }),
      });

      if (!createRes.ok) {
        const text = await createRes.text();
        let msg = "Failed to create restaurant";
        try {
          const data = JSON.parse(text);
          if (data?.error) msg = data.error;
        } catch {
          if (text) msg = `${msg} (${createRes.status}: ${text.slice(0, 80)}…)`;
          else msg = `${msg} (HTTP ${createRes.status})`;
        }
        throw new Error(msg);
      }

      const hotel = await createRes.json();

      // 2. Update hotel with logo and cover (base64 data URLs supported)
      const patchRes = await fetch(`${API_BASE}/api/hotels/${hotel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logo_url: croppedImage,
          cover_url: croppedCover || null,
        }),
      });

      if (!patchRes.ok) {
        console.warn("Logo/cover update failed, continuing...");
      }

      // 3. Clear previous owner data (multi-tenant isolation)
      localStorage.removeItem("ody_dishes");
      localStorage.removeItem("restaurantLogo");
      localStorage.removeItem("restaurantCover");

      // 4. Store this owner's hotel data
      localStorage.setItem("ody_hotel_id", String(hotel.id));
      localStorage.setItem("restaurantId", hotel.slug);
      localStorage.setItem("restaurantName", hotel.name);

      window.location.href = "/owner/success";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-white overflow-y-auto">
        <div className="px-6 pt-10 pb-24">

          {/* TITLE */}
          <h1
            className="text-black mb-6"
            style={{ fontSize: "52px", fontWeight: 600, lineHeight: "1.1" }}
          >
            Set Your<br />OdyCard Look
          </h1>

          {/* PROGRESS BAR */}
          <div className="mb-16 relative">
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0A84C1] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            <span
              className="absolute text-sm font-medium text-gray-600"
              style={{ right: 0, top: "14px" }}
            >
              {progress}%
            </span>
          </div>

          {/* 🔥 LOGO UPLOAD (REQUIRED) */}
          <div className="flex flex-col items-center mb-16">
            <p className="text-[18px] font-semibold text-black mb-6">
              Restaurant Logo
            </p>

            <div className="relative w-44 h-44 rounded-full bg-[#E5E7EB] flex items-center justify-center">

              {croppedImage ? (
                <img
                  src={croppedImage}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-[#0A84C1] flex items-center justify-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="30" height="30">
                      <path d="M12 3l4 4h-3v6h-2V7H8l4-4zm-7 14v2h14v-2H5z" />
                    </svg>
                  </div>
                  <span className="text-[16px] font-medium text-gray-700">
                    Add Logo
                  </span>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* 🔥 COVER PHOTO (OPTIONAL) */}
          <div className="mb-16">
            <p className="text-[18px] font-semibold text-black mb-1">
              Cover Photo <span className="text-gray-400">(optional)</span>
            </p>

            <div className="relative w-full h-52 rounded-2xl bg-[#E5E7EB] flex items-center justify-center overflow-hidden">

              {croppedCover ? (
                <img
                  src={croppedCover}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center w-full text-center">
                  <div className="w-14 h-14 rounded-full bg-[#0A84C1] flex items-center justify-center mb-3 mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="26" height="26">
                      <path d="M12 3l4 4h-3v6h-2V7H8l4-4zm-7 14v2h14v-2H5z" />
                    </svg>
                  </div>

                  <span className="text-[15px] font-medium text-gray-700 text-center">
                    Add Cover Photo
                  </span>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-center mb-6 font-medium">
              {error}
            </p>
          )}

          {/* SUBMIT */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full rounded-full bg-[#0A84C1] text-white font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
            style={{ fontSize: "18px", padding: "14px" }}
          >
            {isSubmitting ? "Creating..." : "Submit"}
          </button>
        </div>
      </div>

      {/* 🔥 CROP MODAL */}
      {showCrop && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="relative flex-1">
            <Cropper
              image={cropType === "logo" ? imageSrc! : coverSrc!}
              crop={crop}
              zoom={zoom}
              aspect={cropType === "logo" ? 1 : 4 / 3}
              cropShape={cropType === "logo" ? "round" : "rect"}
              minZoom={1}
              maxZoom={3}
              restrictPosition={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          <div className="p-4 flex justify-between bg-black">
            <button
              onClick={() => setShowCrop(false)}
              className="text-white text-lg"
            >
              Cancel
            </button>
            <button
              onClick={saveCrop}
              className="text-white text-lg"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}