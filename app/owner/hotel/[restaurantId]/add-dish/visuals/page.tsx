"use client";

import { useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Cropper from "react-easy-crop";
import ProgressBar from "@/components/ProgressBar";

/* ---------- IMAGE CROP HELPERS ---------- */
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

export default function VisualsPage() {
  const router = useRouter();
  const params = useParams();
  const restaurantId = params?.restaurantId as string | undefined;

  /* ---------- VIDEO ---------- */
  const [youtubeInput, setYoutubeInput] = useState("");
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
  const [invalidLinkError, setInvalidLinkError] = useState(false);

  /* ---------- PHOTO ---------- */
  const [photoSrc, setPhotoSrc] = useState<string | null>(null);
  const [croppedPhoto, setCroppedPhoto] = useState<string | null>(null);

  /* ---------- CROP ---------- */
  const [showCrop, setShowCrop] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  /* ---------- PROGRESS (base from previous page; step up only when both uploads done) ---------- */
  const hasVideo = uploadedVideoId !== null;
  const hasPhoto = croppedPhoto !== null;
  const BASE_PROGRESS = 33; // from dish type page
  const VISUALS_COMPLETE_PROGRESS = 66;
  const computedProgress =
    hasVideo && hasPhoto ? VISUALS_COMPLETE_PROGRESS : BASE_PROGRESS;

  const [navError, setNavError] = useState<string | null>(null);
  const nextEnabled = hasVideo && hasPhoto;

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[AddDish Visuals] handleNext fired");
    console.log("[AddDish Visuals] selected dish type (from localStorage):", localStorage.getItem("addDishType"));
    console.log("[AddDish Visuals] photo presence:", !!croppedPhoto);
    console.log("[AddDish Visuals] video presence:", !!uploadedVideoId);
    console.log("[AddDish Visuals] restaurantId:", restaurantId);

    if (!restaurantId || typeof restaurantId !== "string") {
      console.error("[AddDish Visuals] ERROR: restaurantId is undefined or invalid");
      setNavError("Restaurant ID is missing. Please go back and try again.");
      return;
    }
    if (!croppedPhoto) {
      setNavError("Please upload a photo first.");
      return;
    }
    if (!uploadedVideoId) {
      setNavError("Please add a video link first.");
      return;
    }

    setNavError(null);
    localStorage.setItem("addDishPhoto", croppedPhoto);
    localStorage.setItem("addDishVideoId", uploadedVideoId);
    const target = `/owner/hotel/${restaurantId}/add-dish/dish-details`;
    console.log("[AddDish Visuals] Navigating to:", target);
    router.push(target);
  };

  /* ---------- VIDEO HELPERS ---------- */
  const extractYouTubeId = (url: string) => {
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  };

  const handleUploadVideo = () => {
    const id = extractYouTubeId(youtubeInput);
    if (!id) {
      setInvalidLinkError(true);
      return;
    }
    setInvalidLinkError(false);
    setUploadedVideoId(id);
  };

  const handleRemoveVideo = () => {
    setUploadedVideoId(null);
    setYoutubeInput("");
    setInvalidLinkError(false);
  };

  /* ---------- PHOTO HELPERS ---------- */
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) return;

    setPhotoSrc(URL.createObjectURL(file));
    setShowCrop(true);
  };

  const onCropComplete = useCallback((_: any, area: any) => {
    setCroppedAreaPixels(area);
  }, []);

  const saveCrop = async () => {
    if (!photoSrc || !croppedAreaPixels) return;
    const cropped = await getCroppedImg(photoSrc, croppedAreaPixels);
    if (!cropped) return;

    setCroppedPhoto(cropped);
    setShowCrop(false);
  };

  const handleRemovePhoto = () => {
    setPhotoSrc(null);
    setCroppedPhoto(null);
  };

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-white px-6 pt-10 pb-28 relative">

        {/* HEADER */}
        <h1
          className="text-black mb-10"
          style={{ fontSize: 36, fontWeight: 600, lineHeight: "1.1" }}
        >
          Add Visuals <br />
          For Your Dish
        </h1>

        {/* ---------- VIDEO UPLOAD ---------- */}
        <div className="mb-6 rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-lg mb-4 text-center">
            Upload Video
          </h2>

          <div className="flex justify-center mb-10">
            <div className="w-20 h-20 flex items-center justify-center
                            border border-gray-200 rounded-xl bg-gray-50">
              <img src="/link.png" alt="Link" className="w-6 h-6" />
            </div>
          </div>

          {uploadedVideoId === null ? (
            <>
              <input
                type="text"
                placeholder="Paste your YouTube video link here"
                value={youtubeInput}
                onChange={(e) => {
                  setYoutubeInput(e.target.value);
                  setInvalidLinkError(false);
                }}
                className="w-full border border-gray-300 rounded-xl
                           px-4 py-3 text-sm text-black
                           focus:outline-none focus:ring-2
                           focus:ring-[#0A84C1]"
              />

              {invalidLinkError && (
                <p className="mt-2 text-sm text-red-600">Paste valid link</p>
              )}

              <button
                onClick={handleUploadVideo}
                disabled={youtubeInput.trim() === ""}
                className={`mt-3 w-full rounded-xl py-3 text-sm font-semibold
                  ${
                    youtubeInput.trim()
                      ? "bg-[#0A84C1] text-white"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
              >
                Upload
              </button>
            </>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border">
                <iframe
                  width="100%"
                  height="200"
                  src={`https://www.youtube.com/embed/${uploadedVideoId}`}
                  allowFullScreen
                />
              </div>

              <button
                onClick={handleRemoveVideo}
                className="mt-3 w-full rounded-xl py-2
                           border border-red-300 text-red-600 font-semibold"
              >
                Remove
              </button>
            </>
          )}
        </div>

        {/* ---------- PHOTO UPLOAD (WHATSAPP + CROP) ---------- */}
        <div className="mb-6 rounded-2xl border border-gray-200 p-6 min-h-[320px] flex flex-col">
          <h2 className="font-semibold text-lg mb-4 text-center">
            Upload Photo
          </h2>

          <div className="flex-1 flex flex-col justify-center min-h-[200px]">
            <div className="relative w-full h-[200px] rounded-xl overflow-hidden bg-[#E5E7EB] -mt-10">
            {croppedPhoto ? (
              <img
                src={croppedPhoto}
                className="w-full h-full object-cover"
              />
            ) : (
              <label className="absolute inset-0 cursor-pointer">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <img
                    src="/camera.png"
                    alt="Camera"
                    className="w-10 h-10 mb-2"
                  />
                  <span className="text-sm text-gray-600">
                    Add Photo
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                </div>
              </label>
            )}
            </div>
          </div>

          {croppedPhoto && (
            <button
              onClick={handleRemovePhoto}
              className="mt-3 w-full rounded-xl py-2
                         border border-red-300 text-red-600 font-semibold"
            >
              Remove
            </button>
          )}
        </div>

        {navError && (
          <p className="mb-4 text-sm text-red-600">{navError}</p>
        )}

        {/* ---------- BOTTOM BAR ---------- */}
        <form onSubmit={handleNext} className="absolute bottom-0 left-0 w-full border-t bg-white px-6 py-4">
          <div className="flex items-center justify-between gap-4">

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 rounded-md border border-gray-300
                           text-sm text-gray-700"
              >
                Back
              </button>

              <button
                type="submit"
                disabled={!nextEnabled}
                className={`px-6 py-2 rounded-md text-sm font-medium
                  ${
                    nextEnabled
                      ? "bg-[#0A84C1] text-white"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
              >
                Next
              </button>
            </div>

            {/* PROGRESS (RIGHT) — same layout as add-dish page */}
            <div className="flex items-center gap-3 min-w-[140px]">
              <span className="text-xs text-gray-500 whitespace-nowrap">
                Page 2 of 3
              </span>
              <ProgressBar progress={computedProgress} className="flex-1 h-[4px]" />
            </div>

          </div>
        </form>
      </div>

      {/* ---------- CROP MODAL (16:9) ---------- */}
      {showCrop && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="relative flex-1">
            <Cropper
              image={photoSrc!}
              crop={crop}
              zoom={zoom}
              aspect={16 / 9}
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
