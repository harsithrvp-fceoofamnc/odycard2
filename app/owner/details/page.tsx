"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ProgressBar from "@/components/ProgressBar";
import { API_BASE } from "@/lib/api";
import { useLoader } from "@/context/LoaderContext";
import { indiaLocations, statesList } from "@/lib/india-locations";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || `id-${Date.now()}`;
}

export default function RestaurantDetailsPage() {
  const router = useRouter();
  const { showLoader, hideLoader, setProgress } = useLoader();

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
    setProgress(10);

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
      const mobile = sessionStorage.getItem("signup_mobile") || "";

      // Start at 30%, then slowly creep up 1% every 400ms while waiting for API
      setProgress(30);
      let creepValue = 30;
      const creepTimer = setInterval(() => {
        creepValue = Math.min(creepValue + 1, 90);
        setProgress(creepValue);
      }, 400);

      // Run restaurant ID check + mobile check in parallel
      const checks = await Promise.all([
        fetchWithRetry(`${API_BASE}/api/hotels/${encodeURIComponent(slug)}`),
        !isGoogle ? fetchWithRetry(`${API_BASE}/api/owners/check-mobile?mobile=${encodeURIComponent(mobile)}`) : Promise.resolve(null),
      ]);
      clearInterval(creepTimer);
      setProgress(100);

      const [res, mobileRes] = checks;

      // Validate restaurant ID
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

      // Validate mobile availability
      if (!isGoogle && mobileRes) {
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
            </motion.div>
          ))}

          {/* STATE DROPDOWN */}
          <motion.div {...fadeUp} className="mb-6">
            <label className="block mb-2 text-[18px] font-semibold text-black">State</label>
            <select
              name="state"
              value={form.state}
              onChange={(e) => {
                setForm({ ...form, state: e.target.value, city: "" });
                setErrors({ general: "", password: "", restaurantId: "", mobile: "" });
              }}
              className={`w-full border rounded-xl bg-white text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black appearance-none ${errors.general && form.state === "" ? "border-red-500" : "border-gray-300"}`}
              style={{ fontSize: "18px", padding: "14px 16px" }}
            >
              <option value="">Select State / UT</option>
              {statesList.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </motion.div>

          {/* CITY DROPDOWN */}
          <motion.div {...fadeUp} className="mb-6">
            <label className="block mb-2 text-[18px] font-semibold text-black">City</label>
            <select
              name="city"
              value={form.city}
              onChange={(e) => {
                setForm({ ...form, city: e.target.value });
                setErrors({ general: "", password: "", restaurantId: "", mobile: "" });
              }}
              disabled={!form.state}
              className={`w-full border rounded-xl bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black appearance-none ${!form.state ? "text-gray-400 cursor-not-allowed" : "text-black"} ${errors.general && form.city === "" ? "border-red-500" : "border-gray-300"}`}
              style={{ fontSize: "18px", padding: "14px 16px" }}
            >
              <option value="">{form.state ? "Select City" : "Select State first"}</option>
              {form.state && indiaLocations[form.state]?.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </motion.div>

          {/* RESTAURANT ID */}
          <motion.div {...fadeUp} className="mb-6">
            <label className="block mb-2 text-[18px] font-semibold text-black">Restaurant ID</label>
            <input
              name="restaurantId"
              value={form.restaurantId}
              onChange={handleChange}
              className={inputClass("restaurantId")}
              style={{ fontSize: "18px", padding: "14px 16px" }}
            />
            {errors.restaurantId && (
              <p className="text-red-600 text-sm mt-2">{errors.restaurantId}</p>
            )}
          </motion.div>

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
        <div className="absolute bottom-0 left-0 w-full border-t bg-white px-6 py-5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-8 py-3 rounded-xl border border-gray-300 text-base text-gray-700 font-medium"
            >
              Back
            </button>
            <span className="text-sm text-gray-400 font-medium">Page 1 of 2</span>
            <button
              type="button"
              onClick={handleNext}
              className="px-8 py-3 rounded-xl text-base font-semibold bg-[#0A84C1] text-white"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
