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

async function getCroppedImg(imageSrc: string, crop: { x: number; y: number; width: number; height: number }) {
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

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export default function VisualsPage() {
  const router = useRouter();
  const params = useParams();
  const restaurantId = params?.restaurantId as string;

  /* ---------- IMAGE STATES ---------- */
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  /* ---------- VIDEO STATES ---------- */
  const [youtubeInput, setYoutubeInput] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null);
  const [invalidLinkError, setInvalidLinkError] = useState(false);

  /* ---------- CROP ---------- */
  const [showCrop, setShowCrop] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const [navError, setNavError] = useState<string | null>(null);

  /* ---------- VALIDATION: minimal, predictable ---------- */
  const hasImage = !!imageUrl || !!imageFile;
  const hasYoutube = typeof youtubeUrl === "string" && youtubeUrl.trim().length > 0;
  const canProceed = hasImage && hasYoutube && !isUploadingImage;

  const BASE_PROGRESS = 33;
  const VISUALS_COMPLETE_PROGRESS = 66;
  const computedProgress = canProceed ? VISUALS_COMPLETE_PROGRESS : BASE_PROGRESS;

  const handleNext = () => {
    if (!restaurantId || typeof restaurantId !== "string") {
      setNavError("Restaurant ID missing. Please refresh.");
      return;
    }
    if (!imageUrl) {
      setNavError("Please complete the crop first (click Done in the crop modal).");
      return;
    }
    if (!youtubeUrl || typeof youtubeUrl !== "string") {
      setNavError("Please add a video link first.");
      return;
    }

    setNavError(null);
    localStorage.setItem("addDishPhoto", imageUrl);
    localStorage.setItem("addDishVideoId", youtubeUrl);
    router.push(`/owner/hotel/${restaurantId}/add-dish/dish-details`);
  };

  const handleUploadVideo = () => {
    const id = extractYouTubeId(youtubeInput);
    if (!id) {
      setInvalidLinkError(true);
      return;
    }
    setInvalidLinkError(false);
    setYoutubeUrl(id);
  };

  const handleRemoveVideo = () => {
    setYoutubeUrl(null);
    setYoutubeInput("");
    setInvalidLinkError(false);
  };

  /* ---------- PHOTO: store file, preview only, open crop ---------- */
  const handlePhotoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) return;

    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setCroppedAreaPixels(null);
    setShowCrop(true);
  }, [imagePreview]);

  const onCropComplete = useCallback((_: unknown, area: { x: number; y: number; width: number; height: number }) => {
    setCroppedAreaPixels(area);
  }, []);

  const handleCropCancel = useCallback(() => {
    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setImageFile(null);
    setCroppedAreaPixels(null);
    setShowCrop(false);
  }, [imagePreview]);

  const saveCrop = useCallback(async () => {
    const src = imagePreview;
    if (!src) {
      setIsUploadingImage(false);
      return;
    }

    setIsUploadingImage(true);
    try {
      let area = croppedAreaPixels;
      if (!area) {
        const img = await createImage(src);
        area = { x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight };
      }

      const cropped = await getCroppedImg(src, area);
      if (!cropped) {
        setNavError("Failed to process image. Please try again.");
        setIsUploadingImage(false);
        return;
      }
      setImageUrl(cropped);
      console.log("[AddDish Visuals] saveCrop: imageUrl has been set");
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(null);
      setImageFile(null);
      setCroppedAreaPixels(null);
      setShowCrop(false);
      setNavError(null);
    } catch (err) {
      console.error("[AddDish Visuals] Crop error:", err);
      setNavError("Failed to process image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  }, [imagePreview, croppedAreaPixels]);

  const handleRemovePhoto = useCallback(() => {
    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setImageFile(null);
    setImageUrl(null);
  }, [imagePreview]);

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-white px-6 pt-10 pb-28 relative">

        {/* DEBUG: visible fallback when restaurantId missing */}
        {(!restaurantId || typeof restaurantId !== "string") && (
          <p className="mb-4 text-sm text-red-600 font-medium">
            Restaurant ID missing. Please refresh.
          </p>
        )}

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

          {youtubeUrl === null ? (
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
                  src={`https://www.youtube.com/embed/${youtubeUrl}`}
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
            {imageUrl ? (
              <img
                src={imageUrl}
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

          {imageUrl && (
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
        <div className="absolute bottom-0 left-0 w-full border-t bg-white px-6 py-4">
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

              {(console.log("[AddDish Visuals] canProceed:", { hasImage, hasYoutube, isUploadingImage, canProceed }), null)}
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed}
                className={`px-6 py-2 rounded-md text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed ${
                  canProceed ? "bg-[#0A84C1] text-white" : "bg-gray-200 text-gray-400"
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
        </div>
      </div>

      {/* ---------- CROP MODAL (16:9) ---------- */}
      {showCrop && imagePreview && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="relative flex-1">
            <Cropper
              image={imagePreview}
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
              onClick={handleCropCancel}
              className="text-white text-lg"
            >
              Cancel
            </button>
            <button
              onClick={saveCrop}
              disabled={isUploadingImage}
              className="text-white text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploadingImage ? "Processing..." : "Done"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
