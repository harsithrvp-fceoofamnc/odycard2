"use client";

import { useEffect, useRef, useState } from "react";

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

export default function HotelHomePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [logo, setLogo] = useState("");
  const [cover, setCover] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
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


  useEffect(() => {
    setLogo(localStorage.getItem("restaurantLogo") || "");
    setCover(localStorage.getItem("restaurantCover") || "");

    const saved = localStorage.getItem("odyUser");
    if (saved) setUser(JSON.parse(saved));
  }, []);

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
      <div className="relative w-full max-w-md min-h-screen bg-[#1c1c1c] overflow-y-auto">

        {/* 🔥 TOP TASK BAR */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md z-[999]">
          <div className="h-12 px-4 flex items-center justify-between bg-black/60 backdrop-blur-md">

            {!user ? (
              <button
                onClick={() => {
                  setMode("register");
                  setShowPopup(true);
                }}
                className="text-white text-sm font-medium"
              >
                Register
              </button>
            ) : (
              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center gap-2 text-white text-sm font-medium max-w-[160px]"
              >
                <img src="/User.png" className="w-7 h-7 rounded-full invert" />
                <span className="truncate">Hi, {getDisplayName()}</span>
              </button>
            )}

            <img src="/logo.png" className="w-20 h-20 object-contain" />
          </div>
        </div>

        {/* 🔥 COVER SECTION */}
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

          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-30 px-4 w-full flex justify-center">
            <div className="flex gap-2 px-3 py-2 rounded-full bg-black/60 backdrop-blur-md shadow-lg border border-white/10">
              {tabs.map((tab, index) => (
                <button
                  key={tab}
                  onClick={() => goToTab(index)}
                  className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-medium transition ${
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
          className="flex w-full min-h-[100vh] overflow-x-auto overflow-y-hidden snap-x snap-mandatory touch-pan-x scrollbar-hide"
        >

          {/* ODY MENU */}
          <div className="min-w-full snap-center px-6 pt-16">
            <div className="min-h-[120vh] flex flex-col items-center justify-start gap-10">
              <p className="text-white/70 text-xl font-medium mt-40">Coming soon</p>
            </div>
          </div>

          {/* MENU */}
          <div className="relative min-w-full snap-center pt-16">
            <div className="absolute top-10 left-0 w-full z-40">

              <div className="px-6">
              <div className="w-full h-11 rounded-full bg-white flex items-center px-4 shadow-md gap-3">
  <img src="/search.png" className="w-5 h-5 opacity-60" />
  <input
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder={`Search in ${localStorage.getItem("restaurantName") || "this restaurant"}`}
    className="flex-1 bg-transparent outline-none text-sm text-black placeholder-gray-400"
  />
</div>

              </div>

              <div className="mt-3 px-4 overflow-x-auto scrollbar-hide">
                <div className="flex gap-3 w-max pb-2">
                  {filters.map((filter) => {
                    const selected = activeFilters.includes(filter);

                    return (
                      <button
                        key={filter}
                        onClick={() => toggleFilter(filter)}
                        className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${
                          selected
                            ? "bg-[#0A84C1] text-white shadow-md"
                            : "bg-[#2A2A2A] text-white/90"
                        }`}
                      >
                        {filter}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="w-full bg-[#E5E5EA] rounded-t-[36px] pt-20 px-6 min-h-[140vh] mt-28">
              <div className="flex flex-col gap-12 mt-6 items-center justify-start">
                <p className="text-gray-600 text-xl font-medium text-center">
                  Coming soon
                </p>
                <div className="h-[800px]" />
              </div>
            </div>
          </div>

          {/* EAT LATER */}
          <div className="min-w-full snap-center px-6 pt-16">
            <div className="min-h-[100vh] flex flex-col items-center justify-start mt-24 gap-5">
              {!user ? (
                <>
                  <img src="/User.png" className="w-20 h-20 opacity-90 invert" />
                  <p className="text-white/70 text-center text-base">
                    Register or Log in to use Eat Later
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setMode("register");
                        setShowPopup(true);
                      }}
                      className="px-7 py-3 rounded-full bg-[#0A84C1] text-white"
                    >
                      Register
                    </button>
                    <button
                      onClick={() => {
                        setMode("login");
                        setShowPopup(true);
                      }}
                      className="px-7 py-3 rounded-full bg-white text-[#0A84C1]"
                    >
                      Log In
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-white/70 text-xl mt-24">
                  Your Eat Later list is empty
                </p>
              )}
            </div>
          </div>

          {/* FAVORITES */}
          <div className="min-w-full snap-center px-6 pt-16">
            <div className="min-h-[100vh] flex flex-col items-center justify-start mt-24 gap-5">
              {!user ? (
                <>
                  <img src="/User.png" className="w-20 h-20 opacity-90 invert" />
                  <p className="text-white/70 text-center text-base">
                    Register or Log in to save Favorites
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setMode("register");
                        setShowPopup(true);
                      }}
                      className="px-7 py-3 rounded-full bg-[#0A84C1] text-white"
                    >
                      Register
                    </button>
                    <button
                      onClick={() => {
                        setMode("login");
                        setShowPopup(true);
                      }}
                      className="px-7 py-3 rounded-full bg-white text-[#0A84C1]"
                    >
                      Log In
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-white/70 text-xl mt-24">
                  Your Favorites list is empty
                </p>
              )}
            </div>
          </div>

        </div>

        {/* 🔥 ASK ODY */}
        <div className="fixed bottom-6 right-[calc(50%-200px+16px)] z-50">
          <button className="flex items-center gap-3 bg-black/70 backdrop-blur-md text-white px-4 py-3 rounded-full shadow-lg border border-white/10">
            <img src="/ody-face.png" className="w-8 h-8 rounded-full" />
            <span className="text-sm font-medium">Ask Ody</span>
          </button>
        </div>

        {/* 🔥 PROFILE POPUP */}
        {showProfile && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[3000]">
    <div className="bg-[#1c1c1c] rounded-xl p-6 w-[80%] max-w-xs space-y-5">

      {/* Title */}
      <p className="text-center text-white font-medium text-lg">
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
            <div className="bg-[#1c1c1c] w-[90%] max-w-sm rounded-2xl p-6 text-white space-y-6 relative">

              <button
                onClick={closePopup}
                className="absolute top-3 right-3 text-white text-lg"
              >
                ✕
              </button>

              {step === "phone" && (
                <>
                  <h2 className="text-lg font-semibold text-center">
                  {mode === "login" ? "Log in" : "Register"}
                  </h2>

                  <input
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder="Enter your phone number"
                    className="w-full p-3 rounded bg-black border border-white/30 text-white"
                  />

                  <button
                    disabled={phone.length !== 10}
                    onClick={() => setStep("otp")}
                    className={`w-full py-3 rounded-full ${
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
                  <h2 className="text-lg font-semibold text-center">
                    Enter OTP
                  </h2>

                  <div className="flex justify-center gap-3">
                    {otp.map((d, i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        value={d}
                        onChange={(e) =>
                          handleOtpChange(e.target.value, i)
                        }
                        maxLength={1}
                        className="w-12 h-12 text-center text-lg bg-black border border-white/30 rounded"
                      />
                    ))}
                  </div>

                  <button
                    disabled={!otpComplete}
                    onClick={() =>
                      mode === "register" ? setStep("name") : verifyLogin()
                    }
                    className={`w-full py-3 rounded-full ${
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
                  <h2 className="text-lg font-semibold text-center">
                    Enter Your Name
                  </h2>

                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full p-3 rounded bg-black border border-white/30 text-white"
                  />

                  <button
                    disabled={name.length < 2}
                    onClick={finishRegister}
                    className={`w-full py-3 rounded-full ${
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

      </div>
    </div>
  );
}