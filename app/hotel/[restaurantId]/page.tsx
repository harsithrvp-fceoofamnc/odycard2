"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useParams } from "next/navigation";
import RatingModal from "@/components/RatingModal";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim() !== "") ? process.env.NEXT_PUBLIC_API_URL.trim() : "";

// Keep Render backend awake by pinging every 9 minutes
if (typeof window !== "undefined") {
  setInterval(() => {
    fetch(`${API_BASE}/`).catch(() => {});
  }, 9 * 60 * 1000);
}

/** YouTube Iframe API types (loaded via script tag). */
declare global {
  interface Window {
    YT?: typeof YT;
    onYouTubeIframeAPIReady?: () => void;
  }
}
declare const YT: {
  PlayerState: { ENDED: 0; PLAYING: 1; PAUSED: 2; BUFFERING: 3; CUED: 5 };
  Player: new (
    elementIdOrElement: string | HTMLIFrameElement,
    options?: {
      videoId?: string;
      playerVars?: Record<string, number | string>;
      events?: { onReady?: (e: { target: YTPlayer }) => void; onStateChange?: (e: { data: number; target: YTPlayer }) => void };
    }
  ) => YTPlayer;
};
interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getPlayerState: () => number;
}

const tabs = ["Menu", "Eat Later", "Favorites"];

type OdyDish = {
  id: string;
  name: string;
  price: number;
  quantity?: string | null;
  description?: string | null;
  timing: { from: string; to: string };
  photoUrl: string;
  videoUrl?: string | null;
  isVeg: boolean;
  avgRating: number;
  ratingCount: number;
  favoriteCount: number;
  eatLaterCount: number;
  menuCategoryId?: number | null;
  tags?: string[] | null;
  sort_order?: number | null;
  category?: string | null;
  comboDishIds?: string[] | null;
};

/** Extract YouTube video ID from watch URL, embed URL, or short url. */
function extractYouTubeVideoId(url: string): string | null {
  if (!url || !url.trim()) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

/** Build YouTube embed URL from video ID. Converts watch URLs via extractYouTubeVideoId. */
function buildYouTubeEmbedUrl(videoId: string): string {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    controls: "1",
    rel: "0",
    playsinline: "1",
    enablejsapi: "1",
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

/** Load YouTube Iframe API and return a promise that resolves when ready. */
let ytApiReady: Promise<void> | null = null;
function ensureYouTubeAPI(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (typeof YT !== "undefined" && YT.Player) return Promise.resolve();
  if (ytApiReady) return ytApiReady;
  ytApiReady = new Promise((resolve) => {
    const prev = (window as Window).onYouTubeIframeAPIReady;
    (window as Window).onYouTubeIframeAPIReady = () => {
      if (prev) prev();
      resolve();
    };
    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      if (typeof YT !== "undefined" && YT.Player) resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.head.appendChild(script);
  });
  return ytApiReady;
}

/** Check if URL is a direct video (MP4 etc.) — YouTube URLs use iframe instead. */
function isDirectVideoUrl(url: string): boolean {
  if (!url || !url.trim()) return false;
  return !extractYouTubeVideoId(url);
}

/** Renders a video element (muted, playsInline, no controls). Ref is managed by parent for IntersectionObserver. */
function OdyMenuVideoSlide({
  videoUrl,
  dishName,
  videoRef,
}: {
  videoUrl: string;
  dishName: string;
  videoRef: React.Ref<HTMLVideoElement | null>;
}) {
  return (
    <div className="absolute inset-0">
      <video
        ref={videoRef}
        src={videoUrl}
        muted
        playsInline
        preload="auto"
        loop
        className="w-full h-full object-cover"
        title={dishName}
      />
    </div>
  );
}

/** YouTube player container: 16:9 responsive aspect-ratio, no fixed heights, no black bars. */
const YouTubePlayerWrapper = forwardRef<
  { restartAndPlay: () => void },
  {
    videoId: string;
    dishName: string;
    photoUrl: string;
    dishIndex: number;
    isActive: boolean;
    onVideoEnd: () => void;
    registerPlayer: (index: number, player: YTPlayer) => void;
    unregisterPlayer: (index: number) => void;
  }
>(function YouTubePlayerWrapper(
  { videoId, dishName, photoUrl, dishIndex, isActive, onVideoEnd, registerPlayer, unregisterPlayer },
  ref
) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);

  const restartAndPlay = useCallback(() => {
    const p = playerRef.current;
    if (p && typeof p.seekTo === "function" && typeof p.playVideo === "function") {
      try {
        p.seekTo(0, true);
        p.playVideo();
      } catch {
        // ignore
      }
    }
  }, []);

  useImperativeHandle(ref, () => ({ restartAndPlay }), [restartAndPlay]);

  const onIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    ensureYouTubeAPI().then(() => {
      if (typeof YT === "undefined" || !YT.Player) return;
      new YT.Player(iframe, {
        events: {
          onReady(e) {
            playerRef.current = e.target;
            registerPlayer(dishIndex, e.target);
            try {
              e.target.playVideo();
            } catch {
              // ignore
            }
          },
          onStateChange(event) {
            if (event.data === 0) onVideoEnd();
          },
        },
      });
    });
  }, [dishIndex, onVideoEnd, registerPlayer]);

  useEffect(() => {
    if (!isActive) return;
    return () => {
      try {
        if (playerRef.current && typeof playerRef.current.pauseVideo === "function") {
          playerRef.current.pauseVideo();
        }
      } catch {
        // ignore
      }
      unregisterPlayer(dishIndex);
      playerRef.current = null;
    };
  }, [isActive, dishIndex, unregisterPlayer]);

  if (!isActive) {
    return (
      <div className="absolute inset-0">
        <img
          src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
          alt={dishName}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = photoUrl || "/food_item_logo.png";
          }}
        />
      </div>
    );
  }

  const embedUrl = buildYouTubeEmbedUrl(videoId);

  return (
    <div className="absolute inset-0">
      <iframe
        ref={iframeRef}
        src={embedUrl}
        title={dishName}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
        style={{ border: "none" }}
        onLoad={onIframeLoad}
      />
    </div>
  );
});

/** Photo-only dish block for Favorites/Eat Later tabs (no video, no carousel, no autoplay). */
function PhotoOnlyDishBlock({ dish, allDishes = [] }: { dish: OdyDish; allDishes?: OdyDish[] }) {
  const isCombo = dish.category === "combo";
  const comboPhoto1 = isCombo && dish.comboDishIds?.[0]
    ? (allDishes.find(d => d.id === dish.comboDishIds![0])?.photoUrl ?? "/food_item_logo.png")
    : null;
  const comboPhoto2 = isCombo && dish.comboDishIds?.[1]
    ? (allDishes.find(d => d.id === dish.comboDishIds![1])?.photoUrl ?? "/food_item_logo.png")
    : null;

  return (
    <div className="w-full rounded-xl sm:rounded-2xl overflow-hidden bg-white border border-gray-200 mb-4 sm:mb-6">
      {isCombo ? (
        <div className="w-full aspect-[4/3] flex">
          <div className="flex-1 overflow-hidden">
            <img
              src={comboPhoto1 ?? "/food_item_logo.png"}
              alt={`${dish.name} item 1`}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="w-[2px] bg-white shrink-0" />
          <div className="flex-1 overflow-hidden">
            <img
              src={comboPhoto2 ?? "/food_item_logo.png"}
              alt={`${dish.name} item 2`}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      ) : (
        <div className="aspect-[4/3] w-full bg-gray-100">
          <img
            src={dish.photoUrl || "/food_item_logo.png"}
            alt={dish.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-3 sm:p-4">
        <div className="flex justify-between items-start mb-1.5 sm:mb-2 gap-2">
          <p className="text-base sm:text-lg font-semibold text-black flex-1 min-w-0 break-words">{dish.name}</p>
          <p className="text-base sm:text-lg font-semibold text-black shrink-0">₹{dish.price}</p>
        </div>
        {dish.description ? (
          <p className="text-xs sm:text-sm text-gray-700 mt-1.5 sm:mt-2">{dish.description}</p>
        ) : null}
      </div>
    </div>
  );
}

/** Wraps the dish media carousel with video (YouTube iframe or MP4) and photo slides. */
function DishMediaCarousel({
  dish,
  dishIndex,
  containerRef,
  videoRef,
  isActive,
  isYouTube,
  registerPlayer,
  unregisterPlayer,
}: {
  dish: OdyDish;
  dishIndex: number;
  containerRef: React.Ref<HTMLDivElement | null>;
  videoRef: React.Ref<HTMLVideoElement | null>;
  isActive: boolean;
  isYouTube: boolean;
  registerPlayer: (index: number, player: YTPlayer) => void;
  unregisterPlayer: (index: number) => void;
}) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const videoSlideRef = useRef<HTMLDivElement>(null);
  const youtubeSlideRef = useRef<{ restartAndPlay: () => void }>(null);

  const handleVideoEnd = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const from = el.scrollLeft;
    const to = el.clientWidth;
    if (from >= to) return;
    const duration = 800; // 700-900ms for premium feel
    const startTime = performance.now();

    function easeInOutCubic(t: number): number {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function tick(now: number) {
      const carousel = carouselRef.current;
      if (!carousel) return;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(progress);
      carousel.scrollLeft = from + (to - from) * eased;
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (!isYouTube) return;
    const slide = videoSlideRef.current;
    const carousel = carouselRef.current;
    if (!slide || !carousel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.8) {
            youtubeSlideRef.current?.restartAndPlay();
            break;
          }
        }
      },
      { root: carousel, threshold: [0.8] }
    );
    observer.observe(slide);
    return () => observer.disconnect();
  }, [isYouTube]);

  const youtubeId = isYouTube ? extractYouTubeVideoId(dish.videoUrl!.trim()) : null;

  return (
    <div
      ref={carouselRef}
      className="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
    >
      <div
        ref={(el) => {
          (videoSlideRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
          if (typeof containerRef === "function") containerRef(el);
          else if (containerRef) (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
        className="flex-[0_0_100%] min-w-0 h-full snap-center snap-always relative shrink-0"
      >
        {/* absolute fill — guarantees zero gap at all edges */}
        <div className="absolute inset-0">
          {isYouTube && youtubeId ? (
            <YouTubePlayerWrapper
              ref={youtubeSlideRef}
              videoId={youtubeId}
              dishName={dish.name}
              photoUrl={dish.photoUrl || "/food_item_logo.png"}
              dishIndex={dishIndex}
              isActive={isActive}
              onVideoEnd={handleVideoEnd}
              registerPlayer={registerPlayer}
              unregisterPlayer={unregisterPlayer}
            />
          ) : (
            <OdyMenuVideoSlide
              videoUrl={dish.videoUrl!.trim()}
              dishName={dish.name}
              videoRef={videoRef}
            />
          )}
        </div>
      </div>
      <div className="flex-[0_0_100%] min-w-0 h-full snap-center snap-always shrink-0">
        <img
          src={dish.photoUrl || "/food_item_logo.png"}
          alt={dish.name}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}

/** Format counts: exact if multiple of 5 (or <5), else floor to nearest 5 + "+", K for 1000+, caps 10K+ */
function formatCount(n: number): string {
  if (n >= 10_000) return "10K+";
  if (n >= 1000) {
    const k = Math.floor(n / 100) / 10; // e.g. 1500 → 1.5
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  if (n < 5) return String(n);
  if (n % 5 === 0) return String(n);
  return `${Math.floor(n / 5) * 5}+`;
}

/** Returns true if current time falls within the dish's from→to timing window. */
function isWithinTiming(timing: { from: string; to: string }): boolean {
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [fh, fm] = timing.from.split(":").map(Number);
  const [th, tm] = timing.to.split(":").map(Number);
  const from = fh * 60 + fm;
  const to = th * 60 + tm;
  if (from === to) return true; // same time = all day
  if (from < to) return cur >= from && cur <= to;
  return cur >= from || cur <= to; // overnight window e.g. 22:00 → 02:00
}

/** Map backend dish row to frontend OdyDish format */
function mapDishFromApi(row: {
  id: number | string;
  name: string;
  price: number;
  quantity?: string | null;
  description?: string | null;
  timing_from?: string;
  timing_to?: string;
  photo_url?: string | null;
  video_url?: string | null;
  sort_order?: number | null;
  [k: string]: unknown;
}): OdyDish {
  return {
    id: String(row.id),
    name: row.name,
    price: Number(row.price),
    quantity: row.quantity ?? null,
    description: row.description ?? null,
    timing: {
      from: row.timing_from ?? "09:00",
      to: row.timing_to ?? "22:00",
    },
    photoUrl: row.photo_url || "/food_item_logo.png",
    videoUrl: row.video_url ?? null,
    isVeg: row.is_veg !== false,
    avgRating: Number(row.avg_rating) || 0,
    ratingCount: Number(row.rating_count) || 0,
    favoriteCount: Number(row.favorite_count) || 0,
    eatLaterCount: Number(row.eat_later_count) || 0,
    menuCategoryId: row.menu_category_id ? Number(row.menu_category_id) : null,
    tags: Array.isArray(row.tags) ? row.tags : null,
    sort_order: row.sort_order ?? null,
    category: (row.category as string) ?? null,
    comboDishIds: Array.isArray(row.combo_dish_ids) ? (row.combo_dish_ids as string[]) : null,
  };
}

export default function HotelHomePage() {
  const params = useParams();
  const restaurantId = params?.restaurantId as string | undefined;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // Ticks every minute so timing-based dish visibility updates automatically
  const [, setTimeTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTimeTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const [activeTab, setActiveTab] = useState(0);
  const [logo, setLogo] = useState("");
  const [cover, setCover] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [menuTagFilters, setMenuTagFilters] = useState<string[]>([]);
  const [hotelId, setHotelId] = useState<string | null>(null);
  const isFetchingRef = useRef(false);
  const [favorites, setFavorites] = useState<OdyDish[]>([]);
  const [eatLater, setEatLater] = useState<OdyDish[]>([]);
  const [favoriteCounts, setFavoriteCounts] = useState<Record<string, number>>({});
  const [eatLaterCounts, setEatLaterCounts] = useState<Record<string, number>>({});
  // Menu tab — categories + dishes per category
  const [menuCategories, setMenuCategories] = useState<{ id: number; name: string }[]>([]);
  const [menuDishes, setMenuDishes] = useState<Record<number, OdyDish[]>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  // One ref per tab panel — used to reset scroll to top when switching tabs
  const tabScrollRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);

  // 🔐 AUTH STATES
  const [showPopup, setShowPopup] = useState(false);
  const [mode, setMode] = useState<"register" | "login">("register");
  const [step, setStep] = useState<"phone" | "otp" | "name">("phone");

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [name, setName] = useState("");

  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const [user, setUser] = useState<{ phone: string; name: string } | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [search, setSearch] = useState("");
  // Tracks which dish ids have expanded descriptions in Menu tab
  const [expandedDescs, setExpandedDescs] = useState<Set<string>>(new Set());
  const toggleDesc = (id: string) =>
    setExpandedDescs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  
  // Eat Later Confirmation Popup
  const [showEatLaterPopup, setShowEatLaterPopup] = useState(false);
  const [pendingEatLaterDish, setPendingEatLaterDish] = useState<OdyDish | null>(null);


  /** Fetch dishes for a hotel.
   *  lite=true skips photo_url — used by polls to avoid sending base64 images on every tick. */
  const fetchDishes = useCallback(async (hId: string, lite = false): Promise<OdyDish[] | null> => {
    if (isFetchingRef.current) return null;
    isFetchingRef.current = true;
    try {
      const url = `${API_BASE}/api/dishes?hotel_id=${encodeURIComponent(hId)}&_t=${Date.now()}${lite ? "&lite=true" : ""}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return null;
      const rows = await res.json();
      return rows.map(mapDishFromApi);
    } catch {
      return null;
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // Initial load: hotel + dishes
  useEffect(() => {
    if (!restaurantId || typeof restaurantId !== "string") return;
    const slug: string = restaurantId;
    let cancelled = false;

    async function loadHotelAndDishes() {
      try {
        const hotelRes = await fetch(`${API_BASE}/api/hotels/${encodeURIComponent(slug)}`);
        if (!hotelRes.ok) {
          if (!cancelled) setIsLoading(false);
          return;
        }
        const hotel = await hotelRes.json();
        if (cancelled) return;

        setLogo(hotel.logo_url || "");
        setCover(hotel.cover_url || "");
        setRestaurantName(hotel.name || "");
        setHotelId(String(hotel.id));

        // Fetch dishes + categories in parallel to save one round-trip
        const hId = String(hotel.id);
        const [newDishes, cats] = await Promise.all([
          fetchDishes(hId),
          fetch(`${API_BASE}/api/categories?hotel_id=${encodeURIComponent(hId)}`)
            .then(r => r.ok ? r.json() : [])
            .catch(() => []),
        ]);

        if (cancelled) return;
        if (newDishes === null) return;

        // Group menu dishes by category for Menu tab
        const byCategory: Record<number, OdyDish[]> = {};
        for (const d of newDishes) {
          if (d.menuCategoryId) {
            if (!byCategory[d.menuCategoryId]) byCategory[d.menuCategoryId] = [];
            byCategory[d.menuCategoryId].push(d);
          }
        }
        if (!cancelled) {
          setMenuDishes(byCategory);
          setMenuCategories(Array.isArray(cats) ? cats : []);
        }

      } catch (err) {
        if (!cancelled) {
          console.error("Load hotel/dishes error:", err);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadHotelAndDishes();
    return () => {
      cancelled = true;
    };
  }, [restaurantId, fetchDishes]);

  // Polling: refetch dishes + hotel every 4s
  useEffect(() => {
    if (!hotelId || !restaurantId) return;

    const poll = async () => {
      // Refresh menu dishes from server (lite=true skips photo_url to save bandwidth)
      const newDishes = await fetchDishes(hotelId, true);
      if (newDishes === null) return;

      setMenuDishes(prev => {
        const byCategory: Record<number, OdyDish[]> = {};
        // Build a flat lookup of existing dishes so we can preserve real photo URLs
        const existingFlat: Record<string, OdyDish> = {};
        for (const catDishes of Object.values(prev)) {
          for (const d of catDishes) existingFlat[d.id] = d;
        }
        for (const d of newDishes) {
          if (d.menuCategoryId) {
            if (!byCategory[d.menuCategoryId]) byCategory[d.menuCategoryId] = [];
            // lite fetch returns fallback for photoUrl — keep the real URL from state
            const existing = existingFlat[d.id];
            byCategory[d.menuCategoryId].push({
              ...d,
              photoUrl: existing?.photoUrl ?? d.photoUrl,
            });
          }
        }
        return byCategory;
      });
    };

    const interval = setInterval(poll, 15000);

    // Also poll immediately when tab becomes visible again (mobile browser wake)
    const onVisible = () => { if (document.visibilityState === "visible") poll(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [hotelId, restaurantId, fetchDishes]);

  // Load user auth on mount
  useEffect(() => {
    const saved = localStorage.getItem("odyUser");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  // Load user-specific favorites/eat-later/ratings whenever user or restaurant changes
  useEffect(() => {
    if (!restaurantId || typeof restaurantId !== "string") return;

    if (!user) {
      setFavorites([]);
      setEatLater([]);
      setDishRatings({});
      return;
    }

    const uid = user.phone;
    try {
      const favs = localStorage.getItem(`ody_favorites_${uid}_${restaurantId}`);
      setFavorites(favs ? JSON.parse(favs) : []);
    } catch { setFavorites([]); }

    try {
      const later = localStorage.getItem(`ody_eat_later_${uid}_${restaurantId}`);
      setEatLater(later ? JSON.parse(later) : []);
    } catch { setEatLater([]); }

    try {
      const ratings = localStorage.getItem(`ody_dish_ratings_${uid}_${restaurantId}`);
      setDishRatings(ratings ? JSON.parse(ratings) : {});
    } catch { setDishRatings({}); }
  }, [restaurantId, user]);

  // 🔥 TIMER FOR OTP
  useEffect(() => {
    if (!showPopup || step !== "otp") return;

    setTimer(30);
    setCanResend(false);

    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step, showPopup]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollLeft, clientWidth } = containerRef.current;
    const index = Math.round(scrollLeft / clientWidth);
    setActiveTab(index);
  };

  const goToTab = (index: number) => {
    if (!containerRef.current) return;
    containerRef.current.scrollTo({
      left: containerRef.current.clientWidth * index,
      behavior: "smooth",
    });
    setActiveTab(index);
  };


  // Helper: update a single dish field in menu-category dishes
  const patchDish = useCallback((dishId: string, patch: Partial<OdyDish>) => {
    setMenuDishes(prev => {
      const next: Record<number, OdyDish[]> = {};
      for (const catId of Object.keys(prev)) {
        next[Number(catId)] = prev[Number(catId)].map(d => d.id === dishId ? { ...d, ...patch } : d);
      }
      return next;
    });
  }, []);

  // Toggle favorites (per-hotel scoped)
  const toggleFavorite = (dish: OdyDish) => {
    if (!user) { setMode("register"); setShowPopup(true); return; }
    if (!restaurantId) return;
    const favKey = `ody_favorites_${user.phone}_${restaurantId}`;
    const isFav = favorites.some((d) => d.id === dish.id);
    const action = isFav ? "remove" : "add";
    const updated = isFav ? favorites.filter((d) => d.id !== dish.id) : [...favorites, dish];
    setFavorites(updated);
    localStorage.setItem(favKey, JSON.stringify(updated));
    // Optimistic update — works for both Ody Menu and Menu tab dishes
    patchDish(dish.id, { favoriteCount: isFav ? Math.max(0, dish.favoriteCount - 1) : dish.favoriteCount + 1 });
    // Sync with backend and correct if needed
    fetch(`${API_BASE}/api/dishes/${dish.id}/favorite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    }).then(r => r.json()).then(data => {
      if (data.favorite_count !== undefined) {
        patchDish(dish.id, { favoriteCount: data.favorite_count });
      }
    }).catch(() => {});
  };

  // Toggle eat later (per-hotel scoped)
  const toggleEatLater = (dish: OdyDish) => {
    if (!user) { setMode("register"); setShowPopup(true); return; }
    if (!restaurantId) return;
    const isInList = eatLater.some((d) => d.id === dish.id);
    if (isInList) {
      const updated = eatLater.filter((d) => d.id !== dish.id);
      setEatLater(updated);
      localStorage.setItem(`ody_eat_later_${user.phone}_${restaurantId}`, JSON.stringify(updated));
      // Optimistic update — works for both tabs
      patchDish(dish.id, { eatLaterCount: Math.max(0, dish.eatLaterCount - 1) });
      fetch(`${API_BASE}/api/dishes/${dish.id}/eat-later`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove" }),
      }).then(r => r.json()).then(data => {
        if (data.eat_later_count !== undefined) {
          patchDish(dish.id, { eatLaterCount: data.eat_later_count });
        }
      }).catch(() => {});
    } else {
      setPendingEatLaterDish(dish);
      setShowEatLaterPopup(true);
    }
  };

  // Confirm eat later action (per-hotel scoped)
  const confirmEatLater = () => {
    setShowEatLaterPopup(false);
    const dish = pendingEatLaterDish;
    setPendingEatLaterDish(null);
    if (!dish || !user || !restaurantId) return;
    const updated = [...eatLater, dish];
    setEatLater(updated);
    localStorage.setItem(`ody_eat_later_${user.phone}_${restaurantId}`, JSON.stringify(updated));
    // Optimistic update — works for both tabs
    patchDish(dish.id, { eatLaterCount: dish.eatLaterCount + 1 });
    fetch(`${API_BASE}/api/dishes/${dish.id}/eat-later`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add" }),
    }).then(r => r.json()).then(data => {
      if (data.eat_later_count !== undefined) {
        patchDish(dish.id, { eatLaterCount: data.eat_later_count });
      }
    }).catch(() => {});
  };

  // Cancel eat later action
  const cancelEatLater = () => {
    setShowEatLaterPopup(false);
    setPendingEatLaterDish(null);
  };

  // Hotel rating state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Dish rating state
  const [dishRatingPopup, setDishRatingPopup] = useState<{ dish: OdyDish; stars: number; step: "stars" | "reason"; reason: string; isEdit: boolean; otherText: string } | null>(null);
  const [dishRatings, setDishRatings] = useState<Record<string, number>>({});

  const openDishRating = (dish: OdyDish) => {
    if (!user) { setMode("register"); setShowPopup(true); return; }
    const existingStars = dishRatings[dish.id] || 0;
    setDishRatingPopup({ dish, stars: existingStars, step: "stars", reason: "", isEdit: existingStars > 0, otherText: "" });
  };

  const removeReview = () => {
    if (!dishRatingPopup) return;
    const { dish } = dishRatingPopup;
    const oldStars = dishRatings[dish.id] || 0;
    const updated = { ...dishRatings };
    delete updated[dish.id];
    setDishRatings(updated);
    localStorage.setItem(`ody_dish_ratings_${user?.phone || "guest"}_${restaurantId}`, JSON.stringify(updated));
    setDishRatingPopup(null);
    // Optimistic update — works for both tabs
    const removeNewCount = Math.max(0, dish.ratingCount - 1);
    const removeNewAvg = removeNewCount === 0 ? 0 : parseFloat(((dish.avgRating * dish.ratingCount - oldStars) / removeNewCount).toFixed(1));
    patchDish(dish.id, { avgRating: removeNewAvg, ratingCount: removeNewCount });
    fetch(`${API_BASE}/api/ratings/remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dish_id: Number(dish.id), visitor_name: user?.name || null }),
    }).catch(() => {});
  };

  const submitDishRating = async () => {
    if (!dishRatingPopup || dishRatingPopup.stars === 0) return;
    if (dishRatingPopup.stars <= 3 && dishRatingPopup.step === "stars") {
      setDishRatingPopup({ ...dishRatingPopup, step: "reason" });
      return;
    }
    const { dish, stars, reason, otherText } = dishRatingPopup;
    const finalReason = reason === "Other" ? (otherText.trim() || "Other") : reason;

    // Save locally so button shows user's rating
    const updated = { ...dishRatings, [dish.id]: stars };
    setDishRatings(updated);
    localStorage.setItem(`ody_dish_ratings_${user?.phone || "guest"}_${restaurantId}`, JSON.stringify(updated));
    setDishRatingPopup(null);

    // Optimistic update — works for both Ody Menu and Menu tab dishes
    const submitNewCount = dish.ratingCount + 1;
    const submitNewAvg = parseFloat(((dish.avgRating * dish.ratingCount + stars) / submitNewCount).toFixed(1));
    patchDish(dish.id, { avgRating: submitNewAvg, ratingCount: submitNewCount });

    // Post to backend and correct with real avg/count
    try {
      const ratingRes = await fetch(`${API_BASE}/api/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotel_id: Number(hotelId),
          dish_id: Number(dish.id),
          stars,
          low_rating_reason: stars <= 3 ? finalReason : null,
          visitor_name: user?.name || null,
        }),
      });
      const ratingData = await ratingRes.json();
      patchDish(dish.id, {
        avgRating: ratingData.avg_rating ?? submitNewAvg,
        ratingCount: ratingData.rating_count ?? submitNewCount,
      });
    } catch {
      // silently fail — local rating is already saved
    }
  };

  // Check if dish is favorited
  const isFavorite = (dishId: string) => {
    return favorites.some((d) => d.id === dishId);
  };

  // Check if dish is in eat later
  const isInEatLater = (dishId: string) => {
    return eatLater.some((d) => d.id === dishId);
  };

  // Menu tab tag filter toggle — sliding window for regular tags, diet tags are sticky
  const toggleMenuTagFilter = (tag: string) => {
    setMenuTagFilters(prev => {
      const isVeg = tag === "Veg Only";
      const isNonVeg = tag === "Non-Veg Only";
      const isDiet = isVeg || isNonVeg;

      // Toggle off if already selected
      if (prev.includes(tag)) return prev.filter(t => t !== tag);

      // Handle mutual exclusivity for diet tags
      let updated = [...prev];
      if (isVeg) updated = updated.filter(t => t !== "Non-Veg Only");
      if (isNonVeg) updated = updated.filter(t => t !== "Veg Only");

      // Diet tags are sticky — just add, no sliding window
      if (isDiet) return [...updated, tag];

      // Regular tag: sliding window of max 2
      const regularInOrder = updated.filter(t => t !== "Veg Only" && t !== "Non-Veg Only");
      if (regularInOrder.length < 2) return [...updated, tag];

      // Drop the oldest regular tag, add the new one
      const oldestRegular = regularInOrder[0];
      return [...updated.filter(t => t !== oldestRegular), tag];
    });
  };

  // Dishes matching current menu tag filters (OR logic — any selected tag matches), sorted expensive first
  const menuFilteredDishes = menuTagFilters.length === 0 ? [] : (() => {
    const all = Object.values(menuDishes).flat();
    return all.filter(dish =>
      menuTagFilters.some(f => {
        if (f === "Veg Only") return dish.isVeg;
        if (f === "Non-Veg Only") return !dish.isVeg;
        return Array.isArray(dish.tags) && dish.tags.includes(f);
      })
    ).sort((a, b) => b.price - a.price);
  })();

  // 🔥 NAME DISPLAY
  const getDisplayName = () => {
    if (!user) return "";
    const first = user.name.trim().split(" ")[0];
    if (first.length >= 15) return first.slice(0, 15) + "...";
    return first;
  };
  
  

  // 🔥 OTP INPUT HANDLER
  const handleOtpChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const otpComplete = otp.every((d) => d !== "");

  // 🔥 FINISH REGISTER
  const finishRegister = () => {
    const first = name.trim().split(" ")[0];
    const data = { phone, name: first };

    const db = JSON.parse(localStorage.getItem("odyUsers") || "[]");
    db.push(data);
    localStorage.setItem("odyUsers", JSON.stringify(db));
    localStorage.setItem("odyUser", JSON.stringify(data));

    setUser(data);
    closePopup();
  };

  // 🔥 LOGIN VERIFY
  const verifyLogin = () => {
    const db = JSON.parse(localStorage.getItem("odyUsers") || "[]");
    const found = db.find((u: any) => u.phone === phone);

    if (!found) {
      alert("User not found. Please register first.");
      return;
    }

    localStorage.setItem("odyUser", JSON.stringify(found));
    setUser(found);
    closePopup();
  };

  const closePopup = () => {
    setShowPopup(false);
    setStep("phone");
    setPhone("");
    setOtp(["", "", "", ""]);
    setName("");
  };

  const logout = () => {
    localStorage.removeItem("odyUser");
    setUser(null);
    setShowProfile(false);
  };

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="relative w-full max-w-md bg-[#1c1c1c] flex flex-col overflow-hidden" style={{ height: "100dvh" }}>

        {/* MENU UPDATE OVERLAY */}
        {isRefreshing && (
          <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ color: "#fff", fontSize: 18, fontWeight: 600, letterSpacing: 1 }}>Updating Menu...</p>
          </div>
        )}


        {/* 🔥 TOP TASK BAR */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md z-[999]">
          <div className="h-12 sm:h-14 pl-4 pr-0 sm:pl-5 flex items-center justify-between bg-black/60 backdrop-blur-md">

            {!user ? (
              <button
                onClick={() => {
                  setMode("register");
                  setShowPopup(true);
                }}
                className="text-white text-base sm:text-lg font-semibold"
              >
                Register
              </button>
            ) : (
              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center gap-1.5 sm:gap-2 text-white text-base sm:text-lg font-semibold max-w-36 sm:max-w-44 truncate"
              >
                <img src="/User.png" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full invert" alt="" />
                <span className="truncate">Hi, {getDisplayName()}</span>
              </button>
            )}

            <img src="/logo.png" className="w-16 h-16 sm:w-20 sm:h-20 object-contain" alt="" />
          </div>
        </div>

        {/* 🔥 HORIZONTAL SWIPE AREA — each tab has the cover at the top of its own scroll container */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 flex w-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
        >

          {/* MENU */}
          <div ref={(el) => { tabScrollRefs.current[0] = el; }} className="min-w-full snap-center snap-always h-full overflow-y-auto no-scrollbar">
            {/* Cover */}
            <div className="relative w-full h-[50vh] overflow-hidden shrink-0">
              {cover ? (
                <>
                  <img src={cover} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-black/30" />
                </>
              ) : (
                <div className="w-full h-full bg-[#1c1c1c]" />
              )}
              <div className="absolute inset-0 flex items-center justify-center -translate-y-6">
                {logo && (
                  <div className="w-44 h-44 rounded-full overflow-hidden shadow-[0_35px_70px_rgba(0,0,0,0.85)]">
                    <img src={logo} className="w-full h-full object-cover" alt="" />
                  </div>
                )}
              </div>
            </div>

            {/* SEARCH + TAGS HEADER */}
            <div className="px-4 sm:px-6 pt-4 sm:pt-5">
              {/* Search bar */}
              <div className="w-full rounded-full bg-white flex items-center px-4 sm:px-5 shadow-md gap-3 h-12 sm:h-14">
                <img src="/search.png" className="w-5 h-5 sm:w-6 sm:h-6 opacity-60" alt="" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search in ${restaurantName || "this restaurant"}`}
                  className="flex-1 bg-transparent outline-none text-base sm:text-lg text-black placeholder-gray-400 min-w-0"
                />
              </div>
            </div>

            {/* TAG ISLAND — live computed from menu dishes */}
            {(() => {
              const allMenuDishes = Object.values(menuDishes).flat();
              const tagSet = new Set<string>();
              if (allMenuDishes.some(d => d.isVeg)) tagSet.add("Veg Only");
              if (allMenuDishes.some(d => !d.isVeg)) tagSet.add("Non-Veg Only");
              for (const d of allMenuDishes) {
                if (Array.isArray(d.tags)) d.tags.forEach(t => tagSet.add(t));
              }
              const tagList = Array.from(tagSet);
              return (
                <div className="mt-7 w-full">
                  <div className="h-px bg-white/20 w-full" />
                  <div className="min-h-[64px] w-full overflow-x-auto no-scrollbar">
                    {tagList.length === 0 ? (
                      <div className="h-16 w-full" />
                    ) : (
                      <div className="flex flex-nowrap gap-2 py-3 px-4 sm:px-6 min-w-max">
                        {tagList.map(tag => {
                          const isActive = menuTagFilters.includes(tag);
                          return (
                            <button
                              key={tag}
                              onClick={() => toggleMenuTagFilter(tag)}
                              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold"
                              style={{
                                background: isActive ? "#ffffff" : "linear-gradient(to right, #0D5F8E 0%, #14AADA 100%)",
                                color: isActive ? "#0A84C1" : "#ffffff",
                                border: isActive ? "2px solid #0A84C1" : "none",
                                WebkitAppearance: "none",
                                appearance: "none",
                              }}
                            >
                              {isActive && (
                                <svg viewBox="0 0 24 24" style={{ width: 13, height: 13 }} fill="none" stroke="#0A84C1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              )}
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="h-px bg-white/20 w-full" />
                </div>
              );
            })()}

            {/* CATEGORY CONTENT */}
            <div className="px-2 sm:px-3 pt-6 sm:pt-8">
            {(() => {
              // Compute which blocks to render: filtered (1 unnamed block) or normal categories
              type Block = { name: string | null; dishes: OdyDish[] };
              let blocks: Block[];

              if (menuTagFilters.length > 0) {
                blocks = [{ name: null, dishes: menuFilteredDishes.filter(d => isWithinTiming(d.timing)) }];
              } else {
                const catsWithDishes = menuCategories.filter(cat =>
                  (menuDishes[cat.id] ?? []).filter(d => isWithinTiming(d.timing)).length > 0
                );
                if (catsWithDishes.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-start pt-16 sm:pt-20">
                      <p className="text-white/70 text-lg sm:text-xl font-medium">Coming soon</p>
                    </div>
                  );
                }
                // No filters active — respect owner's custom sort_order
                blocks = catsWithDishes.map(cat => ({
                  name: cat.name,
                  dishes: (menuDishes[cat.id] ?? []).filter(d => isWithinTiming(d.timing)),
                }));
              }

              if (blocks.every(b => b.dishes.length === 0)) {
                return (
                  <div className="flex flex-col items-center justify-start pt-16 sm:pt-20">
                    <p className="text-white/70 text-lg sm:text-xl font-medium">No dishes found</p>
                  </div>
                );
              }

              return (
                <div className="mb-6 sm:mb-8">
                  {blocks.map((block, blockIdx) => (
                    <div key={blockIdx} className="mb-10">
                      {block.name ? (
                        <h2 className="text-white text-xl sm:text-2xl font-bold mb-3 px-1">{block.name}</h2>
                      ) : null}
                      <div className="bg-[#DADDE4] rounded-[28px] px-3 py-4 w-full">
                        {block.dishes.map((dish) => {
                          // Resolve combo component dish photos from all menu dishes
                          const allMenuDishesFlat = Object.values(menuDishes).flat();
                          const comboPhoto1 = dish.comboDishIds?.[0]
                            ? (allMenuDishesFlat.find((d) => d.id === dish.comboDishIds![0])?.photoUrl ?? "/food_item_logo.png")
                            : null;
                          const comboPhoto2 = dish.comboDishIds?.[1]
                            ? (allMenuDishesFlat.find((d) => d.id === dish.comboDishIds![1])?.photoUrl ?? "/food_item_logo.png")
                            : null;

                          return (
                          <div
                            key={dish.id}
                            className="w-full rounded-xl sm:rounded-2xl bg-white border border-gray-200 mb-4 last:mb-0 shadow-md"
                          >
                            {/* Media */}
                            {dish.category === "combo" ? (
                              /* Combo: two images 50/50 side by side */
                              <div className="w-full aspect-[4/3] flex rounded-t-xl sm:rounded-t-2xl overflow-hidden">
                                <div className="flex-1 h-full overflow-hidden">
                                  <img
                                    src={comboPhoto1 ?? "/food_item_logo.png"}
                                    alt={`${dish.name} item 1`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="w-[2px] bg-white shrink-0" />
                                <div className="flex-1 h-full overflow-hidden">
                                  <img
                                    src={comboPhoto2 ?? "/food_item_logo.png"}
                                    alt={`${dish.name} item 2`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </div>
                            ) : (
                            <div className={`w-full bg-black relative overflow-hidden rounded-t-xl sm:rounded-t-2xl ${extractYouTubeVideoId(dish.videoUrl ?? "") ? "aspect-video" : "aspect-[4/3]"}`}>
                              {dish.videoUrl && dish.videoUrl.trim() ? (
                                <DishMediaCarousel
                                  dish={dish}
                                  dishIndex={0}
                                  containerRef={() => {}}
                                  videoRef={() => {}}
                                  isActive={false}
                                  isYouTube={!!extractYouTubeVideoId(dish.videoUrl)}
                                  registerPlayer={() => {}}
                                  unregisterPlayer={() => {}}
                                />
                              ) : (
                                <img
                                  src={dish.photoUrl || "/food_item_logo.png"}
                                  alt={dish.name}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            )}
                            {/* Info */}
                            <div className="p-3 sm:p-4 rounded-b-xl sm:rounded-b-2xl bg-white">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex flex-col flex-1 min-w-0">
                                  <div className="flex items-start gap-2">
                                    <div className={`w-5 h-5 mt-0.5 shrink-0 border-2 rounded-sm flex items-center justify-center ${dish.isVeg ? "border-green-600" : "border-red-600"}`}>
                                      <div className={`w-2.5 h-2.5 rounded-full ${dish.isVeg ? "bg-green-600" : "bg-red-600"}`} />
                                    </div>
                                    <p className="text-base sm:text-lg font-semibold text-black leading-tight flex-1 min-w-0 break-words">{dish.name}</p>
                                  </div>
                                  <p className="text-base sm:text-lg font-semibold text-black mt-0.5 ml-7">₹{dish.price}</p>
                                  {(dish.quantity || dish.timing) ? (
                                    <p className="text-xs text-gray-400 mt-1">
                                      {[dish.quantity || null, dish.timing ? `${dish.timing.from} – ${dish.timing.to}` : null].filter(Boolean).join(" • ")}
                                    </p>
                                  ) : null}
                                  {/* Pill badges */}
                                  {(dish.ratingCount > 0 && dish.avgRating >= 3) || dish.favoriteCount > 0 || dish.eatLaterCount > 0 ? (
                                    <div className="flex flex-nowrap gap-1 mt-2">
                                      {dish.ratingCount > 0 && dish.avgRating >= 3 ? (
                                        <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold text-white shrink-0" style={{ backgroundColor: "#111" }}>
                                          <span style={{ color: "#FBBF24" }}>★</span>
                                          {dish.avgRating.toFixed(1)}({formatCount(dish.ratingCount)})
                                        </span>
                                      ) : null}
                                      {dish.favoriteCount > 0 ? (
                                        <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold text-white shrink-0" style={{ backgroundColor: "#ef4444" }}>
                                          <svg viewBox="0 0 24 24" style={{ width: 11, height: 11 }} fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                                          </svg>
                                          {formatCount(dish.favoriteCount)} liked
                                        </span>
                                      ) : null}
                                      {dish.eatLaterCount > 0 ? (
                                        <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold text-white shrink-0" style={{ backgroundColor: "#3b82f6" }}>
                                          <svg viewBox="0 0 24 24" style={{ width: 11, height: 11 }} fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                                          </svg>
                                          {formatCount(dish.eatLaterCount)} saved
                                        </span>
                                      ) : null}
                                    </div>
                                  ) : null}
                                  {/* Description */}
                                  {dish.description ? (
                                    <div className="mt-2">
                                      <p className={`text-xs sm:text-sm text-gray-500 leading-snug ${expandedDescs.has(dish.id) ? "" : "line-clamp-2"}`}>
                                        {dish.description}
                                      </p>
                                      {dish.description.length > 80 ? (
                                        <button onClick={() => toggleDesc(dish.id)} className="text-xs text-[#0A84C1] font-medium mt-0.5">
                                          {expandedDescs.has(dish.id) ? "less" : "...more"}
                                        </button>
                                      ) : null}
                                    </div>
                                  ) : null}
                                  {/* Review button */}
                                  <button
                                    onClick={() => openDishRating(dish)}
                                    className="mt-2 self-start flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-300 text-xs text-gray-500 font-medium"
                                  >
                                    <span>+</span>
                                    <span>{dishRatings[dish.id] ? "Edit review" : "Review"}</span>
                                    {dishRatings[dish.id] ? (
                                      <span style={{ color: "#FBBF24" }}>{"★".repeat(dishRatings[dish.id])}</span>
                                    ) : null}
                                  </button>
                                </div>
                                {/* Like + Save */}
                                <div className="flex items-center gap-4 shrink-0">
                                  <button onClick={() => toggleFavorite(dish)} className="flex flex-col items-center gap-0.5">
                                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill={isFavorite(dish.id) ? "#ef4444" : "none"} stroke={isFavorite(dish.id) ? "#ef4444" : "#374151"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                                    </svg>
                                    <span className="text-xs font-medium text-gray-600">Like</span>
                                  </button>
                                  <button onClick={() => toggleEatLater(dish)} className="flex flex-col items-center gap-0.5">
                                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke={isInEatLater(dish.id) ? "#3b82f6" : "#374151"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="12" r="10"/>
                                      <polyline points="12 6 12 12 16 14"/>
                                    </svg>
                                    <span className="text-xs font-medium text-gray-600">Save</span>
                                  </button>
                                </div>
                              </div>
                              {/* Dish tags — full width */}
                              {dish.tags && dish.tags.length > 0 ? (
                                <div className="flex flex-wrap gap-2 mt-2 px-1">
                                  {dish.tags.map(tag => (
                                    <span key={tag} className="px-3 py-1 rounded-full text-sm font-semibold text-white" style={{ background: "linear-gradient(to right, #0D5F8E 0%, #14AADA 100%)" }}>
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
            </div>
          </div>

          {/* EAT LATER */}
          <div ref={(el) => { tabScrollRefs.current[1] = el; }} className="min-w-full snap-center snap-always h-full overflow-y-auto no-scrollbar">
            {/* Header */}
            <div className="pt-16 pb-6 px-5 flex flex-col items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-white/80" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <h1 className="text-white text-2xl font-bold mt-1">Eat Later</h1>
              <p className="text-white/40 text-sm">Dishes you want to try</p>
              {user && eatLater.length > 0 && (
                <p className="text-white/50 text-sm font-medium mt-1">{eatLater.length} {eatLater.length === 1 ? "dish" : "dishes"} saved</p>
              )}
            </div>
            <div className="h-px bg-white/10 mx-5" />
            {/* Content */}
            <div className="px-4 pt-5 pb-32">
            {!user ? (
              <div className="flex flex-col items-center justify-start gap-4 sm:gap-5 px-4 pt-12">
                <img src="/User.png" className="w-14 h-14 opacity-60 invert" alt="" />
                <p className="text-white/60 text-center text-sm sm:text-base">Register or Log in to use Eat Later</p>
                <div className="flex gap-3">
                  <button onClick={() => { setMode("register"); setShowPopup(true); }} className="px-5 py-2.5 rounded-full bg-[#0A84C1] text-white text-sm font-semibold">Register</button>
                  <button onClick={() => { setMode("login"); setShowPopup(true); }} className="px-5 py-2.5 rounded-full bg-white text-[#0A84C1] text-sm font-semibold">Log In</button>
                </div>
              </div>
            ) : eatLater.length === 0 ? (
              <div className="flex flex-col items-center justify-start pt-12 px-4 gap-3">
                <svg viewBox="0 0 24 24" className="w-12 h-12 opacity-30" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <p className="text-white/50 text-base text-center">Nothing saved yet</p>
                <p className="text-white/30 text-sm text-center">Tap the clock icon on any dish to save it here</p>
              </div>
            ) : (
              <div className="mb-6">
                {eatLater.map((dish) => (
                  <PhotoOnlyDishBlock key={dish.id} dish={dish} allDishes={Object.values(menuDishes).flat()} />
                ))}
              </div>
            )}
            </div>
          </div>

          {/* FAVORITES */}
          <div ref={(el) => { tabScrollRefs.current[2] = el; }} className="min-w-full snap-center snap-always h-full overflow-y-auto no-scrollbar">
            {/* Header */}
            <div className="pt-16 pb-6 px-5 flex flex-col items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-white/80" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <h1 className="text-white text-2xl font-bold mt-1">Favorites</h1>
              <p className="text-white/40 text-sm">Dishes you love</p>
              {user && favorites.length > 0 && (
                <p className="text-white/50 text-sm font-medium mt-1">{favorites.length} {favorites.length === 1 ? "dish" : "dishes"} liked</p>
              )}
            </div>
            <div className="h-px bg-white/10 mx-5" />
            {/* Content */}
            <div className="px-4 pt-5 pb-32">
            {!user ? (
              <div className="flex flex-col items-center justify-start gap-4 sm:gap-5 px-4 pt-12">
                <img src="/User.png" className="w-14 h-14 opacity-60 invert" alt="" />
                <p className="text-white/60 text-center text-sm sm:text-base">Register or Log in to save Favorites</p>
                <div className="flex gap-3">
                  <button onClick={() => { setMode("register"); setShowPopup(true); }} className="px-5 py-2.5 rounded-full bg-[#0A84C1] text-white text-sm font-semibold">Register</button>
                  <button onClick={() => { setMode("login"); setShowPopup(true); }} className="px-5 py-2.5 rounded-full bg-white text-[#0A84C1] text-sm font-semibold">Log In</button>
                </div>
              </div>
            ) : favorites.length === 0 ? (
              <div className="flex flex-col items-center justify-start pt-12 px-4 gap-3">
                <svg viewBox="0 0 24 24" className="w-12 h-12 opacity-30" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <p className="text-white/50 text-base text-center">No favorites yet</p>
                <p className="text-white/30 text-sm text-center">Tap the heart on any dish to save it here</p>
              </div>
            ) : (
              <div className="mb-6">
                {favorites.map((dish) => (
                  <PhotoOnlyDishBlock key={dish.id} dish={dish} allDishes={Object.values(menuDishes).flat()} />
                ))}
              </div>
            )}
            </div>
          </div>

        </div>{/* end swipe container */}

        {/* 🔥 BOTTOM BAR — floating pill nav + Ask Ody */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex items-center gap-2.5 px-4 pb-5 pt-2 z-50 pointer-events-none">
          {/* Pill navigation — flex-1 takes all remaining space, tabs split equally */}
          <div className="flex-1 min-w-0 flex items-center bg-black/75 backdrop-blur-md rounded-full p-1.5 border border-white/15 shadow-xl pointer-events-auto">
            {tabs.map((tab, index) => (
              <button
                key={tab}
                onClick={() => goToTab(index)}
                className={`flex-1 py-3.5 rounded-full text-base font-semibold whitespace-nowrap transition text-center ${
                  activeTab === index
                    ? "bg-white text-black shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          {/* Ask Ody — compact to give pill more room */}
          <button className="shrink-0 flex items-center gap-1.5 bg-black/75 backdrop-blur-md text-white px-3 py-3.5 rounded-full border border-white/15 shadow-xl pointer-events-auto">
            <img src="/ody-face.png" className="w-7 h-7 rounded-full" alt="Ody" />
            <span className="text-sm font-semibold">Ask Ody</span>
          </button>
        </div>

        {/* 🔥 PROFILE POPUP */}
        {showProfile && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[3000]">
    <div className="bg-[#1c1c1c] rounded-xl p-4 sm:p-6 w-full max-w-xs mx-4 space-y-4 sm:space-y-5">

      {/* Title */}
      <p className="text-center text-white font-medium text-base sm:text-lg">
        Do you want to Log out?
      </p>

      {/* Log out button (BLUE) */}
      <button
        onClick={logout}
        className="w-full py-3 rounded-full bg-[#0A84C1] text-white font-medium"
      >
        Log out
      </button>

      {/* Close button (WHITE bg, BLUE text) */}
      <button
        onClick={() => setShowProfile(false)}
        className="w-full py-3 rounded-full bg-white text-[#0A84C1] font-medium"
      >
        Close
      </button>

    </div>
  </div>
)}


        {/* 🔥 AUTH POPUP */}
        {showPopup && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[2000]">
            <div className="bg-[#1c1c1c] w-full max-w-sm mx-4 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white space-y-4 sm:space-y-6 relative">

              <button
                onClick={closePopup}
                className="absolute top-3 right-3 text-white text-lg"
              >
                ✕
              </button>

              {step === "phone" && (
                <>
                  <h2 className="text-base sm:text-lg font-semibold text-center">
                  {mode === "login" ? "Log in" : "Register"}
                  </h2>

                  <input
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder="Enter your phone number"
                    className="w-full p-2.5 sm:p-3 rounded bg-black border border-white/30 text-white text-base"
                  />

                  <button
                    disabled={phone.length !== 10}
                    onClick={() => setStep("otp")}
                    className={`w-full py-2.5 sm:py-3 rounded-full text-sm sm:text-base ${
                      phone.length === 10
                        ? "bg-[#0A84C1]"
                        : "bg-gray-600"
                    }`}
                  >
                    Send OTP
                  </button>
                </>
              )}

              {step === "otp" && (
                <>
                  <h2 className="text-base sm:text-lg font-semibold text-center">
                    Enter OTP
                  </h2>

                  <div className="flex justify-center gap-2 sm:gap-3">
                    {otp.map((d, i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        value={d}
                        onChange={(e) =>
                          handleOtpChange(e.target.value, i)
                        }
                        maxLength={1}
                        className="w-10 h-10 sm:w-12 sm:h-12 text-center text-base sm:text-lg bg-black border border-white/30 rounded"
                      />
                    ))}
                  </div>

                  <button
                    disabled={!otpComplete}
                    onClick={() =>
                      mode === "register" ? setStep("name") : verifyLogin()
                    }
                    className={`w-full py-2.5 sm:py-3 rounded-full text-sm sm:text-base ${
                      otpComplete ? "bg-[#0A84C1]" : "bg-gray-600"
                    }`}
                  >
                    Verify
                  </button>

                  {!canResend ? (
                    <p className="text-center text-gray-400">
                      Resend OTP in {timer}s
                    </p>
                  ) : (
                    <button
                      onClick={() => setStep("otp")}
                      className="w-full text-sm text-[#0A84C1]"
                    >
                      Resend OTP
                    </button>
                  )}
                </>
              )}

              {step === "name" && (
                <>
                  <h2 className="text-base sm:text-lg font-semibold text-center">
                    Enter Your Name
                  </h2>

                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full p-2.5 sm:p-3 rounded bg-black border border-white/30 text-white text-base"
                  />

                  <button
                    disabled={name.length < 2}
                    onClick={finishRegister}
                    className={`w-full py-2.5 sm:py-3 rounded-full text-sm sm:text-base ${
                      name.length >= 2 ? "bg-[#0A84C1]" : "bg-gray-600"
                    }`}
                  >
                    Finish
                  </button>
                </>
              )}

            </div>
          </div>
        )}


        {/* ⭐ RATING MODAL */}
        {showRatingModal && hotelId && (
          <RatingModal
            hotelId={Number(hotelId)}
            hotelName={restaurantName}
            onClose={() => setShowRatingModal(false)}
            onSuccess={() => {
              setShowRatingModal(false);
              setRatingSubmitted(true);
            }}
          />
        )}

        {/* 🔥 EAT LATER CONFIRMATION POPUP */}
        {showEatLaterPopup && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[2000]">
            <div className="bg-[#1c1c1c] w-full max-w-xs mx-4 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-white space-y-3 sm:space-y-4">
              <div className="flex flex-col items-center space-y-2 sm:space-y-3">
                <h2 className="text-sm sm:text-base font-semibold text-center">
                  Save to Eat Later?
                </h2>
                <p className="text-gray-400 text-xs text-center">
                  This dish will be saved to your Eat Later list
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={cancelEatLater}
                  className="flex-1 py-2.5 rounded-full bg-gray-700 text-white font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmEatLater}
                  className="flex-1 py-2.5 rounded-full bg-[#0A84C1] text-white font-medium text-sm"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}

      {/* DISH RATING POPUP */}
      {dishRatingPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-[2000]">
          <div className="w-full max-w-md bg-white rounded-t-3xl px-6 pt-5 pb-10">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5" />

            {dishRatingPopup.step === "stars" ? (
              <>
                <h2 className="text-black text-lg font-semibold mb-1">{dishRatingPopup.isEdit ? "Edit review" : "Rate this dish"}</h2>
                <p className="text-gray-500 text-sm mb-5">{dishRatingPopup.dish.name}</p>
                <div className="flex justify-center gap-3 mb-4">
                  {[1,2,3,4,5].map(s => (
                    <button
                      key={s}
                      onClick={() => setDishRatingPopup({ ...dishRatingPopup, stars: s })}
                      style={{ fontSize: 48, color: s <= dishRatingPopup.stars ? "#FBBF24" : "#E5E7EB", lineHeight: 1 }}
                    >★</button>
                  ))}
                </div>
                {dishRatingPopup.stars > 0 && (
                  <p className="text-center text-gray-600 text-sm mb-5 font-medium">
                    {["","Poor 😞","Fair 😐","Good 🙂","Great 😊","Excellent 🤩"][dishRatingPopup.stars]}
                  </p>
                )}
                <button
                  onClick={submitDishRating}
                  disabled={dishRatingPopup.stars === 0}
                  className="w-full py-3.5 rounded-2xl bg-[#0A84C1] text-white font-semibold text-base disabled:opacity-40 mb-3"
                >
                  {dishRatingPopup.stars > 0 && dishRatingPopup.stars <= 3 ? "Next" : "Submit"}
                </button>
              </>
            ) : (
              <>
                <h2 className="text-black text-lg font-semibold mb-1">What could be better?</h2>
                <p className="text-gray-500 text-sm mb-5">{dishRatingPopup.dish.name}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {["Taste","Portion size","Presentation","Too spicy","Too bland","Cold","Overpriced","Other"].map(r => (
                    <button
                      key={r}
                      onClick={() => setDishRatingPopup({ ...dishRatingPopup, reason: r, otherText: r !== "Other" ? "" : dishRatingPopup.otherText })}
                      className={`px-4 py-2 rounded-full text-sm border transition ${dishRatingPopup.reason === r ? "bg-red-100 border-red-400 text-red-700 font-medium" : "bg-white border-gray-200 text-gray-600"}`}
                    >{r}</button>
                  ))}
                </div>
                {dishRatingPopup.reason === "Other" && (
                  <textarea
                    autoFocus
                    value={dishRatingPopup.otherText}
                    onChange={e => setDishRatingPopup({ ...dishRatingPopup, otherText: e.target.value })}
                    placeholder="Tell us what went wrong..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:border-blue-400 mb-3"
                  />
                )}
                <button
                  onClick={submitDishRating}
                  disabled={!dishRatingPopup.reason || (dishRatingPopup.reason === "Other" && !dishRatingPopup.otherText.trim())}
                  className="w-full py-3.5 rounded-2xl bg-[#0A84C1] text-white font-semibold text-base disabled:opacity-40 mb-3"
                >Submit</button>
              </>
            )}

            <button
              onClick={() => setDishRatingPopup(null)}
              className="w-full py-3 rounded-2xl bg-gray-100 text-gray-700 font-medium text-sm mb-2"
            >Cancel</button>
            {dishRatingPopup.isEdit && (
              <button
                onClick={removeReview}
                className="w-full py-3 rounded-2xl text-red-500 font-medium text-sm"
              >Remove review</button>
            )}
          </div>
        </div>
      )}

      </div>
    </div>
  );
}