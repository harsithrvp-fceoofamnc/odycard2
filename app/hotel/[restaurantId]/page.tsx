"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: { onReady?: (event: { target: YTPlayer }) => void };
        }
      ) => YTPlayer;
      PlayerState?: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  destroy: () => void;
}

const tabs = ["Ody Menu", "Menu", "Eat Later", "Favorites"];

const filters = [
  "Veg Only",
  "Non-Veg Only",
  "Must Try",
  "Best Selling",
  "New Arrival",
  "Kid's Favorite",
  "Couple's Favorite",
  "Chef's Special",
  "High Protein",
  "Hot & Spicy",
];

type OdyDish = {
  id: string;
  name: string;
  price: number;
  quantity?: string | null;
  description?: string | null;
  timing: { from: string; to: string };
  photoUrl: string;
  videoUrl?: string | null;
};

/** Global registry of all active YouTube players on Default Menu page - ensures only one plays at a time. */
const activePlayers = new Set<YTPlayer>();

/** Currently playing player (only one allowed at a time). */
let currentlyPlayingPlayer: YTPlayer | null = null;

/** Lock to prevent race conditions when multiple videos try to play simultaneously. */
let isPlayingLock = false;

/** Pauses ALL players immediately. Used to ensure only one plays at a time. */
function pauseAllPlayers() {
  activePlayers.forEach((player) => {
    try {
      player.pauseVideo();
    } catch {
      // ignore
    }
  });
  currentlyPlayingPlayer = null;
}

/** Pauses all players except the specified one, then plays that one. Ensures only one video plays at a time. */
function playOnlyThisPlayer(player: YTPlayer) {
  // Prevent multiple simultaneous calls
  if (isPlayingLock) {
    // If lock is active, still pause this player to be safe
    try {
      player.pauseVideo();
    } catch {
      // ignore
    }
    return;
  }
  isPlayingLock = true;
  
  // Step 1: Pause ALL players first (including currently playing one)
  pauseAllPlayers();
  
  // Step 2: Use requestAnimationFrame to ensure pause commands are processed before play
  requestAnimationFrame(() => {
    try {
      // Step 3: Double-check - pause all again (defense against race conditions)
      pauseAllPlayers();
      
      // Step 4: Small delay to ensure all pause commands are processed
      setTimeout(() => {
        try {
          // Step 5: Final check - pause all one more time
          pauseAllPlayers();
          
          // Step 6: Now play only this player
          player.playVideo();
          currentlyPlayingPlayer = player;
        } catch {
          // ignore
        } finally {
          isPlayingLock = false;
        }
      }, 100);
    } catch {
      isPlayingLock = false;
    }
  });
}

/** Loads the YouTube IFrame API script once and resolves when ready. */
function loadYouTubeAPI(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  return new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      if (window.YT?.Player) resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true;
    s.onload = () => {
      if (window.YT?.Player) resolve();
    };
    document.head.appendChild(s);
  });
}

/** Uses YouTube IFrame API to explicitly pause when card is out of view and play when visible; avoids black screen and background playback. */
function OdyMenuVideoSlide({
  videoId,
  dishName,
  carouselRoot,
}: {
  videoId: string;
  dishName: string;
  carouselRoot: HTMLDivElement | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const playerDivId = useId().replace(/:/g, "");
  const [inViewport, setInViewport] = useState(false);
  const [inCarouselView, setInCarouselView] = useState(false);

  // Viewport: card is visible on screen
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setInViewport(e.isIntersecting),
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Carousel: video slide is the active slide
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !carouselRoot) {
      setInCarouselView(false);
      return;
    }
    const obs = new IntersectionObserver(
      ([e]) => setInCarouselView(e.isIntersecting),
      { root: carouselRoot, threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [carouselRoot]);

  // Create YouTube player once when container and API are ready
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !videoId) return;
    let cancelled = false;
    loadYouTubeAPI().then(() => {
      if (cancelled || !window.YT?.Player) return;
      const el = document.getElementById(playerDivId);
      if (!el) return;
      try {
        const player = new window.YT.Player(playerDivId, {
          videoId,
          playerVars: {
            autoplay: 0,
            mute: 1,
            loop: 1,
            playlist: videoId,
            rel: 0,
            modestbranding: 1,
          },
          events: {
            onReady: (e) => {
              if (!cancelled) {
                const p = e.target as unknown as YTPlayer;
                playerRef.current = p;
                activePlayers.add(p);
              }
            },
          },
        });
        if (player && typeof (player as unknown as YTPlayer).pauseVideo === "function") {
          const p = player as unknown as YTPlayer;
          playerRef.current = p;
          activePlayers.add(p);
        }
      } catch {
        // ignore
      }
    });
    return () => {
      cancelled = true;
      if (playerRef.current) {
        const p = playerRef.current;
        // Pause before removing
        try {
          p.pauseVideo();
        } catch {
          // ignore
        }
        // Remove from registry
        activePlayers.delete(p);
        if (currentlyPlayingPlayer === p) {
          currentlyPlayingPlayer = null;
        }
        // Destroy player
        if (p.destroy) {
          try {
            p.destroy();
          } catch {
            // ignore
          }
        }
        playerRef.current = null;
      }
    };
  }, [videoId, playerDivId]);

  // Explicitly pause when out of view, play when in view
  // CRITICAL: When playing, pause ALL other videos FIRST to ensure only one plays at a time
  const shouldPlay = inViewport && inCarouselView;
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    
    if (shouldPlay) {
      // Use centralized function that ensures only one plays at a time
      playOnlyThisPlayer(player);
    } else {
      // When this player should not play, pause it
      try {
        player.pauseVideo();
        if (currentlyPlayingPlayer === player) {
          currentlyPlayingPlayer = null;
        }
      } catch {
        // ignore
      }
    }
  }, [shouldPlay]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-48 bg-black">
      <div
        id={playerDivId}
        className="w-full h-full min-h-48"
        title={dishName}
      />
    </div>
  );
}

/** Photo-only dish block for Favorites/Eat Later tabs (no video, no carousel, no autoplay). */
function PhotoOnlyDishBlock({ dish }: { dish: OdyDish }) {
  return (
    <div className="w-full rounded-xl sm:rounded-2xl overflow-hidden bg-white border border-gray-200 mb-4 sm:mb-6">
      <div className="aspect-[4/3] w-full bg-gray-100">
        <img
          src={dish.photoUrl || "/food_item_logo.png"}
          alt={dish.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-3 sm:p-4">
        <div className="flex justify-between items-start mb-1.5 sm:mb-2">
          <p className="text-base sm:text-lg font-semibold text-black">{dish.name}</p>
          <p className="text-base sm:text-lg font-semibold text-black">₹{dish.price}</p>
        </div>
        {dish.description ? (
          <p className="text-xs sm:text-sm text-gray-700 mt-1.5 sm:mt-2">{dish.description}</p>
        ) : null}
      </div>
    </div>
  );
}

/** Wraps the dish media carousel and provides carousel root ref to OdyMenuVideoSlide for visibility detection. */
function DishMediaCarousel({
  dish,
}: {
  dish: OdyDish;
}) {
  const [carouselEl, setCarouselEl] = useState<HTMLDivElement | null>(null);
  return (
    <div
      ref={setCarouselEl}
      className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
    >
      <div className="flex-[0_0_100%] min-w-0 h-full snap-center snap-always bg-black">
        <OdyMenuVideoSlide
          carouselRoot={carouselEl}
          videoId={dish.videoUrl!.trim()}
          dishName={dish.name}
        />
      </div>
      <div className="flex-[0_0_100%] min-w-0 h-full snap-center snap-always">
        <img
          src={dish.photoUrl || "/food_item_logo.png"}
          alt={dish.name}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
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
  };
}

export default function HotelHomePage() {
  const params = useParams();
  const restaurantId = params?.restaurantId as string | undefined;

  const [activeTab, setActiveTab] = useState(0);
  const [logo, setLogo] = useState("");
  const [cover, setCover] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [dishesLoadError, setDishesLoadError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [dishes, setDishes] = useState<OdyDish[]>([]);
  const [favorites, setFavorites] = useState<OdyDish[]>([]);
  const [eatLater, setEatLater] = useState<OdyDish[]>([]);
  const [favoriteCounts, setFavoriteCounts] = useState<Record<string, number>>({});
  const [eatLaterCounts, setEatLaterCounts] = useState<Record<string, number>>({});
  const containerRef = useRef<HTMLDivElement>(null);

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
  
  // Eat Later Confirmation Popup
  const [showEatLaterPopup, setShowEatLaterPopup] = useState(false);
  const [pendingEatLaterDish, setPendingEatLaterDish] = useState<OdyDish | null>(null);


  // Load hotel (logo, cover, name) and dishes from backend API
  useEffect(() => {
    if (!restaurantId || typeof restaurantId !== "string") return;
    const slug: string = restaurantId;

    let cancelled = false;

    async function loadHotelAndDishes() {
      try {
        const hotelRes = await fetch(`${API_BASE}/api/hotels/${encodeURIComponent(slug)}`);
        if (!hotelRes.ok) {
          if (hotelRes.status === 404) {
            setDishesLoadError("Hotel not found");
          } else {
            setDishesLoadError("Failed to load menu");
          }
          return;
        }
        const hotel = await hotelRes.json();

        if (cancelled) return;
        setLogo(hotel.logo_url || "");
        setCover(hotel.cover_url || "");
        setRestaurantName(hotel.name || "");

        const hotelId = hotel.id;
        const dishesRes = await fetch(`${API_BASE}/api/dishes?hotel_id=${encodeURIComponent(hotelId)}`);
        if (!dishesRes.ok) {
          setDishesLoadError("Failed to load dishes");
          return;
        }
        const rows = await dishesRes.json();

        if (cancelled) return;
        setDishes(rows.map(mapDishFromApi));
        setDishesLoadError(null);
      } catch (err) {
        if (!cancelled) {
          console.error("Load hotel/dishes error:", err);
          setDishesLoadError("Failed to load menu");
        }
      }
    }

    loadHotelAndDishes();
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  // Load user auth and favorites/eat-later from localStorage (per-hotel scoped)
  useEffect(() => {
    const saved = localStorage.getItem("odyUser");
    if (saved) setUser(JSON.parse(saved));

    if (!restaurantId || typeof restaurantId !== "string") return;

    const favKey = `ody_favorites_${restaurantId}`;
    const laterKey = `ody_eat_later_${restaurantId}`;
    const favCountsKey = `ody_dish_favorite_counts_${restaurantId}`;
    const laterCountsKey = `ody_dish_eat_later_counts_${restaurantId}`;

    try {
      const favs = localStorage.getItem(favKey);
      setFavorites(favs ? JSON.parse(favs) : []);
    } catch {
      setFavorites([]);
    }

    try {
      const later = localStorage.getItem(laterKey);
      setEatLater(later ? JSON.parse(later) : []);
    } catch {
      setEatLater([]);
    }

    try {
      const favCounts = localStorage.getItem(favCountsKey);
      setFavoriteCounts(favCounts ? JSON.parse(favCounts) : {});
    } catch {
      setFavoriteCounts({});
    }

    try {
      const laterCounts = localStorage.getItem(laterCountsKey);
      setEatLaterCounts(laterCounts ? JSON.parse(laterCounts) : {});
    } catch {
      setEatLaterCounts({});
    }
  }, [restaurantId]);

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

  // Toggle favorites (per-hotel scoped)
  const toggleFavorite = (dish: OdyDish) => {
    if (!user || !restaurantId) return;
    const favKey = `ody_favorites_${restaurantId}`;
    const favCountsKey = `ody_dish_favorite_counts_${restaurantId}`;
    const isFavorite = favorites.some((d) => d.id === dish.id);
    let updated: OdyDish[];
    if (isFavorite) {
      updated = favorites.filter((d) => d.id !== dish.id);
      const newCounts = { ...favoriteCounts };
      newCounts[dish.id] = Math.max(0, (newCounts[dish.id] || 0) - 1);
      setFavoriteCounts(newCounts);
      localStorage.setItem(favCountsKey, JSON.stringify(newCounts));
    } else {
      updated = [...favorites, dish];
      const newCounts = { ...favoriteCounts };
      newCounts[dish.id] = (newCounts[dish.id] || 0) + 1;
      setFavoriteCounts(newCounts);
      localStorage.setItem(favCountsKey, JSON.stringify(newCounts));
    }
    setFavorites(updated);
    localStorage.setItem(favKey, JSON.stringify(updated));
  };

  // Toggle eat later (per-hotel scoped)
  const toggleEatLater = (dish: OdyDish) => {
    if (!user || !restaurantId) return;
    const laterKey = `ody_eat_later_${restaurantId}`;
    const laterCountsKey = `ody_dish_eat_later_counts_${restaurantId}`;
    const isInList = eatLater.some((d) => d.id === dish.id);
    if (isInList) {
      const updated = eatLater.filter((d) => d.id !== dish.id);
      const newCounts = { ...eatLaterCounts };
      newCounts[dish.id] = Math.max(0, (newCounts[dish.id] || 0) - 1);
      setEatLaterCounts(newCounts);
      localStorage.setItem(laterCountsKey, JSON.stringify(newCounts));
      setEatLater(updated);
      localStorage.setItem(laterKey, JSON.stringify(updated));
    } else {
      setPendingEatLaterDish(dish);
      setShowEatLaterPopup(true);
    }
  };

  // Confirm eat later action (per-hotel scoped)
  const confirmEatLater = () => {
    if (!pendingEatLaterDish || !user || !restaurantId) return;
    const laterKey = `ody_eat_later_${restaurantId}`;
    const laterCountsKey = `ody_dish_eat_later_counts_${restaurantId}`;
    const updated = [...eatLater, pendingEatLaterDish];
    const newCounts = { ...eatLaterCounts };
    newCounts[pendingEatLaterDish.id] = (newCounts[pendingEatLaterDish.id] || 0) + 1;
    setEatLaterCounts(newCounts);
    localStorage.setItem(laterCountsKey, JSON.stringify(newCounts));
    setEatLater(updated);
    localStorage.setItem(laterKey, JSON.stringify(updated));
    setShowEatLaterPopup(false);
    setPendingEatLaterDish(null);
  };

  // Cancel eat later action
  const cancelEatLater = () => {
    setShowEatLaterPopup(false);
    setPendingEatLaterDish(null);
  };

  // Check if dish is favorited
  const isFavorite = (dishId: string) => {
    return favorites.some((d) => d.id === dishId);
  };

  // Check if dish is in eat later
  const isInEatLater = (dishId: string) => {
    return eatLater.some((d) => d.id === dishId);
  };

  // 🔥 FILTER LOGIC (UNCHANGED)
  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) => {
      let updated = [...prev];

      const isVeg = filter === "Veg Only";
      const isNonVeg = filter === "Non-Veg Only";

      if (isVeg) updated = updated.filter((f) => f !== "Non-Veg Only");
      if (isNonVeg) updated = updated.filter((f) => f !== "Veg Only");

      if (updated.includes(filter)) {
        return updated.filter((f) => f !== filter);
      }

      const hasDiet =
        updated.includes("Veg Only") || updated.includes("Non-Veg Only");

      const normalCount = updated.filter(
        (f) => f !== "Veg Only" && f !== "Non-Veg Only"
      ).length;

      if (isVeg || isNonVeg) return [...updated, filter];

      if (hasDiet) {
        if (normalCount >= 2) return updated;
        return [...updated, filter];
      }

      if (!hasDiet) {
        if (updated.length >= 2) return updated;
        return [...updated, filter];
      }

      return updated;
    });
  };

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
      <div className="relative w-full max-w-md min-h-screen bg-[#1c1c1c] overflow-visible">

        {/* 🔥 TOP TASK BAR */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md z-[999]">
          <div className="h-11 sm:h-12 pl-3 pr-2 sm:pl-4 flex items-center justify-between bg-black/60 backdrop-blur-md">

            {!user ? (
              <button
                onClick={() => {
                  setMode("register");
                  setShowPopup(true);
                }}
                className="text-white text-sm sm:text-base font-medium"
              >
                Register
              </button>
            ) : (
              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center gap-1.5 sm:gap-2 text-white text-sm sm:text-base font-medium max-w-36 sm:max-w-44 truncate"
              >
                <img src="/User.png" className="w-6 h-6 sm:w-7 sm:h-7 rounded-full invert" alt="" />
                <span className="truncate">Hi, {getDisplayName()}</span>
              </button>
            )}

            <img src="/logo.png" className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain" alt="" />
          </div>
        </div>

        {/* 🔥 COVER SECTION */}
        <div className="relative w-full h-[50vh] overflow-hidden">
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

          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-30 w-full px-4 flex justify-center">
            <div className="flex gap-2 px-2 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
              {tabs.map((tab, index) => (
                <button
                  key={tab}
                  onClick={() => goToTab(index)}
                  className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full whitespace-nowrap text-xs sm:text-sm font-medium transition ${
                    activeTab === index
                      ? "bg-white text-black shadow-md"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 🔥 HORIZONTAL SWIPE AREA */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        >

          {/* ODY MENU */}
          <div className="min-w-full snap-center snap-always px-4 pt-6 sm:px-6 sm:pt-8 overflow-y-auto min-h-screen pb-10 sm:pb-12">
            {dishesLoadError ? (
              <div className="min-h-screen flex flex-col items-center justify-center">
                <p className="text-white/70 text-lg sm:text-xl font-medium">{dishesLoadError}</p>
              </div>
            ) : dishes.length === 0 ? (
              <div className="min-h-screen flex flex-col items-center justify-center">
                <p className="text-white/70 text-lg sm:text-xl font-medium">Coming soon</p>
              </div>
            ) : (
              <div className="mb-6 sm:mb-8">
                {dishes.map((dish) => (
                  <div
                    key={dish.id}
                    className="w-full rounded-xl sm:rounded-2xl overflow-hidden bg-white border border-gray-200 mb-4 sm:mb-6"
                  >
                    <div className="aspect-[4/3] w-full bg-gray-100 relative">
                      {dish.videoUrl && dish.videoUrl.trim() ? (
                        <DishMediaCarousel dish={dish} />
                      ) : (
                        <img
                          src={dish.photoUrl || "/food_item_logo.png"}
                          alt={dish.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="p-3 sm:p-4">
                      <div className="flex justify-between items-start mb-1.5 sm:mb-2">
                        <p className="text-base sm:text-lg font-semibold text-black">{dish.name}</p>
                        <div className="flex flex-col items-end">
                          <p className="text-base sm:text-lg font-semibold text-black">₹{dish.price}</p>
                          {/* FAVORITES & EAT LATER ICONS */}
                          <div className="flex items-center gap-0.5 sm:gap-1 mt-1">
                            <div className="flex flex-col items-center -mt-1">
                              <button
                                onClick={() => toggleFavorite(dish)}
                                className="disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!user}
                              >
                                <img
                                  src={isFavorite(dish.id) ? "/heart2.png" : "/heart.png"}
                                  alt="Favorite"
                                  className="w-8 h-8 sm:w-9 sm:h-9"
                                />
                              </button>
                              <span className="text-xs text-gray-600 mt-1.5 sm:mt-2 leading-none">
                                {favoriteCounts[dish.id] || 0}
                              </span>
                            </div>
                            <div className="flex flex-col items-center -mt-4 sm:-mt-5">
                              <div className="relative">
                                <button
                                  onClick={() => toggleEatLater(dish)}
                                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={!user}
                                >
                                  <img
                                    src="/eat_later.png"
                                    alt="Eat Later"
                                    className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24"
                                    style={isInEatLater(dish.id) ? { filter: "brightness(0) saturate(100%) invert(42%) sepia(93%) saturate(1352%) hue-rotate(188deg) brightness(97%) contrast(92%)" } : { filter: "brightness(1.1) contrast(1.2)" }}
                                  />
                                </button>
                                <span className="absolute top-3/4 left-1/2 -translate-x-1/2 text-xs text-gray-600 leading-none">
                                  {eatLaterCounts[dish.id] || 0}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {dish.description ? (
                        <p className="text-xs sm:text-sm text-gray-700 mt-1.5 sm:mt-2">{dish.description}</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MENU */}
          <div className="relative min-w-full snap-center snap-always pt-14 sm:pt-16 overflow-y-auto">
            <div className="absolute top-6 sm:top-8 left-0 w-full z-40">

              <div className="px-4 sm:px-6">
              <div className="w-full h-10 sm:h-11 rounded-full bg-white flex items-center px-3 sm:px-4 shadow-md gap-2 sm:gap-3">
  <img src="/search.png" className="w-4 h-4 sm:w-5 sm:h-5 opacity-60" alt="" />
  <input
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder={`Search in ${restaurantName || "this restaurant"}`}
    className="flex-1 bg-transparent outline-none text-xs sm:text-sm text-black placeholder-gray-400 min-w-0"
  />
</div>

              </div>

              {/* TOP DIVIDER */}
              <div className="mt-6 sm:mt-8 w-full">
                <div className="h-px bg-white/20 w-full" />
              </div>

              {/* FILTER ISLAND */}
              <div className="relative z-30 mt-3 sm:mt-4 px-3 sm:px-4">
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="h-9 sm:h-10 w-full" />
                </div>
              </div>

              {/* BOTTOM DIVIDER */}
              <div className="mt-2 w-full">
                <div className="h-px bg-white/20 w-full" />
              </div>
            </div>

            <div className="w-full bg-[#DADDE4] rounded-t-3xl sm:rounded-t-[36px] pt-16 sm:pt-20 px-4 sm:px-6 min-h-screen mt-32 sm:mt-36">
              <div className="flex flex-col gap-8 sm:gap-12 mt-4 sm:mt-6 items-center justify-start">
                <p className="text-gray-600 text-lg sm:text-xl font-medium text-center">
                  Coming soon
                </p>
                <div className="min-h-96" />
              </div>
            </div>
          </div>

          {/* EAT LATER */}
          <div className="min-w-full snap-center snap-always px-4 pt-6 sm:px-6 sm:pt-8 overflow-y-auto min-h-screen pb-10 sm:pb-12">
            {!user ? (
              <div className="min-h-screen flex flex-col items-center justify-center gap-4 sm:gap-5 px-4">
                <img src="/User.png" className="w-16 h-16 sm:w-20 sm:h-20 opacity-90 invert" alt="" />
                <p className="text-white/70 text-center text-sm sm:text-base">
                  Register or Log in to use Eat Later
                </p>
                <div className="flex gap-3 sm:gap-4">
                  <button
                    onClick={() => {
                      setMode("register");
                      setShowPopup(true);
                    }}
                    className="px-4 py-2.5 sm:px-6 sm:py-3 rounded-full bg-[#0A84C1] text-white text-sm sm:text-base"
                  >
                    Register
                  </button>
                  <button
                    onClick={() => {
                      setMode("login");
                      setShowPopup(true);
                    }}
                    className="px-4 py-2.5 sm:px-6 sm:py-3 rounded-full bg-white text-[#0A84C1] text-sm sm:text-base"
                  >
                    Log In
                  </button>
                </div>
              </div>
            ) : eatLater.length === 0 ? (
              <div className="min-h-screen flex flex-col items-center justify-center px-4">
                <p className="text-white/70 text-lg sm:text-xl text-center">Your Eat Later list is empty</p>
              </div>
            ) : (
              <div className="mb-6 sm:mb-8">
                {eatLater.map((dish) => (
                  <PhotoOnlyDishBlock key={dish.id} dish={dish} />
                ))}
              </div>
            )}
          </div>

          {/* FAVORITES */}
          <div className="min-w-full snap-center snap-always px-4 pt-6 sm:px-6 sm:pt-8 overflow-y-auto min-h-screen pb-10 sm:pb-12">
            {!user ? (
              <div className="min-h-screen flex flex-col items-center justify-center gap-4 sm:gap-5 px-4">
                <img src="/User.png" className="w-16 h-16 sm:w-20 sm:h-20 opacity-90 invert" alt="" />
                <p className="text-white/70 text-center text-sm sm:text-base">
                  Register or Log in to save Favorites
                </p>
                <div className="flex gap-3 sm:gap-4">
                  <button
                    onClick={() => {
                      setMode("register");
                      setShowPopup(true);
                    }}
                    className="px-4 py-2.5 sm:px-6 sm:py-3 rounded-full bg-[#0A84C1] text-white text-sm sm:text-base"
                  >
                    Register
                  </button>
                  <button
                    onClick={() => {
                      setMode("login");
                      setShowPopup(true);
                    }}
                    className="px-4 py-2.5 sm:px-6 sm:py-3 rounded-full bg-white text-[#0A84C1] text-sm sm:text-base"
                  >
                    Log In
                  </button>
                </div>
              </div>
            ) : favorites.length === 0 ? (
              <div className="min-h-screen flex flex-col items-center justify-center px-4">
                <p className="text-white/70 text-lg sm:text-xl text-center">Your Favorites list is empty</p>
              </div>
            ) : (
              <div className="mb-6 sm:mb-8">
                {favorites.map((dish) => (
                  <PhotoOnlyDishBlock key={dish.id} dish={dish} />
                ))}
              </div>
            )}
          </div>

        </div>

        {/* 🔥 ASK ODY - positioned within mobile frame */}
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-3 sm:px-4 z-50 flex justify-end pointer-events-none">
          <div className="pointer-events-auto">
            <button className="flex items-center gap-2 sm:gap-3 bg-black/70 backdrop-blur-md text-white px-3 py-2.5 sm:px-4 sm:py-3 rounded-full shadow-lg border border-white/10">
              <img src="/ody-face.png" className="w-6 h-6 sm:w-8 sm:h-8 rounded-full" alt="Ody" />
              <span className="text-xs sm:text-sm font-medium">Ask Ody</span>
            </button>
          </div>
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

      </div>
    </div>
  );
}