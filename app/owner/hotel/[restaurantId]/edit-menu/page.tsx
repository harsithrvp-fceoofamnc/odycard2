"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import EditMenuDishBlock from "@/components/dish/EditMenuDishBlock";
import { API_BASE } from "@/lib/api";

const tabs = ["Ody Menu", "Menu"];

// All localStorage keys used across the add-dish flow — cleared before starting a fresh flow
const ADD_DISH_KEYS = [
  "addDishPhoto",
  "addDishVideoId",
  "addDishType",
  "addDishMenuCategoryId",
  "addDishTags",
  "addDishName",
  "addDishPrice",
  "addDishIsVeg",
  "addDishQuantity",
  "addDishDescription",
  "addDishTimingFrom",
  "addDishTimingTo",
];

type Category = {
  id: number;
  name: string;
};

type DishForBlock = {
  id: string;
  name: string;
  price: number;
  quantity?: string | null;
  description?: string | null;
  timing: { from: string; to: string };
  photoUrl: string;
  videoUrl?: string | null;
  isActive: boolean;
  menuCategoryId?: number | null;
  isVeg: boolean;
  tags?: string[] | null;
  sort_order?: number | null;
};

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
  is_active?: boolean;
  is_veg?: boolean;
  menu_category_id?: number | null;
  tags?: string[] | null;
  sort_order?: number | null;
  [k: string]: unknown;
}): DishForBlock {
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
    isActive: row.is_active !== false,
    menuCategoryId: row.menu_category_id ?? null,
    isVeg: row.is_veg !== false,
    tags: Array.isArray(row.tags) ? row.tags : null,
    sort_order: row.sort_order ?? null,
  };
}

/** Compact dish row used in reorder mode — dark themed with blue glow animation on move. */
function ArrowSortItem({
  dish,
  index,
  total,
  isJustMoved,
  onMoveUp,
  onMoveDown,
}: {
  dish: DishForBlock;
  index: number;
  total: number;
  isJustMoved: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-3 py-3 mb-2.5 last:mb-0"
      style={{
        backgroundColor: isJustMoved ? "#EBF5FB" : "#ffffff",
        boxShadow: isJustMoved
          ? "0 0 0 1.5px #0A84C1, 0 6px 28px rgba(10,132,193,0.25)"
          : "0 2px 8px rgba(0,0,0,0.08)",
        transform: isJustMoved ? "scale(1.025)" : "scale(1)",
        transition: "background-color 0.35s ease, box-shadow 0.35s ease, transform 0.25s ease",
      }}
    >
      {/* Position badge */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: "#0A84C1" }}
      >
        <span className="text-[11px] font-bold text-white">{index + 1}</span>
      </div>

      {/* Thumbnail */}
      <img
        src={dish.photoUrl || "/food_item_logo.png"}
        alt={dish.name}
        className="w-12 h-12 rounded-xl object-cover shrink-0"
        style={{ border: "1px solid #E5E7EB" }}
      />

      {/* Name + price */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[14px] leading-tight truncate" style={{ color: "#111111" }}>
          {dish.name}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
          ₹{dish.price}
        </p>
      </div>

      {/* ↑↓ connected pill */}
      <div
        className="flex flex-col shrink-0 overflow-hidden"
        style={{ border: "1.5px solid #E5E7EB", borderRadius: 12 }}
      >
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          className="w-9 h-9 flex items-center justify-center active:opacity-60 disabled:opacity-20 transition-opacity"
          style={{ borderBottom: "1.5px solid #E5E7EB", backgroundColor: "transparent" }}
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15"/>
          </svg>
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="w-9 h-9 flex items-center justify-center active:opacity-60 disabled:opacity-20 transition-opacity"
          style={{ backgroundColor: "transparent" }}
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function EditMenuPage() {
  const params = useParams();
  const restaurantId = params?.restaurantId as string | undefined;
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState(0);

  const [logo, setLogo] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("cached_logo_url") || "" : ""
  );
  const [cover, setCover] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("cached_cover_url") || "" : ""
  );
  const [dishes, setDishes] = useState<DishForBlock[]>([]);
  const [menuDishes, setMenuDishes] = useState<Record<number, DishForBlock[]>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [odyMenuHidden, setOdyMenuHidden] = useState(false);
  const [hotelDbId, setHotelDbId] = useState<string | null>(null);
  const [isTogglingOdyMenu, setIsTogglingOdyMenu] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);

  // EDIT
  const [showEdit, setShowEdit] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  // DELETE
  const [showDelete, setShowDelete] = useState(false);
  const [deleteCat, setDeleteCat] = useState<Category | null>(null);

  // ADD CONFIRM
  const [showAddConfirm, setShowAddConfirm] = useState(false);

  // RETURN MODAL
  const [showReturnModal, setShowReturnModal] = useState(false);

  // REORDER MODE
  const [reorderingCatId, setReorderingCatId] = useState<number | null>(null);
  const [reorderDraft, setReorderDraft] = useState<DishForBlock[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [justMovedId, setJustMovedId] = useState<string | null>(null);

  const startReorder = (catId: number) => {
    setReorderingCatId(catId);
    setReorderDraft([...(menuDishes[catId] ?? [])]);
  };

  const cancelReorder = () => {
    setReorderingCatId(null);
    setReorderDraft([]);
    setJustMovedId(null);
  };

  const moveDish = (fromIndex: number, toIndex: number) => {
    const movedId = reorderDraft[fromIndex]?.id ?? null;
    setReorderDraft((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    if (movedId) {
      setJustMovedId(movedId);
      setTimeout(() => setJustMovedId(null), 420);
    }
  };

  const saveReorder = async () => {
    if (reorderingCatId === null) return;
    setIsSavingOrder(true);
    try {
      await Promise.all(
        reorderDraft.map((dish, index) =>
          fetch(`${API_BASE}/api/dishes/${dish.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sort_order: index }),
          })
        )
      );
      // Commit new order to local state
      setMenuDishes((prev) => ({ ...prev, [reorderingCatId]: reorderDraft }));
      setReorderingCatId(null);
      setReorderDraft([]);
    } catch (e) {
      console.error("saveReorder error:", e);
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Scroll to correct tab from URL param (e.g. ?tab=1 after adding a menu dish)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tab = parseInt(params.get("tab") ?? "0");
    if (tab === 1) {
      const timer = setTimeout(() => goToTab(1), 200);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load hotel, dishes, and categories from API
  useEffect(() => {
    if (!restaurantId || typeof restaurantId !== "string") {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      const slug = restaurantId;
      if (!slug) return;
      try {
        const hotelRes = await fetch(
          `${API_BASE}/api/hotels/${encodeURIComponent(slug)}`
        );
        if (!hotelRes.ok) {
          if (hotelRes.status === 404) {
            setLoadError("Hotel not found. Please complete signup first.");
          } else {
            setLoadError("Failed to load menu");
          }
          return;
        }
        const hotel = await hotelRes.json();

        if (cancelled) return;
        setLogo(hotel.logo_url || "");
        setCover(hotel.cover_url || "");
        setOdyMenuHidden(hotel.ody_menu_hidden === true);
        setHotelDbId(String(hotel.id));

        // Fetch all dishes (Ody Menu + Menu tab dishes)
        const dishesRes = await fetch(
          `${API_BASE}/api/dishes?hotel_id=${encodeURIComponent(hotel.id)}&all=true`
        );
        if (!dishesRes.ok) {
          setLoadError("Failed to load dishes");
          return;
        }
        const rows = await dishesRes.json();
        if (!cancelled) {
          const allDishes = rows.map(mapDishFromApi);
          // Ody Menu: no menu_category_id
          setDishes(allDishes.filter((d: DishForBlock) => !d.menuCategoryId));
          // Menu tab: group by menu_category_id
          const byCategory: Record<number, DishForBlock[]> = {};
          for (const d of allDishes as DishForBlock[]) {
            if (d.menuCategoryId) {
              if (!byCategory[d.menuCategoryId]) byCategory[d.menuCategoryId] = [];
              byCategory[d.menuCategoryId].push(d);
            }
          }
          setMenuDishes(byCategory);
          setLoadError(null);
        }

        // Fetch categories from Supabase
        const catRes = await fetch(
          `${API_BASE}/api/categories?hotel_id=${encodeURIComponent(hotel.id)}`
        );
        if (catRes.ok) {
          let cats = await catRes.json();
          // Auto-create "Category - 1" if none exist yet
          if (!Array.isArray(cats) || cats.length === 0) {
            const createRes = await fetch(`${API_BASE}/api/categories`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ hotel_id: hotel.id, name: "Category - 1" }),
            });
            if (createRes.ok) {
              const created = await createRes.json();
              cats = created && created.id ? [created] : [];
            } else {
              cats = [];
            }
          }
          if (!cancelled) setCategories(Array.isArray(cats) ? cats : []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Edit menu load error:", err);
          setLoadError("Failed to load menu");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [restaurantId]);

  const handleToggleOdyMenu = async () => {
    if (!hotelDbId) return;
    const newVal = !odyMenuHidden;
    setOdyMenuHidden(newVal);
    try {
      const res = await fetch(`${API_BASE}/api/hotels/${hotelDbId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ody_menu_hidden: newVal }),
      });
      if (!res.ok) {
        console.error("Toggle ody_menu_hidden failed:", await res.text());
        setOdyMenuHidden(!newVal);
      }
    } catch (e) {
      console.error("Toggle ody_menu_hidden error:", e);
      setOdyMenuHidden(!newVal);
    }
  };

  const reloadDishes = async () => {
    if (!restaurantId) return;
    try {
      const hotelRes = await fetch(`${API_BASE}/api/hotels/${encodeURIComponent(restaurantId)}`);
      if (!hotelRes.ok) return;
      const hotel = await hotelRes.json();
      const dishesRes = await fetch(`${API_BASE}/api/dishes?hotel_id=${encodeURIComponent(hotel.id)}&all=true`);
      if (!dishesRes.ok) return;
      const rows = await dishesRes.json();
      const allDishes = rows.map(mapDishFromApi);
      setDishes(allDishes.filter((d: DishForBlock) => !d.menuCategoryId));
      const byCategory: Record<number, DishForBlock[]> = {};
      for (const d of allDishes as DishForBlock[]) {
        if (d.menuCategoryId) {
          if (!byCategory[d.menuCategoryId]) byCategory[d.menuCategoryId] = [];
          byCategory[d.menuCategoryId].push(d);
        }
      }
      setMenuDishes(byCategory);
    } catch {
      // ignore
    }
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollLeft, clientWidth } = containerRef.current;
    setActiveTab(Math.round(scrollLeft / clientWidth));
  };

  const goToTab = (index: number) => {
    if (!containerRef.current) return;
    containerRef.current.scrollTo({
      left: containerRef.current.clientWidth * index,
      behavior: "smooth",
    });
    setActiveTab(index);
  };

  // ---- CATEGORY CRUD (persisted to Supabase) ----

  const addCategory = async () => {
    if (!hotelDbId) return;
    const next = categories.length + 1;
    const name = `Category - ${next}`;
    try {
      const res = await fetch(`${API_BASE}/api/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotel_id: parseInt(hotelDbId), name }),
      });
      if (res.ok) {
        const cat = await res.json();
        if (cat && cat.id) {
          setCategories((prev) => [...prev, { id: cat.id, name: cat.name }]);
        }
      }
    } catch (e) {
      console.error("addCategory error:", e);
    }
    setShowAddConfirm(false);
  };

  const openEdit = (cat: Category) => {
    setEditId(cat.id);
    setEditValue(cat.name);
    setShowEdit(true);
  };

  const saveEdit = async () => {
    if (!editId) return;
    const trimmed = editValue.trim();
    if (!trimmed) { setShowEdit(false); return; }
    try {
      const res = await fetch(`${API_BASE}/api/categories/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        setCategories((prev) =>
          prev.map((c) => c.id === editId ? { ...c, name: trimmed } : c)
        );
      }
    } catch (e) {
      console.error("saveEdit error:", e);
    }
    setShowEdit(false);
    setEditId(null);
    setEditValue("");
  };

  const confirmDelete = (cat: Category) => {
    setDeleteCat(cat);
    setShowDelete(true);
  };

  const deleteCategory = async () => {
    if (!deleteCat) return;
    try {
      await fetch(`${API_BASE}/api/categories/${deleteCat.id}`, { method: "DELETE" });
    } catch (e) {
      console.error("deleteCategory error:", e);
    }
    setCategories((prev) => prev.filter((c) => c.id !== deleteCat.id));
    setMenuDishes((prev) => {
      const n = { ...prev };
      delete n[deleteCat.id];
      return n;
    });
    setShowDelete(false);
    setDeleteCat(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/80">Loading menu...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-white/80 text-center">{loadError}</p>
        <button
          onClick={() => router.push("/owner/details")}
          className="px-6 py-2 rounded-full bg-[#0A84C1] text-white"
        >
          Complete signup
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="relative w-full max-w-md min-h-screen bg-[#1c1c1c]">

        {/* COVER */}
        <div className="relative w-full h-[50vh] overflow-hidden">
          {cover ? (
            <>
              <img src={cover} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30" />
            </>
          ) : (
            <div className="w-full h-full bg-[#1c1c1c]" />
          )}

          {/* RETURN TOGGLE */}
          <div className="absolute top-4 left-4 z-20">
            <button
              onClick={() => setShowReturnModal(true)}
              className="px-4 py-2 rounded-full bg-black/60 backdrop-blur-md text-white text-sm shadow-lg hover:bg-black/70 transition"
            >
              Return
            </button>
          </div>

          <div className="absolute inset-0 flex items-center justify-center -translate-y-6">
            {logo && (
              <div className="w-44 h-44 rounded-full overflow-hidden shadow-[0_35px_70px_rgba(0,0,0,0.85)]">
                <img src={logo} className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* TAB ISLAND */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-30 w-full px-4 flex justify-center">
            <div className="flex gap-2 px-2 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
              {tabs.map((tab, index) => (
                <button
                  key={tab}
                  onClick={() => goToTab(index)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                    activeTab === index
                      ? "bg-white text-black"
                      : "text-white/80"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex w-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
        >
          {/* ================= ODY MENU TAB ================= */}
          <div className="min-w-full snap-center pt-8 min-h-screen px-6 pb-12">
            {/* HIDE ODY MENU TOGGLE */}
            <div className="flex items-center justify-between bg-white rounded-2xl px-5 py-4 mb-6 shadow-sm">
              <div>
                <p className="text-black font-semibold text-[15px]">Hide Ody Menu</p>
                <p className="text-gray-400 text-[12px] mt-0.5">Customers won't see the Ody Menu tab</p>
              </div>
              <button
                onClick={handleToggleOdyMenu}
                disabled={isTogglingOdyMenu}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${odyMenuHidden ? "bg-[#0A84C1]" : "bg-gray-300"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${odyMenuHidden ? "translate-x-6" : "translate-x-0"}`} />
              </button>
            </div>

            {/* OWNER DISH BLOCKS */}
            {dishes.length > 0 && (
              <div className="mb-8">
                {dishes.map((dish) => (
                  <EditMenuDishBlock key={dish.id} dish={dish} restaurantId={restaurantId} onRefresh={reloadDishes} />
                ))}
              </div>
            )}

            {/* ADD DISH CTA */}
            <div className={dishes.length > 0 ? "flex justify-center" : "flex justify-center mt-8"}>
              <button
                onClick={() => {
                  if (!restaurantId) return;
                  ADD_DISH_KEYS.forEach((k) => localStorage.removeItem(k));
                  router.push(`/owner/hotel/${restaurantId}/add-dish`);
                }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full border-2 border-[#0A84C1] flex items-center justify-center">
                  <span className="text-[#0A84C1] text-xl font-medium leading-none">+</span>
                </div>
                <span className="text-[#0A84C1] text-base font-medium">Add dish</span>
              </button>
            </div>
          </div>

          {/* ================= MENU TAB ================= */}
          <div className="relative min-w-full snap-center pt-6 min-h-screen pb-20">

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
                <div className="w-full">
                  <div className="h-px bg-white/20 w-full" />
                  <div className="min-h-[64px] w-full overflow-x-auto no-scrollbar">
                    {tagList.length === 0 ? (
                      <p className="text-white/50 text-sm text-center w-full py-5">
                        Tags assigned to food items will appear here
                      </p>
                    ) : (
                      <div className="flex flex-nowrap gap-2 py-3 px-4 min-w-max">
                        {tagList.map(tag => (
                          <span
                            key={tag}
                            className="shrink-0 px-4 py-2 rounded-full text-sm font-semibold text-white"
                            style={{ background: "linear-gradient(to right, #0D5F8E 0%, #14AADA 100%)" }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="h-px bg-white/20 w-full" />
                </div>
              );
            })()}

            {/* CATEGORIES */}
            <div className="pt-8 px-4">
              {categories.length === 0 && (
                <p className="text-white/50 text-sm text-center mt-4 mb-8">
                  No categories yet. Tap + below to add one.
                </p>
              )}

              {categories.map((cat, index) => {
                const catDishes = menuDishes[cat.id] ?? [];
                const isReordering = reorderingCatId === cat.id;
                return (
                  <div key={cat.id} className="mb-10">

                    {/* HEADER */}
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-white text-2xl font-bold">{cat.name}</h2>
                      <div className="flex items-center gap-3">
                        {/* Reorder button — only when not reordering and 2+ dishes exist */}
                        {!isReordering && reorderingCatId === null && catDishes.length >= 2 && (
                          <button
                            onClick={() => startReorder(cat.id)}
                            className="text-white/60 text-sm font-medium"
                          >
                            Reorder
                          </button>
                        )}
                        {/* Edit name button — hidden when this category is being reordered */}
                        {!isReordering && (
                          <button
                            onClick={() => openEdit(cat)}
                            className="text-[#0A84C1] text-sm font-medium"
                          >
                            Edit
                          </button>
                        )}
                        {/* Reordering label */}
                        {isReordering && (
                          <span className="text-[#0A84C1] text-sm font-medium">Arranging...</span>
                        )}
                      </div>
                    </div>

                    {/* CATEGORY BLOCK — auto-sizes to contents */}
                    <div
                      className="rounded-[28px] px-4 py-4 w-full transition-colors duration-300"
                      style={{ backgroundColor: "#DADDE4" }}
                    >

                      {/* DISH BLOCKS — arrow-sort when reordering, normal otherwise */}
                      {isReordering ? (
                        <div>
                          {reorderDraft.map((dish, idx) => (
                            <ArrowSortItem
                              key={dish.id}
                              dish={dish}
                              index={idx}
                              total={reorderDraft.length}
                              isJustMoved={dish.id === justMovedId}
                              onMoveUp={() => moveDish(idx, idx - 1)}
                              onMoveDown={() => moveDish(idx, idx + 1)}
                            />
                          ))}
                        </div>
                      ) : (
                        catDishes.map((dish) => (
                          <EditMenuDishBlock
                            key={dish.id}
                            dish={dish}
                            restaurantId={restaurantId}
                            onRefresh={reloadDishes}
                          />
                        ))
                      )}

                      {/* ADD DISH BUTTON inside block — hidden during reorder */}
                      {!isReordering && (
                        <div className={catDishes.length > 0 ? "mt-4 flex justify-center" : "flex justify-center py-6"}>
                          <button
                            onClick={() => {
                              if (!restaurantId) return;
                              ADD_DISH_KEYS.forEach((k) => localStorage.removeItem(k));
                              localStorage.setItem("addDishMenuCategoryId", String(cat.id));
                              router.push(`/owner/hotel/${restaurantId}/add-dish`);
                            }}
                            className="flex items-center gap-3"
                          >
                            <div className="w-10 h-10 rounded-full border-2 border-[#0A84C1] flex items-center justify-center bg-white">
                              <span className="text-[#0A84C1] text-xl font-medium leading-none">+</span>
                            </div>
                            <span className="text-[#0A84C1] text-base font-medium">Add dish</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* DELETE BUTTON — only for non-first categories, hidden during reorder */}
                    {index > 0 && !isReordering && reorderingCatId === null && (
                      <div className="mt-3 px-1">
                        <button onClick={() => confirmDelete(cat)}>
                          <img
                            src="/Trash.png"
                            className="w-5 h-5 opacity-70"
                            style={{
                              filter: "invert(35%) sepia(70%) saturate(1200%) hue-rotate(340deg)",
                            }}
                          />
                        </button>
                      </div>
                    )}

                    {/* ADD CATEGORY BUTTON — after last category, hidden during reorder */}
                    {index === categories.length - 1 && reorderingCatId === null && (
                      <div className="flex justify-center mt-10">
                        <button
                          onClick={() => setShowAddConfirm(true)}
                          className="w-14 h-14 rounded-full bg-[#0A84C1] text-white text-3xl shadow-lg flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* If no categories yet, show the add button */}
              {categories.length === 0 && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => setShowAddConfirm(true)}
                    className="w-14 h-14 rounded-full bg-[#0A84C1] text-white text-3xl shadow-lg flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ADD CONFIRM POPUP */}
        {showAddConfirm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000]">
            <div className="bg-[#1c1c1c] rounded-xl p-6 w-[85%] max-w-xs space-y-5">
              <p className="text-white text-center font-medium">
                Do you want to add another Category?
              </p>
              <button
                onClick={addCategory}
                className="w-full py-3 rounded-full bg-[#0A84C1] text-white"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddConfirm(false)}
                className="w-full py-3 rounded-full bg-white text-[#0A84C1]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* DELETE POPUP */}
        {showDelete && deleteCat && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000]">
            <div className="bg-[#1c1c1c] rounded-xl p-6 w-[85%] max-w-xs space-y-5">
              <p className="text-white text-center font-medium">
                Do you want to delete <br />
                <span className="font-semibold">{deleteCat.name}</span>?
              </p>
              <button
                onClick={deleteCategory}
                className="w-full py-3 rounded-full bg-red-600 text-white"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDelete(false)}
                className="w-full py-3 rounded-full bg-white text-[#0A84C1]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* EDIT POPUP */}
        {showEdit && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000]">
            <div className="bg-[#1c1c1c] rounded-xl p-6 w-[85%] max-w-xs space-y-4">
              <p className="text-white font-medium text-center">Edit Category Name</p>
              <input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full p-3 rounded bg-black border border-white/30 text-white"
              />
              <button
                onClick={saveEdit}
                className="w-full py-3 rounded-full bg-[#0A84C1] text-white"
              >
                Save
              </button>
              <button
                onClick={() => setShowEdit(false)}
                className="w-full py-3 rounded-full bg-white text-[#0A84C1]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* REORDER SAVE / CANCEL BAR */}
        {reorderingCatId !== null && (
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-[999] px-6 pb-10 pt-6"
            style={{ background: "linear-gradient(to top, #000000 60%, transparent)" }}
          >
            <div className="flex gap-3">
              <button
                onClick={cancelReorder}
                disabled={isSavingOrder}
                className="flex-1 py-3.5 rounded-full bg-white/10 text-white font-semibold text-base backdrop-blur-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={saveReorder}
                disabled={isSavingOrder}
                className="flex-1 py-3.5 rounded-full bg-[#0A84C1] text-white font-semibold text-base disabled:opacity-70"
              >
                {isSavingOrder ? "Saving..." : "Save Order"}
              </button>
            </div>
          </div>
        )}

        {/* RETURN TO DASHBOARD MODAL */}
        {showReturnModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000]">
            <div className="bg-[#111111] rounded-2xl shadow-xl p-6 w-[85%] max-w-xs mx-4 space-y-5">
              <p className="text-white text-center font-medium text-base">
                Do you want to return to your Dashboard?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowReturnModal(false)}
                  className="flex-1 py-3 rounded-full bg-gray-700 text-gray-200 font-medium text-sm hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowReturnModal(false);
                    router.replace("/owner/dashboard");
                  }}
                  className="flex-1 py-3 rounded-full bg-[#0A84C1] text-white font-medium text-sm hover:bg-[#0970a0] transition"
                >
                  Yes, Return
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
