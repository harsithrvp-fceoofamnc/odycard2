"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Cropper from "react-easy-crop";
import { API_BASE } from "@/lib/api";
import { useLoader } from "@/context/LoaderContext";
import ProgressBar from "@/components/ProgressBar";

/* helpers */
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const MAX_CANVAS_DIM = 1080;

async function getCroppedImg(imageSrc: string, crop: { x: number; y: number; width: number; height: number }) {
  const image = await createImage(imageSrc);
  let { width, height } = crop;

  if (width > MAX_CANVAS_DIM || height > MAX_CANVAS_DIM) {
    const scale = Math.min(MAX_CANVAS_DIM / width, MAX_CANVAS_DIM / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
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
    width,
    height
  );

  return canvas.toDataURL("image/png");
}

export default function DetailsPart2() {
  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  const [coverSrc, setCoverSrc] = useState<string | null>(null);
  const [originalCoverSrc, setOriginalCoverSrc] = useState<string | null>(null);
  const [originalCoverBase64, setOriginalCoverBase64] = useState<string | null>(null);
  const [croppedCover, setCroppedCover] = useState<string | null>(null);

  const [showCrop, setShowCrop] = useState(false);
  const [cropType, setCropType] = useState<"logo" | "cover">("logo");

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const croppedAreaPixelsRef = useRef<any>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔥 PROGRESS — START 50, LOGO MAKES IT 100
  let progress = 50;
  if (croppedImage) progress = 100;

  const onCropComplete = useCallback((_: any, area: any) => {
    setCroppedAreaPixels(area);
    croppedAreaPixelsRef.current = area;
  }, []);

  const onCropAreaChange = useCallback((_: any, area: any) => {
    croppedAreaPixelsRef.current = area;
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

  // COVER UPLOAD (OPTIONAL) — use base64 for cropper (mobile reliability), keep originalCoverBase64 for backend
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) return;

    const base64 = await fileToBase64(file);
    setOriginalCoverSrc(base64);
    setOriginalCoverBase64(base64);
    setCoverSrc(base64);
    setCropType("cover");
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setShowCrop(true);
  };

  // EDIT COVER — reopen cropper with original full image
  const handleEditCover = () => {
    if (!originalCoverSrc) return;
    setCoverSrc(originalCoverSrc);
    setCropType("cover");
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setShowCrop(true);
  };

  // SAVE CROP — use ref for reliable crop area (avoids null in production due to timing)
  const saveCrop = async () => {
    // LOGO SAVE (unchanged — uses state)
    if (cropType === "logo" && imageSrc) {
      if (!croppedAreaPixels) return;
      const cropped = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!cropped) return;

      setCroppedImage(cropped);
      localStorage.setItem("restaurantLogo", cropped);
    }

    // COVER SAVE — use ref (not state) for latest crop; modal closes only after successful crop
    if (cropType === "cover" && coverSrc) {
      const areaPixels = croppedAreaPixelsRef.current;
      if (!areaPixels) return;

      const cropped = await getCroppedImg(coverSrc, areaPixels);
      if (!cropped) return;

      setCroppedCover(cropped);
      localStorage.setItem("restaurantCover", cropped);
      setShowCrop(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
      setError("");
      return;
    }

    setShowCrop(false);
    if (coverInputRef.current) coverInputRef.current.value = "";
    setError("");
  };

  const closeCropModal = () => {
    setShowCrop(false);
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  // SUBMIT — create hotel, upload logo/cover, then redirect
  const handleSubmit = async () => {
    if (!croppedImage) {
      setError("Please upload your logo");
      return;
    }

    const restaurantName = localStorage.getItem("restaurantName") || "";
    const slug = localStorage.getItem("restaurantSlug") || "";

    if (!restaurantName || !slug) {
      setError("Missing restaurant details. Please go back and fill the form.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    showLoader();

    try {
      console.log("[Details2 handleSubmit] API_BASE:", API_BASE);
      // Create new hotel — slug from Details (slugified once, used unchanged)
      const createRes = await fetch(`${API_BASE}/api/hotels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: restaurantName,
          slug,
        }),
      });

      if (!createRes.ok) {
        if (createRes.status === 409) {
          hideLoader();
          setIsSubmitting(false);
          setError("Restaurant ID already exists. Please go back and choose another.");
          return;
        }
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

      // Update hotel with logo and cover (base64 data URLs supported)
      const patchBody: Record<string, string | null> = {
        logo_url: croppedImage,
        cover_url: croppedCover || null,
      };
      if (originalCoverBase64) {
        patchBody.cover_original_url = originalCoverBase64;
      }
      const patchRes = await fetch(`${API_BASE}/api/hotels/${hotel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      });

      if (!patchRes.ok) {
        console.warn("Logo/cover update failed, continuing...");
      }

      // 3. Clear previous owner data (multi-tenant isolation)
      localStorage.removeItem("ody_dishes");
      localStorage.removeItem("restaurantLogo");
      localStorage.removeItem("restaurantCover");
      localStorage.removeItem("restaurantSlug"); // was only for creation flow

      // 4. Store this owner's hotel data (rest of app uses restaurantId for slug)
      localStorage.setItem("ody_hotel_id", String(hotel.id));
      localStorage.setItem("restaurantId", hotel.slug);
      localStorage.setItem("restaurantName", hotel.name);

      window.location.href = "/owner/success";
    } catch (err) {
      hideLoader();
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-white overflow-y-auto relative">
        <div className="px-6 pt-10 pb-28">

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
                  alt="Cover preview"
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
                ref={coverInputRef}
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

        </div>

        {/* BOTTOM BAR */}
        <div className="absolute bottom-0 left-0 w-full border-t bg-white px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 rounded-md border border-gray-300 text-sm text-gray-700"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-6 py-2 rounded-md text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed ${
                  isSubmitting
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-[#0A84C1] text-white"
                }`}
              >
                {isSubmitting ? "Creating..." : "Submit"}
              </button>
            </div>
            <div className="flex items-center gap-3 min-w-[140px]">
              <span className="text-xs text-gray-500 whitespace-nowrap">
                Page 2 of 2
              </span>
              <ProgressBar progress={100} className="flex-1 h-[4px]" />
            </div>
          </div>
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
              onCropAreaChange={onCropAreaChange}
            />
          </div>

          <div className="p-4 flex justify-between bg-black">
            <button
              onClick={closeCropModal}
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