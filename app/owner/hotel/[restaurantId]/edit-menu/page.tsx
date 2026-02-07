"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const tabs = ["Ody Menu", "Menu"];

type Category = {
  id: number;
  name: string;
};

export default function EditMenuPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [logo, setLogo] = useState("");
  const [cover, setCover] = useState("");

  const [categories, setCategories] = useState<Category[]>([
    { id: 1, name: "Category - 1" },
  ]);

  // EDIT
  const [showEdit, setShowEdit] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  // DELETE
  const [showDelete, setShowDelete] = useState(false);
  const [deleteCat, setDeleteCat] = useState<Category | null>(null);

  // ADD CONFIRM
  const [showAddConfirm, setShowAddConfirm] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setLogo(localStorage.getItem("restaurantLogo") || "");
    setCover(localStorage.getItem("restaurantCover") || "");
  }, []);

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

  const addCategory = () => {
    const next = categories.length + 1;
    setCategories([
      ...categories,
      { id: Date.now(), name: `Category - ${next}` },
    ]);
    setShowAddConfirm(false);
  };

  const openEdit = (cat: Category) => {
    setEditId(cat.id);
    setEditValue(cat.name);
    setShowEdit(true);
  };

  const saveEdit = () => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === editId ? { ...c, name: editValue.trim() || c.name } : c
      )
    );
    setShowEdit(false);
    setEditId(null);
    setEditValue("");
  };

  const confirmDelete = (cat: Category) => {
    setDeleteCat(cat);
    setShowDelete(true);
  };

  const deleteCategory = () => {
    if (!deleteCat) return;
    setCategories((prev) => prev.filter((c) => c.id !== deleteCat.id));
    setShowDelete(false);
    setDeleteCat(null);
  };

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
          className="flex w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        >
          {/* ================= ODY MENU TAB ================= */}
          <div className="min-w-full snap-center pt-24 min-h-screen">

            {/* ADD DISH LINK — MOVED UP */}
            <div className="flex justify-center mt-8">
              <button
                onClick={() => {
                  const restaurantId = localStorage.getItem("restaurantId");
                  if (!restaurantId) return;
                  router.push(`/owner/hotel/${restaurantId}/add-dish`);
                }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full border-2 border-[#0A84C1] flex items-center justify-center">
                  <span className="text-[#0A84C1] text-xl font-medium leading-none">
                    +
                  </span>
                </div>
                <span className="text-[#0A84C1] text-base font-medium">
                  Add dish
                </span>
              </button>
            </div>
          </div>

          {/* ================= MENU TAB ================= */}
          <div className="relative min-w-full snap-center pt-16 min-h-screen">

            {/* TAG ISLAND */}
            <div className="absolute top-20 left-0 w-full z-10">
              <div className="h-px bg-white/20 w-full" />
              <div className="h-16 w-full flex items-center justify-center">
                <p className="text-white/60 text-sm text-center">
                  Tags assigned to food items will appear here
                </p>
              </div>
              <div className="h-px bg-white/20 w-full" />
            </div>

            {/* CATEGORIES */}
            <div className="pt-40">
              {categories.map((cat, index) => (
                <div key={cat.id} className="mb-24">

                  {/* HEADER */}
                  <div className="flex items-center justify-between mb-4 px-4">
                    <h2 className="text-white text-2xl font-bold">
                      {cat.name}
                    </h2>
                    <button
                      onClick={() => openEdit(cat)}
                      className="text-[#0A84C1] text-sm font-medium"
                    >
                      Edit
                    </button>
                  </div>

                  {/* CATEGORY LAYER */}
                  <div className="bg-[#DADDE4] rounded-[28px] min-h-[700px] w-full" />

                  {/* 🗑️ TRASH TOGGLE — RESTORED */}
                  {index > 0 && (
                    <div className="mt-4 px-4">
                      <button onClick={() => confirmDelete(cat)}>
                        <img
                          src="/Trash.png"
                          className="w-5 h-5 opacity-70"
                          style={{
                            filter:
                              "invert(35%) sepia(70%) saturate(1200%) hue-rotate(340deg)",
                          }}
                        />
                      </button>
                    </div>
                  )}

                  {/* ADD CATEGORY BUTTON */}
                  {index === categories.length - 1 && (
                    <div className="flex justify-center mt-12">
                      <button
                        onClick={() => setShowAddConfirm(true)}
                        className="w-14 h-14 rounded-full bg-[#0A84C1] text-white text-3xl shadow-lg flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              ))}
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
              <p className="text-white font-medium text-center">
                Edit Category Name
              </p>
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
      </div>
    </div>
  );
}
