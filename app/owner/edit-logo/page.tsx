"use client";

import { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";

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

export default function EditLogoPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [originalLogo, setOriginalLogo] = useState<string | null>(null);

  const [showCrop, setShowCrop] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [error, setError] = useState("");

  // 🔥 LOAD CURRENT LOGO ON PAGE OPEN (AND STORE ORIGINAL)
  useEffect(() => {
    const savedLogo = localStorage.getItem("restaurantLogo");
    if (savedLogo) {
      setCroppedImage(savedLogo);
      setOriginalLogo(savedLogo); // important backup
    }
  }, []);

  const onCropComplete = useCallback((_: any, area: any) => {
    setCroppedAreaPixels(area);
  }, []);

  // 🔥 EDIT CURRENT LOGO
  const handleEditCurrent = () => {
    if (!croppedImage) return;
    setImageSrc(croppedImage);
    setShowCrop(true);
  };

  // 🔥 UPLOAD NEW LOGO
  const handleNewUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) return;

    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setShowCrop(true);
  };

  // 🔥 SAVE CROP (TEMP ONLY — NOT LOCALSTORAGE YET)
  const saveCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    const cropped = await getCroppedImg(imageSrc, croppedAreaPixels);
    if (!cropped) return;

    setCroppedImage(cropped);
    setShowCrop(false);
    setError("");
  };

  // 🔥 REMOVE LOGO (ONLY UI, NOT STORAGE)
  const handleRemove = () => {
    setCroppedImage(null);
    setError("");
  };

  // 🔥 SAVE (MANDATORY LOGO)
  const handleSave = () => {
    if (!croppedImage) {
      setError("Please add a logo");
      return;
    }

    // 🔥 COMMIT FINAL LOGO
    localStorage.setItem("restaurantLogo", croppedImage);

    window.location.href = "/owner/dashboard";
  };

  // 🔥 CANCEL — RESTORE ORIGINAL LOGO
  const handleCancel = () => {
    if (originalLogo) {
      localStorage.setItem("restaurantLogo", originalLogo);
    }
    window.location.href = "/owner/dashboard";
  };

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-white overflow-y-auto">
        <div className="px-6 pt-10 pb-24">

          {/* TITLE */}
          <h1
            className="text-black mb-10"
            style={{ fontSize: "52px", fontWeight: 600, lineHeight: "1.1" }}
          >
            Update<br />Logo
          </h1>

          {/* 🔥 LOGO DISPLAY */}
          <div className="flex flex-col items-center mb-10">

            <div className="relative w-44 h-44 rounded-full bg-[#E5E7EB] flex items-center justify-center overflow-hidden">

              {croppedImage ? (
                <img
                  src={croppedImage}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-[#0A84C1] flex items-center justify-center mb-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="white"
                      width="30"
                      height="30"
                    >
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
                onChange={handleNewUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>

            {/* 🔥 EDIT / REMOVE */}
            {croppedImage && (
              <div className="flex gap-10 mt-8">
                <button
                  onClick={handleEditCurrent}
                  className="text-[#0A84C1] text-lg font-medium"
                >
                  Edit
                </button>

                <button
                  onClick={handleRemove}
                  className="text-red-500 text-lg font-medium"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* 🔥 ERROR */}
          {error && (
            <p className="text-red-600 text-center mb-6 font-medium">
              {error}
            </p>
          )}

          {/* 🔥 ACTION BUTTONS */}
          <div className="flex flex-col gap-4">

            {/* SAVE */}
            <button
              onClick={handleSave}
              className="w-full rounded-full bg-[#0A84C1] text-white font-semibold"
              style={{ fontSize: "18px", padding: "14px" }}
            >
              Save
            </button>

            {/* CANCEL */}
            <button
              onClick={handleCancel}
              className="w-full rounded-full bg-gray-100 text-black font-semibold"
              style={{ fontSize: "18px", padding: "14px" }}
            >
              Cancel
            </button>

          </div>
        </div>
      </div>

      {/* 🔥 CROP MODAL */}
      {showCrop && imageSrc && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="relative flex-1">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
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