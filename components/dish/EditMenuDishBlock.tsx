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

export default function EditMenuDishBlock({ dish, restaurantId, onRefresh }: EditMenuDishBlockProps) {
  const router = useRouter();
  const hasVideo = Boolean(dish.videoUrl && dish.videoUrl.trim());
  const youtubeId = dish.videoUrl ? extractYouTubeId(dish.videoUrl) : null;

  const [showHideConfirm, setShowHideConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHidden, setIsHidden] = useState(dish.isActive === false);

  const handleEdit = () => {
    if (!restaurantId) return;
    router.push(`/owner/hotel/${restaurantId}/edit-dish/${dish.id}`);
  };

  const handleHideConfirm = async () => {
    setIsLoading(true);
    try {
      await fetch(`${API_BASE}/api/dishes/${dish.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: isHidden ? true : false }),
      });
      setIsHidden(!isHidden);
      setShowHideConfirm(false);
      onRefresh?.();
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsLoading(true);
    try {
      await fetch(`${API_BASE}/api/dishes/${dish.id}`, { method: "DELETE" });
      setShowDeleteConfirm(false);
      onRefresh?.();
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={`rounded-2xl border overflow-hidden bg-white mb-6 ${isHidden ? "opacity-50" : "border-gray-200"}`}>
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
