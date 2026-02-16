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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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

export default function EditCoverPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [croppedCover, setCroppedCover] = useState<string | null>(null);

  // cover_original_url = full image for re-cropping; cover_url = cropped display
  const [coverOriginalUrl, setCoverOriginalUrl] = useState<string | null>(null);

  // 🔐 SNAPSHOT OF SAVED STATE (for Cancel)
  const [originalCover, setOriginalCover] = useState<string | null>(null);
  const [originalCoverOriginal, setOriginalCoverOriginal] = useState<string | null>(null);

  // New file upload: store full base64 for PATCH on Submit
  const [newFileBase64, setNewFileBase64] = useState<string | null>(null);

  const [showCrop, setShowCrop] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [hotelId, setHotelId] = useState<string | null>(null);

  // Load current cover from API (multi-tenant: hotel-scoped)
  useEffect(() => {
    const slug = localStorage.getItem("restaurantId");
    if (!slug) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/hotels/${encodeURIComponent(slug)}`);
        if (!res.ok) return;
        const hotel = await res.json();
        if (cancelled) return;
        setHotelId(String(hotel.id));
        if (hotel.cover_url && hotel.cover_url !== "null") {
          setCroppedCover(hotel.cover_url);
          setOriginalCover(hotel.cover_url);
        } else {
          setOriginalCover(null);
        }
        if (hotel.cover_original_url && hotel.cover_original_url !== "null") {
          setCoverOriginalUrl(hotel.cover_original_url);
          setOriginalCoverOriginal(hotel.cover_original_url);
        } else {
          setCoverOriginalUrl(null);
          setOriginalCoverOriginal(null);
        }
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const onCropComplete = useCallback((_: any, area: any) => {
    setCroppedAreaPixels(area);
  }, []);

  // 🔥 ADD NEW COVER — store full base64 for PATCH on Submit
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) return;

    const src = URL.createObjectURL(file);
    const base64 = await fileToBase64(file);

    setNewFileBase64(base64); // will PATCH both cover_original_url and cover_url on Submit
    setImageSrc(src);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setShowCrop(true);
  };

  // 🔥 EDIT CURRENT COVER — cropper loads cover_original_url if available, else cover_url
  const handleEditCurrent = () => {
    const src = coverOriginalUrl ?? croppedCover;
    if (src) {
      setNewFileBase64(null); // re-crop only; PATCH cover_url only on Submit
      setImageSrc(src);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setShowCrop(true);
    }
  };

  // 🔥 REMOVE (PREVIEW ONLY — NO STORAGE TOUCH)
  const handleRemove = () => {
    setCroppedCover(null);
    setImageSrc(null);
    setNewFileBase64(null);
  };

  // 🔥 SAVE CROPPED RESULT (DRAFT)
  const saveCrop = async () => {
    if (!croppedAreaPixels || !imageSrc) return;

    const cropped = await getCroppedImg(imageSrc, croppedAreaPixels);
    if (!cropped) return;

    setCroppedCover(cropped);
    setShowCrop(false);
  };

  // 🔥 SAVE — PATCH hotel: new file = both; re-crop = cover_url only
  const handleSubmit = async () => {
    const slug = localStorage.getItem("restaurantId");
    if (!slug) return;

    try {
      const hotelRes = await fetch(`${API_BASE}/api/hotels/${encodeURIComponent(slug)}`);
      if (!hotelRes.ok) throw new Error("Hotel not found");
      const hotel = await hotelRes.json();

      const body: Record<string, string | null> = { cover_url: croppedCover ?? null };
      if (newFileBase64) {
        // New image file: update both original and cropped
        body.cover_original_url = newFileBase64;
      } else if (croppedCover === null) {
        // Remove: clear both
        body.cover_original_url = null;
      }
      // Re-crop only: do not send cover_original_url (leave existing)

      const res = await fetch(`${API_BASE}/api/hotels/${hotel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save cover");
      setCroppedCover("");
      window.location.href = "/owner/dashboard";
    } catch {
      // show error - for now just redirect
      window.location.href = "/owner/dashboard";
    }
  };

  // 🔥 CANCEL (ROLLBACK)
  const handleCancel = () => {
    setCroppedCover(originalCover);
    setCoverOriginalUrl(originalCoverOriginal);
    setNewFileBase64(null);
    window.location.href = "/owner/dashboard";
  };

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-white overflow-y-auto">
        <div className="px-6 pt-10 pb-24">

          {/* TITLE */}
          <h1
            className="text-black mb-12"
            style={{ fontSize: "52px", fontWeight: 600, lineHeight: "1.1" }}
          >
            Update<br />Cover Photo
          </h1>

          {/* COVER BOX */}
          <div className="mb-16">
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

                  <span className="text-[15px] font-medium text-gray-700">
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

            {/* EDIT / REMOVE */}
            {croppedCover && (
              <div className="flex justify-center gap-12 mt-6">
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

          {/* ACTION BUTTONS */}
          <div className="flex flex-col gap-4">
            <button
              onClick={handleSubmit}
              className="w-full rounded-full bg-[#0A84C1] text-white font-semibold"
              style={{ fontSize: "18px", padding: "14px" }}
            >
              Save
            </button>

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

      {/* CROP MODAL */}
      {showCrop && imageSrc && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="relative flex-1">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={4 / 3}
              cropShape="rect"
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
