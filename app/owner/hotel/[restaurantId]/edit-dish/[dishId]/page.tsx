"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Cropper from "react-easy-crop";
import { API_BASE } from "@/lib/api";

/* ---- Image helpers ---- */
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });

async function getCroppedImg(imageSrc: string, crop: any): Promise<string> {
  const image = await createImage(imageSrc);
  const MAX = 900;
  const scale = crop.width > MAX ? MAX / crop.width : 1;
  const w = Math.round(crop.width * scale);
  const h = Math.round(crop.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.78);
}

async function compressImage(base64: string, maxW = 1400): Promise<string> {
  const image = await createImage(base64);
  const scale = image.width > maxW ? maxW / image.width : 1;
  const w = Math.round(image.width * scale);
  const h = Math.round(image.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.78);
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function EditDishPage() {
  const router = useRouter();
  const params = useParams();
  const restaurantId = params?.restaurantId as string;
  const dishId = params?.dishId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Dish details
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [timingFrom, setTimingFrom] = useState("09:00");
  const [timingTo, setTimingTo] = useState("22:00");

  // Photo
  const [photoUrl, setPhotoUrl] = useState("");
  const [newPhotoSrc, setNewPhotoSrc] = useState<string | null>(null);
  const [showCrop, setShowCrop] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Video
  const [videoUrl, setVideoUrl] = useState("");

  useEffect(() => {
    if (!dishId) return;
    fetch(`${API_BASE}/api/dishes/${dishId}`)
      .then((r) => r.json())
      .then((d) => {
        setName(d.name || "");
        setPrice(String(d.price || ""));
        setQuantity(d.quantity || "");
        setDescription(d.description || "");
        setTimingFrom(d.timing_from || "09:00");
        setTimingTo(d.timing_to || "22:00");
        setPhotoUrl(d.photo_url || "/food_item_logo.png");
        setVideoUrl(d.video_url || "");
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load dish");
        setLoading(false);
      });
  }, [dishId]);

  const onCropComplete = useCallback((_: any, area: any) => {
    setCroppedAreaPixels(area);
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const raw = await fileToBase64(file);
    const compressed = await compressImage(raw);
    setNewPhotoSrc(compressed);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setShowCrop(true);
  };

  const saveCrop = async () => {
    if (!newPhotoSrc || !croppedAreaPixels) return;
    const cropped = await getCroppedImg(newPhotoSrc, croppedAreaPixels);
    setPhotoUrl(cropped);
    setShowCrop(false);
  };

  const handleSave = async () => {
    if (!name.trim()) { setError("Dish name is required"); return; }
    if (!price || isNaN(Number(price))) { setError("Valid price is required"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/dishes/${dishId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          price: Number(price),
          quantity: quantity.trim() || null,
          description: description.trim() || null,
          timing_from: timingFrom,
          timing_to: timingTo,
          photo_url: photoUrl,
          video_url: videoUrl.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      router.back();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/70">Loading dish...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-white overflow-y-auto pb-32">

        {/* HEADER */}
        <div className="px-6 pt-10 pb-4">
          <h1 className="text-black" style={{ fontSize: "42px", fontWeight: 700, lineHeight: 1.1 }}>
            Edit Dish
          </h1>
        </div>

        {/* PHOTO SECTION */}
        <div className="px-6 mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-2">Photo</p>
          <div className="relative w-full h-52 rounded-2xl overflow-hidden bg-[#E5E7EB]">
            <img src={photoUrl} alt="Dish" className="w-full h-full object-cover" />
            <label className="absolute inset-0 flex items-end justify-center pb-4 cursor-pointer">
              <span className="bg-black/60 text-white text-xs font-medium px-4 py-1.5 rounded-full">
                Change Photo
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>
        </div>

        {/* VIDEO URL SECTION */}
        <div className="px-6 mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-2">YouTube Video URL (optional)</p>
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-black outline-none focus:border-[#0A84C1]"
          />
        </div>

        {/* DIVIDER */}
        <div className="mx-6 mb-6 h-px bg-gray-100" />

        {/* DISH DETAILS */}
        <div className="px-6 space-y-4">

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Dish Name *</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Veg Biryani"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base text-black outline-none focus:border-[#0A84C1]"
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Price (₹) *</p>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              type="number"
              placeholder="e.g. 150"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base text-black outline-none focus:border-[#0A84C1]"
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Quantity / Serving Size</p>
            <input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 250g, 1 plate"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base text-black outline-none focus:border-[#0A84C1]"
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Description</p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the dish..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base text-black outline-none focus:border-[#0A84C1] resize-none"
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Available Timing</p>
            <div className="flex gap-3">
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">From</p>
                <input
                  type="time"
                  value={timingFrom}
                  onChange={(e) => setTimingFrom(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base text-black outline-none focus:border-[#0A84C1]"
                />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">To</p>
                <input
                  type="time"
                  value={timingTo}
                  onChange={(e) => setTimingTo(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base text-black outline-none focus:border-[#0A84C1]"
                />
              </div>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

        {/* BOTTOM BUTTONS */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-6 pb-8 pt-4 bg-white border-t border-gray-100 flex gap-3">
          <button
            onClick={() => router.back()}
            className="flex-1 py-3 rounded-xl border border-gray-300 text-base font-medium text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-[#0A84C1] text-white text-base font-semibold disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* CROP MODAL */}
      {showCrop && newPhotoSrc && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="relative flex-1">
            <Cropper
              image={newPhotoSrc}
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
            <button onClick={() => setShowCrop(false)} className="text-white text-lg">Cancel</button>
            <button onClick={saveCrop} className="text-white text-lg font-semibold">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
