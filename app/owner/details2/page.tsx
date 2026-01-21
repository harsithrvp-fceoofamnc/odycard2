"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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

export default function DetailsPart2() {
  const router = useRouter();

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [showCrop, setShowCrop] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [error, setError] = useState("");

  const progress = croppedImage ? 100 : 50;

  const onCropComplete = useCallback((_: any, area: any) => {
    setCroppedAreaPixels(area);
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) return;
    setImageSrc(URL.createObjectURL(file));
    setShowCrop(true);
  };

  const saveCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    const cropped = await getCroppedImg(imageSrc, croppedAreaPixels);
    if (!cropped) return;

    setCroppedImage(cropped);

    /* SAVE LOGO */
    localStorage.setItem("restaurantLogo", cropped);

    setShowCrop(false);
    setError("");
  };

  const handleSubmit = () => {
    if (!croppedImage) {
      setError("Please upload your logo");
      return;
    }

    router.push("/owner/success");
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
            Upload<br />Logo
          </h1>

          {/* PROGRESS BAR */}
          <div className="mb-16 relative">
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0A84C1]"
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

          {/* LOGO UPLOAD */}
          <div className="flex flex-col items-center mb-16">
            <div className="relative w-44 h-44 rounded-full bg-[#E5E7EB] flex items-center justify-center">

              {croppedImage ? (
                <img
                  src={croppedImage}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-[#0A84C1] flex items-center justify-center mb-2">
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
                onChange={handleLogoUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>

            {croppedImage && (
              <div className="flex gap-8 mt-6">
                <button
                  onClick={() => setShowCrop(true)}
                  className="text-[#0A84C1] text-lg"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setCroppedImage(null);
                    localStorage.removeItem("restaurantLogo");
                  }}
                  className="text-red-500 text-lg"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {error && (
            <p className="text-red-600 text-center mb-6 font-medium">
              {error}
            </p>
          )}

          {/* SUBMIT */}
          <button
            onClick={handleSubmit}
            className="w-full rounded-full bg-[#0A84C1] text-white font-semibold"
            style={{ fontSize: "18px", padding: "14px" }}
          >
            Submit
          </button>
        </div>
      </div>

      {/* CROP MODAL */}
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