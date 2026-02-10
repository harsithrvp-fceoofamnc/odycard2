"use client";

type DishTiming = {
  from: string;
  to: string;
};

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
  };
};

function youtubeEmbedUrl(videoId: string, autoplay: boolean, loop: boolean) {
  const params = new URLSearchParams();
  if (autoplay) params.set("autoplay", "1");
  if (loop) {
    params.set("loop", "1");
    params.set("playlist", videoId);
  }
  const qs = params.toString();
  return `https://www.youtube.com/embed/${videoId}${qs ? `?${qs}` : ""}`;
}

export default function EditMenuDishBlock({ dish }: EditMenuDishBlockProps) {
  const hasVideo = Boolean(dish.videoUrl && dish.videoUrl.trim());

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white mb-6">
      {/* MEDIA: single image or swipeable image + video (video only when swiped to; no autoplay/loop) */}
      <div className="w-full h-[180px] bg-gray-100">
        {hasVideo ? (
          <div className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
            <div className="flex-[0_0_100%] min-w-0 snap-center snap-always h-full">
              <img
                src={dish.photoUrl}
                alt={dish.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-[0_0_100%] min-w-0 snap-center snap-always h-full bg-black">
              <iframe
                title={`${dish.name} video`}
                src={youtubeEmbedUrl(dish.videoUrl!, false, false)}
                className="w-full h-full object-cover"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        ) : (
          <img
            src={dish.photoUrl}
            alt={dish.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* CONTENT */}
      <div className="p-4">
        {/* NAME + PRICE */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-black">
            {dish.name}
          </h3>
          <span className="text-lg font-semibold text-black">
            ₹{dish.price}
          </span>
        </div>

        {/* META */}
        <div className="text-sm text-gray-600 mb-2">
          {dish.quantity && <span>{dish.quantity} • </span>}
          {dish.timing.from} – {dish.timing.to}
        </div>

        {/* DESCRIPTION */}
        {dish.description && (
          <p className="text-sm text-gray-700 mb-4">
            {dish.description}
          </p>
        )}

        {/* ACTIONS */}
        <div className="flex gap-3">
          <button className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700">
            Edit
          </button>
          <button className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700">
            Hide
          </button>
          <button className="flex-1 py-2 rounded-lg border border-red-300 text-sm font-medium text-red-600">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
