"use client";

import { useState, useMemo, useEffect } from "react";
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

  const [signupMethod, setSignupMethod] = useState<"mobile" | "google">("mobile");

  const [form, setForm] = useState({
    restaurantName: "",
    userName: "",
    state: "",
    city: "",
    restaurantId: "",
    password: "",
    rePassword: "",
  });

  const [errors, setErrors] = useState({
    general: "",
    password: "",
    restaurantId: "",
    mobile: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);

  // Read signup method + restore form on mount
  useEffect(() => {
    const method = sessionStorage.getItem("signup_method");
    if (method === "google") setSignupMethod("google");

    const saved = sessionStorage.getItem("signup_form");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setForm((prev) => ({ ...prev, ...parsed }));
      } catch {
        // ignore
      }
    }
  }, []);

  const isGoogle = signupMethod === "google";

  /* ---------- PROGRESS ---------- */
  const baseFields = ["restaurantName", "userName", "state", "city", "restaurantId"];
  const passwordFields = isGoogle ? [] : ["password", "rePassword"];
  const allFields = [...baseFields, ...passwordFields];
  const totalFields = allFields.length;

  const filledCount = useMemo(() => {
    return allFields.filter((k) => (form as any)[k]?.trim() !== "").length;
  }, [form, isGoogle]);

  const progress = Math.min((filledCount / totalFields) * 50, 50);

  /* ---------- HANDLERS ---------- */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ general: "", password: "", restaurantId: "", mobile: "" });
  };

  const handleNext = async () => {
    let hasError = false;
    const newErrors = { general: "", password: "", restaurantId: "", mobile: "" };

    // Check base fields
    for (const key of baseFields) {
      if ((form as any)[key].trim() === "") {
        newErrors.general = "Please fill all the fields";
        hasError = true;
        break;
      }
    }

    // Password validation for mobile users
    if (!isGoogle) {
      if (form.password.trim() === "" || form.rePassword.trim() === "") {
        newErrors.general = "Please fill all the fields";
        hasError = true;
      } else if (form.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
        hasError = true;
      } else if (form.password !== form.rePassword) {
        newErrors.password = "Passwords do not match";
        hasError = true;
      }
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setErrors(newErrors);
    showLoader();

    const fetchWithRetry = async (url: string, maxAttempts = 4, timeoutMs = 25000): Promise<Response> => {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timer);
          if (res.status >= 500 && attempt < maxAttempts) {
            await new Promise((r) => setTimeout(r, 6000));
            continue;
          }
          return res;
        } catch (err: unknown) {
          clearTimeout(timer);
          const isAbort = err instanceof Error && err.name === "AbortError";
          const isLast = attempt === maxAttempts;
          if (isLast) throw err;
          await new Promise((r) => setTimeout(r, isAbort ? 6000 : 3000));
        }
      }
      throw new Error("Server unreachable");
    };

    try {
      const slug = slugify(form.restaurantId);

      // Check restaurant ID availability
      const res = await fetchWithRetry(`${API_BASE}/api/hotels/${encodeURIComponent(slug)}`);
      if (res.status === 200) {
        hideLoader();
        setErrors((prev) => ({ ...prev, restaurantId: "Restaurant ID already taken. Please choose another." }));
        return;
      }
      if (res.status >= 500) {
        hideLoader();
        setErrors((prev) => ({ ...prev, restaurantId: "Server is starting up — please wait 30 seconds and try again." }));
        return;
      }
      if (res.status !== 404) {
        hideLoader();
        setErrors((prev) => ({ ...prev, restaurantId: "Could not verify Restaurant ID. Please try again." }));
        return;
      }

      // For mobile users: check if mobile number is already registered
      if (!isGoogle) {
        const mobile = sessionStorage.getItem("signup_mobile") || "";
        const mobileRes = await fetchWithRetry(
          `${API_BASE}/api/owners/check-mobile?mobile=${encodeURIComponent(mobile)}`
        );
        if (mobileRes.status >= 500) {
          hideLoader();
          setErrors((prev) => ({ ...prev, mobile: "Server is starting up — please wait 30 seconds and try again." }));
          return;
        }
        if (mobileRes.ok) {
          const mobileData = await mobileRes.json();
          if (mobileData.exists) {
            hideLoader();
            setErrors((prev) => ({ ...prev, mobile: "This mobile number is already registered. Please login instead." }));
            return;
          }
        }
      }

      hideLoader();
      localStorage.setItem("userName", form.userName);
      localStorage.setItem("restaurantName", form.restaurantName);
      localStorage.setItem("restaurantSlug", slug);
      if (!isGoogle) {
        sessionStorage.setItem("signup_password", form.password);
      }
      sessionStorage.setItem("signup_form", JSON.stringify(form));

      router.push("/owner/details2");
    } catch {
      hideLoader();
      setErrors((prev) => ({
        ...prev,
        restaurantId: "Server is starting up — please wait 30 seconds and try again.",
      }));
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
       (errors.general && (form as any)[name] === "") ||
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
              <div className="h-full bg-[#0A84C1]" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-right text-[13px] text-gray-500 mt-2">{Math.round(progress)}%</p>
          </motion.div>

          {errors.general && (
            <p className="text-red-600 text-sm mb-6">{errors.general}</p>
          )}
          {errors.mobile && (
            <p className="text-red-600 text-sm mb-6">{errors.mobile}</p>
          )}

          {/* BASE FIELDS */}
          {[
            ["Restaurant Name", "restaurantName"],
            ["User Name", "userName"],
            ["State", "state"],
            ["City", "city"],
            ["Restaurant ID", "restaurantId"],
          ].map(([label, name]) => (
            <motion.div key={name} {...fadeUp} className="mb-6">
              <label className="block mb-2 text-[18px] font-semibold text-black">{label}</label>
              <input
                name={name}
                value={(form as any)[name]}
                onChange={handleChange}
                className={inputClass(name)}
                style={{ fontSize: "18px", padding: "14px 16px" }}
              />
              {name === "restaurantId" && errors.restaurantId && (
                <p className="text-red-600 text-sm mt-2">{errors.restaurantId}</p>
              )}
            </motion.div>
          ))}

          {/* PASSWORD — only for mobile signup */}
          {!isGoogle && (
            <>
              <motion.div {...fadeUp} className="mb-6 relative">
                <label className="block mb-2 text-[18px] font-semibold text-black">Password</label>
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

              <motion.div {...fadeUp} className="mb-6 relative">
                <label className="block mb-2 text-[18px] font-semibold text-black">Re-enter Password</label>
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
                  <p className="text-red-600 text-sm mt-2">{errors.password}</p>
                )}
              </motion.div>
            </>
          )}

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
              <span className="text-xs text-gray-500 whitespace-nowrap">Page 1 of 2</span>
              <ProgressBar progress={50} className="flex-1 h-[4px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
