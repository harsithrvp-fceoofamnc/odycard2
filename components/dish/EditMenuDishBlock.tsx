"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

type DishTiming = { from: string; to: string };

type EditMenuDishBlockProps = {
  dish: {
    id: string;
    name: string;
    price: number;
    quantity?: string | null;
    description?: string | null;
    timing: DishTiming;
    photoUrl: string;
    videoUrl?: string | null;
    isActive?: boolean;
  };
  restaurantId?: string;
  onRefresh?: () => void;
};

function youtubeEmbedUrl(videoId: string) {
  return `https://www.youtube.com/embed/${videoId}`;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function isOutsideTiming(from: string, to: string): boolean {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const [fh, fm] = from.split(":").map(Number);
  const [th, tm] = to.split(":").map(Number);
  const fromMins = fh * 60 + fm;
  const toMins = th * 60 + tm;
  if (fromMins <= toMins) {
    return nowMins < fromMins || nowMins > toMins;
  } else {
    // overnight (e.g. 22:00 – 02:00)
    return nowMins > toMins && nowMins < fromMins;
  }
}

export default function EditMenuDishBlock({ dish, restaurantId, onRefresh }: EditMenuDishBlockProps) {
  const router = useRouter();
  const hasVideo = Boolean(dish.videoUrl && dish.videoUrl.trim());
  const youtubeId = dish.videoUrl ? extractYouTubeId(dish.videoUrl) : null;

  const [showHideConfirm, setShowHideConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHidden, setIsHidden] = useState(dish.isActive === false);
  const [isDeleted, setIsDeleted] = useState(false);

  const outsideTiming = isOutsideTiming(dish.timing.from, dish.timing.to);
  const showHiddenBadge = isHidden || outsideTiming;

  const handleEdit = () => {
    if (!restaurantId) return;
    router.push(`/owner/hotel/${restaurantId}/edit-dish/${dish.id}`);
  };

  const handleHideConfirm = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/dishes/${dish.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: isHidden }), // true = unhide, false = hide
      });
      if (res.ok) {
        // Just toggle local state — keep dish visible to owner (greyed out)
        // Customer page will detect the change via polling and show buffer screen
        setIsHidden(!isHidden);
        setShowHideConfirm(false);
        // Do NOT call onRefresh — that would re-fetch and lose hidden dishes from owner view
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    // Immediately remove from UI
    setShowDeleteConfirm(false);
    setIsDeleted(true);
    // Fire API in background
    fetch(`${API_BASE}/api/dishes/${dish.id}`, { method: "DELETE" }).catch(() => {});
  };

  if (isDeleted) return null;

  return (
    <>
      <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white mb-6">
        {/* Hidden badge for owner */}
        {showHiddenBadge && (
          <div className="bg-gray-800 text-white text-xs font-semibold text-center py-1 tracking-wide">
            {outsideTiming && !isHidden ? "HIDDEN FROM CUSTOMERS (OUTSIDE TIMING)" : "HIDDEN FROM CUSTOMERS"}
          </div>
        )}
        {/* MEDIA */}
        <div className="w-full h-[180px] bg-gray-100">
          {hasVideo && youtubeId ? (
            <div className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
              <div className="flex-[0_0_100%] min-w-0 snap-center snap-always h-full">
                <img src={dish.photoUrl} alt={dish.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-[0_0_100%] min-w-0 snap-center snap-always h-full bg-black">
                <iframe
                  title={`${dish.name} video`}
                  src={youtubeEmbedUrl(youtubeId)}
                  className="w-full h-full"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          ) : (
            <img src={dish.photoUrl} alt={dish.name} className="w-full h-full object-cover" />
          )}
        </div>

        {/* CONTENT */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-black">{dish.name}</h3>
            <span className="text-lg font-semibold text-black">₹{dish.price}</span>
          </div>
          <div className="text-sm text-gray-600 mb-2">
            {dish.quantity && <span>{dish.quantity} • </span>}
            {dish.timing.from} – {dish.timing.to}
          </div>
          {dish.description && (
            <p className="text-sm text-gray-700 mb-4">{dish.description}</p>
          )}

          {/* COUNTS */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2 opacity-50 pointer-events-none">
              <img src="/heart.png" alt="Favorites" className="w-5 h-5" />
              <span className="text-sm text-gray-600">0</span>
            </div>
            <div className="flex items-center gap-2 opacity-50 pointer-events-none">
              <img src="/eat_later.png" alt="Eat Later" className="w-5 h-5" />
              <span className="text-sm text-gray-600">0</span>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-3">
            <button
              onClick={handleEdit}
              className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 active:bg-gray-50"
            >
              Edit
            </button>
            <button
              onClick={() => setShowHideConfirm(true)}
              className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 active:bg-gray-50"
            >
              {isHidden ? "Unhide" : "Hide"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-1 py-2 rounded-lg border border-red-300 text-sm font-medium text-red-600 active:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* HIDE CONFIRMATION POPUP */}
      {showHideConfirm && (
        <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-semibold text-black mb-2">
              {isHidden ? "Unhide dish?" : "Hide dish?"}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {isHidden
                ? `"${dish.name}" will be visible to customers again.`
                : `"${dish.name}" will be hidden from customers but not deleted.`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowHideConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleHideConfirm}
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-xl bg-[#0A84C1] text-white text-sm font-semibold disabled:opacity-50"
              >
                {isLoading ? "Saving..." : isHidden ? "Unhide" : "Hide"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION POPUP */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-semibold text-black mb-2">Delete dish?</h2>
            <p className="text-sm text-gray-500 mb-6">
              "{dish.name}" will be permanently removed from the menu.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold disabled:opacity-50"
              >
                {isLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
