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

  /* File storage — selected but not yet "confirmed" (Done) */
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  /* Preview — object URL for display before Done */
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  /* Confirmed URLs — set by Done, used for display + Submit (base64 data URLs) */
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  /* Full originals for Edit flow */
  const [originalLogoBase64, setOriginalLogoBase64] = useState<string | null>(null);
  const [originalCoverBase64, setOriginalCoverBase64] = useState<string | null>(null);

  const [showCrop, setShowCrop] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropType, setCropType] = useState<"logo" | "cover">("logo");
  const [hasCropArea, setHasCropArea] = useState(false);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const croppedAreaPixelsRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const cropImageSrcRef = useRef<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  let progress = 50;
  if (logoUrl) progress = 100;

  const onCropComplete = useCallback((_: unknown, area: { x: number; y: number; width: number; height: number }) => {
    croppedAreaPixelsRef.current = area;
    setHasCropArea(true);
  }, []);

  const onCropAreaChange = useCallback((_: unknown, area: { x: number; y: number; width: number; height: number }) => {
    croppedAreaPixelsRef.current = area;
    setHasCropArea(true);
  }, []);

  useEffect(() => {
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  }, [cropType]);

  const revokeObjectUrl = useCallback((url: string | null) => {
    if (url && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }, []);

  /* File select: store file, single object URL for preview + crop. No upload, no async. */
  const handleLogoFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) return;

    revokeObjectUrl(logoPreview);
    const objectUrl = URL.createObjectURL(file);
    setLogoFile(file);
    setLogoPreview(objectUrl);
    setError("");

    cropImageSrcRef.current = objectUrl;
    setCropImageSrc(objectUrl);
    setCropType("logo");
    setHasCropArea(false);
    croppedAreaPixelsRef.current = null;
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setShowCrop(true);
  }, [logoPreview, revokeObjectUrl]);

  const handleCoverFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) return;

    revokeObjectUrl(coverPreview);
    const objectUrl = URL.createObjectURL(file);
    setCoverFile(file);
    setCoverPreview(objectUrl);
    setError("");

    cropImageSrcRef.current = objectUrl;
    setCropImageSrc(objectUrl);
    setCropType("cover");
    setHasCropArea(false);
    croppedAreaPixelsRef.current = null;
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setShowCrop(true);
  }, [coverPreview, revokeObjectUrl]);

  /* Edit: open crop with full original. Requires originalBase64. */
  const openCropForEdit = useCallback((type: "logo" | "cover", fullBase64: string | null) => {
    if (!fullBase64) return;
    cropImageSrcRef.current = fullBase64;
    setCropImageSrc(fullBase64);
    setCropType(type);
    setHasCropArea(false);
    croppedAreaPixelsRef.current = null;
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setShowCrop(true);
    setError("");
  }, []);

  const handleEditLogo = useCallback(() => {
    if (originalLogoBase64) openCropForEdit("logo", originalLogoBase64);
  }, [originalLogoBase64, openCropForEdit]);

  const handleEditCover = useCallback(() => {
    if (originalCoverBase64) openCropForEdit("cover", originalCoverBase64);
  }, [originalCoverBase64, openCropForEdit]);

  /* Cancel: clear preview + file (if new upload), close modal. No upload. Edit mode: just close. */
  const handleCropCancel = useCallback(() => {
    const src = cropImageSrcRef.current;
    const isNewUpload = src?.startsWith("blob:");

    if (isNewUpload && src) revokeObjectUrl(src);
    cropImageSrcRef.current = null;
    setCropImageSrc(null);
    setShowCrop(false);
    setHasCropArea(false);
    croppedAreaPixelsRef.current = null;

    if (isNewUpload) {
      if (cropType === "logo") {
        revokeObjectUrl(logoPreview);
        setLogoPreview(null);
        setLogoFile(null);
      } else {
        revokeObjectUrl(coverPreview);
        setCoverPreview(null);
        setCoverFile(null);
      }
      if (logoInputRef.current) logoInputRef.current.value = "";
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  }, [cropType, logoPreview, coverPreview, revokeObjectUrl]);

  /* Done: close modal + confirm locally. Produce cropped base64 for display. No network upload. */
  const handleCropDone = useCallback(async () => {
    const area = croppedAreaPixelsRef.current;
    const src = cropImageSrcRef.current;
    if (!area || !src) {
      setError("Please adjust the crop area first.");
      return;
    }

    const file = cropType === "logo" ? logoFile : coverFile;
    try {
      const cropped = await getCroppedImg(src, area);
      if (!cropped) {
        setError(`Failed to process ${cropType}. Please try again.`);
        return;
      }

      let fullBase64: string | null = null;
      if (file) {
        try {
          fullBase64 = await fileToBase64(file);
        } catch {
          fullBase64 = cropped;
        }
      } else {
        fullBase64 = cropped;
      }

      if (cropType === "logo") {
        setLogoUrl(cropped);
        setOriginalLogoBase64(fullBase64);
        revokeObjectUrl(logoPreview);
        setLogoPreview(null);
        setLogoFile(null);
      } else {
        setCoverUrl(cropped);
        setOriginalCoverBase64(fullBase64);
        revokeObjectUrl(coverPreview);
        setCoverPreview(null);
        setCoverFile(null);
      }

      cropImageSrcRef.current = null;
      setCropImageSrc(null);
      setShowCrop(false);
      setHasCropArea(false);
      croppedAreaPixelsRef.current = null;
      if (logoInputRef.current) logoInputRef.current.value = "";
      if (coverInputRef.current) coverInputRef.current.value = "";
      setError("");
    } catch (err) {
      console.error("[details2] Crop error:", err);
      setError(`Failed to process ${cropType}. Please try again.`);
    }
  }, [cropType, logoFile, coverFile, logoPreview, coverPreview, revokeObjectUrl]);

  const handleRemoveLogo = useCallback(() => {
    revokeObjectUrl(logoPreview);
    setLogoPreview(null);
    setLogoFile(null);
    setLogoUrl(null);
    setOriginalLogoBase64(null);
    setError("");
  }, [logoPreview, revokeObjectUrl]);

  const handleRemoveCover = useCallback(() => {
    revokeObjectUrl(coverPreview);
    setCoverPreview(null);
    setCoverFile(null);
    setCoverUrl(null);
    setOriginalCoverBase64(null);
  }, [coverPreview, revokeObjectUrl]);

  /* Display: confirmed URL or preview */
  const displayLogo = logoUrl ?? logoPreview;
  const displayCover = coverUrl ?? coverPreview;

  const isCropDoneDisabled = !hasCropArea;
  const isSubmitDisabled = isSubmitting || !logoUrl;

  const handleSubmit = async () => {
    if (!logoUrl) {
      setError("Please add your logo first.");
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
      const createRes = await fetch(`${API_BASE}/api/hotels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: restaurantName, slug }),
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
        console.error("[details2] Hotel create error:", text);
        throw new Error(msg);
      }

      const hotel = await createRes.json();

      const patchBody: Record<string, string | null> = {
        logo_url: logoUrl,
        cover_url: coverUrl || null,
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
        const patchText = await patchRes.text();
        console.error("[details2] Hotel PATCH error:", patchRes.status, patchText);
        let patchMsg = "Failed to save logo and cover";
        try {
          const data = JSON.parse(patchText);
          if (data?.error) patchMsg = data.error;
        } catch {
          if (patchText) patchMsg = `${patchMsg}: ${patchText.slice(0, 120)}`;
        }
        hideLoader();
        setIsSubmitting(false);
        setError(patchMsg);
        return;
      }

      const gmailRaw = sessionStorage.getItem("signup_gmail");
      const passwordRaw = sessionStorage.getItem("signup_password");
      const gmail = typeof gmailRaw === "string" ? gmailRaw.trim() : "";
      const password = typeof passwordRaw === "string" ? passwordRaw.trim() : "";

      if (!gmail || !password) {
        hideLoader();
        setIsSubmitting(false);
        setError(
          gmailRaw == null || passwordRaw == null
            ? "Session expired. Please go back and re-enter your Gmail and password."
            : "Gmail and password are required. Please go back and fill them in."
        );
        return;
      }

      const ownerRes = await fetch(`${API_BASE}/api/owners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotel_id: hotel.id, gmail, password }),
      });

      sessionStorage.removeItem("signup_gmail");
      sessionStorage.removeItem("signup_password");

      if (!ownerRes.ok) {
        const errData = await ownerRes.json().catch(() => ({}));
        console.error("[details2] Owner create error:", errData);
        hideLoader();
        setIsSubmitting(false);
        setError(errData?.error || "Failed to create account. Please try again.");
        return;
      }

      localStorage.removeItem("ody_dishes");
      localStorage.removeItem("restaurantLogo");
      localStorage.removeItem("restaurantCover");
      localStorage.removeItem("restaurantSlug");
      localStorage.setItem("ody_hotel_id", String(hotel.id));
      localStorage.setItem("restaurantId", hotel.slug);
      localStorage.setItem("restaurantName", hotel.name);

      window.location.href = "/owner/success";
    } catch (err) {
      console.error("[details2] Submit error:", err);
      hideLoader();
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-white overflow-y-auto relative">
        <div className="px-6 pt-10 pb-28">

          <h1
            className="text-black mb-6"
            style={{ fontSize: "52px", fontWeight: 600, lineHeight: "1.1" }}
          >
            Set Your<br />OdyCard Look
          </h1>

          <div className="mb-16 relative">
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0A84C1] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="absolute text-sm font-medium text-gray-600" style={{ right: 0, top: "14px" }}>
              {progress}%
            </span>
          </div>

          {/* LOGO */}
          <div className="flex flex-col items-center mb-16">
            <p className="text-[18px] font-semibold text-black mb-6">Restaurant Logo</p>

            <div className="relative w-44 h-44 rounded-full bg-[#E5E7EB] flex items-center justify-center overflow-hidden">
              {displayLogo ? (
                <>
                  <img src={displayLogo} className="w-full h-full object-cover rounded-full" alt="Logo" />
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    aria-label="Upload new logo"
                  />
                </>
              ) : (
                <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                  <div className="w-16 h-16 rounded-full bg-[#0A84C1] flex items-center justify-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="30" height="30">
                      <path d="M12 3l4 4h-3v6h-2V7H8l4-4zm-7 14v2h14v-2H5z" />
                    </svg>
                  </div>
                  <span className="text-[16px] font-medium text-gray-700">Add Logo</span>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            {logoUrl && (
              <div className="flex gap-10 mt-6">
                <button onClick={handleEditLogo} className="text-[#0A84C1] text-lg font-medium">
                  Edit
                </button>
                <button onClick={handleRemoveLogo} className="text-red-500 text-lg font-medium">
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* COVER */}
          <div className="mb-16">
            <p className="text-[18px] font-semibold text-black mb-1">
              Cover Photo <span className="text-gray-400">(optional)</span>
            </p>

            <div className="relative w-full h-52 rounded-2xl bg-[#E5E7EB] flex items-center justify-center overflow-hidden">
              {displayCover ? (
                <>
                  <img src={displayCover} className="w-full h-full object-cover" alt="Cover" />
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverFileSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    aria-label="Upload new cover"
                  />
                </>
              ) : (
                <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                  <div className="w-14 h-14 rounded-full bg-[#0A84C1] flex items-center justify-center mb-3 mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="26" height="26">
                      <path d="M12 3l4 4h-3v6h-2V7H8l4-4zm-7 14v2h14v-2H5z" />
                    </svg>
                  </div>
                  <span className="text-[15px] font-medium text-gray-700">Add Cover Photo</span>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverFileSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            {coverUrl && (
              <div className="flex justify-center gap-12 mt-6">
                <button onClick={handleEditCover} className="text-[#0A84C1] text-lg font-medium">
                  Edit
                </button>
                <button onClick={handleRemoveCover} className="text-red-500 text-lg font-medium">
                  Remove
                </button>
              </div>
            )}
          </div>

          {error && (
            <p className="text-red-600 text-center mb-6 font-medium">{error}</p>
          )}
        </div>

        <div className="absolute bottom-0 left-0 w-full border-t bg-white px-6 py-4">
          <div className="flex justify-between gap-4 items-center">
            <div className="flex gap-3">
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
                disabled={isSubmitDisabled}
                className={`px-6 py-2 rounded-md text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed ${
                  isSubmitDisabled ? "bg-gray-200 text-gray-400" : "bg-[#0A84C1] text-white"
                }`}
              >
                {isSubmitting ? "Creating..." : "Submit"}
              </button>
            </div>
            <div className="flex gap-3 min-w-[140px] items-center">
              <span className="text-xs text-gray-500 whitespace-nowrap">Page 2 of 2</span>
              <ProgressBar progress={100} className="flex-1 h-[4px]" />
            </div>
          </div>
        </div>
      </div>

      {/* CROP MODAL — Done only confirms locally, Cancel clears file + preview */}
      {showCrop && cropImageSrc && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="relative flex-1">
            <Cropper
              key={cropType}
              image={cropImageSrc}
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
            <button onClick={handleCropCancel} className="text-white text-lg">
              Cancel
            </button>
            <button
              onClick={handleCropDone}
              disabled={isCropDoneDisabled}
              className="text-white text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
