"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ProgressBar from "@/components/ProgressBar";
import { API_BASE } from "@/lib/api";
import { useLoader } from "@/context/LoaderContext";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || `id-${Date.now()}`;
}

export default function RestaurantDetailsPage() {
  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();

  const [form, setForm] = useState({
    restaurantName: "",
    userName: "",
    state: "",
    city: "",
    restaurantId: "",
    gmail: "",
    password: "",
    rePassword: "",
  });

  const [errors, setErrors] = useState({
    general: "",
    gmail: "",
    password: "",
    restaurantId: "",
  });

  // 👁️ SHOW / HIDE STATES
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);

  /* ---------- PROGRESS ---------- */
  const totalFields = Object.keys(form).length;

  const filledCount = useMemo(() => {
    return Object.values(form).filter(v => v.trim() !== "").length;
  }, [form]);

  const progress = Math.min((filledCount / totalFields) * 50, 50);

  /* ---------- HANDLERS ---------- */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ general: "", gmail: "", password: "", restaurantId: "" });
  };

  const handleNext = async () => {
    let hasError = false;
    const newErrors = { general: "", gmail: "", password: "", restaurantId: "" };

    for (const value of Object.values(form)) {
      if (value.trim() === "") {
        newErrors.general = "Please fill all the fields";
        hasError = true;
        break;
      }
    }

    if (form.gmail && !form.gmail.endsWith("@gmail.com")) {
      newErrors.gmail = "Gmail must end with @gmail.com";
      hasError = true;
    }

    if (form.password !== form.rePassword) {
      newErrors.password = "Password does not match";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setErrors(newErrors);
    showLoader();

    try {
      const slug = slugify(form.restaurantId);
      const res = await fetch(`${API_BASE}/api/hotels/${encodeURIComponent(slug)}`);

      if (res.status === 200) {
        hideLoader();
        setErrors((prev) => ({ ...prev, restaurantId: "Restaurant ID already exists" }));
        return;
      }

      if (res.status !== 404) {
        hideLoader();
        setErrors((prev) => ({ ...prev, restaurantId: "Could not verify Restaurant ID. Please try again." }));
        return;
      }

      hideLoader();
      /* 🔥 SAVE IMPORTANT DATA */
      localStorage.setItem("userName", form.userName);
      localStorage.setItem("restaurantName", form.restaurantName);
      localStorage.setItem("restaurantId", form.restaurantId);

      router.push("/owner/details2");
    } catch {
      hideLoader();
      setErrors((prev) => ({ ...prev, restaurantId: "Could not verify Restaurant ID. Please try again." }));
    }
  };

  const fadeUp = {
    initial: { y: 24, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.4 },
  };

  const inputClass = (name: string) =>
    `w-full border rounded-xl bg-white text-black focus:outline-none 
     focus:border-black focus:ring-1 focus:ring-black pr-12
     ${
       (errors.general && form[name as keyof typeof form] === "") ||
       (name === "restaurantId" && errors.restaurantId)
         ? "border-red-500"
         : "border-gray-300"
     }`;

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen overflow-y-auto relative">
        <div className="px-6 pt-10 pb-28">

          <motion.h1
            {...fadeUp}
            className="text-black mb-6"
            style={{ fontSize: "52px", lineHeight: "1.1", fontWeight: 600 }}
          >
            Enter Your<br />Details
          </motion.h1>

          {/* PROGRESS BAR */}
          <motion.div {...fadeUp} className="mb-10">
            <div className="h-[6px] w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0A84C1]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-right text-[13px] text-gray-500 mt-2">
              {Math.round(progress)}%
            </p>
          </motion.div>

          {errors.general && (
            <p className="text-red-600 text-sm mb-6">{errors.general}</p>
          )}

          {[
            ["Restaurant Name", "restaurantName"],
            ["User Name", "userName"],
            ["State", "state"],
            ["City", "city"],
            ["Restaurant ID", "restaurantId"],
            ["Gmail", "gmail"],
          ].map(([label, name]) => (
            <motion.div key={name} {...fadeUp} className="mb-6">
              <label className="block mb-2 text-[18px] font-semibold text-black">
                {label}
              </label>
              <input
                name={name}
                value={(form as any)[name]}
                onChange={handleChange}
                className={inputClass(name)}
                style={{ fontSize: "18px", padding: "14px 16px" }}
              />
              {name === "gmail" && errors.gmail && (
                <p className="text-red-600 text-sm mt-2">
                  {errors.gmail}
                </p>
              )}
              {name === "restaurantId" && errors.restaurantId && (
                <p className="text-red-600 text-sm mt-2">
                  {errors.restaurantId}
                </p>
              )}
            </motion.div>
          ))}

          {/* PASSWORD */}
          <motion.div {...fadeUp} className="mb-6 relative">
            <label className="block mb-2 text-[18px] font-semibold text-black">
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              className={inputClass("password")}
              style={{ fontSize: "18px", padding: "14px 16px" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[52px] text-sm text-gray-600"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </motion.div>

          {/* RE-PASSWORD */}
          <motion.div {...fadeUp} className="mb-6 relative">
            <label className="block mb-2 text-[18px] font-semibold text-black">
              Re-enter Password
            </label>
            <input
              type={showRePassword ? "text" : "password"}
              name="rePassword"
              value={form.rePassword}
              onChange={handleChange}
              className={inputClass("rePassword")}
              style={{ fontSize: "18px", padding: "14px 16px" }}
            />
            <button
              type="button"
              onClick={() => setShowRePassword(!showRePassword)}
              className="absolute right-4 top-[52px] text-sm text-gray-600"
            >
              {showRePassword ? "Hide" : "Show"}
            </button>

            {errors.password && (
              <p className="text-red-600 text-sm mt-2">
                {errors.password}
              </p>
            )}
          </motion.div>

        </div>

        {/* BOTTOM BAR */}
        <div className="absolute bottom-0 left-0 w-full border-t bg-white px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 rounded-md border border-gray-300 text-sm text-gray-700"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2 rounded-md text-sm font-medium bg-[#0A84C1] text-white"
              >
                Next
              </button>
            </div>
            <div className="flex items-center gap-3 min-w-[140px]">
              <span className="text-xs text-gray-500 whitespace-nowrap">
                Page 1 of 2
              </span>
              <ProgressBar progress={50} className="flex-1 h-[4px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
