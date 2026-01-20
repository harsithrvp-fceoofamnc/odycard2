"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function PaymentPage() {
  const router = useRouter();

  const handleStartTrial = () => {
    router.push("/owner/dashboard");
  };

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-white overflow-y-auto">
        <div className="px-6 pt-12 pb-28">

          {/* TITLE */}
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-black mb-6"
            style={{ fontSize: "52px", fontWeight: 600, lineHeight: "1.1" }}
          >
            Get<br />OdyCard
          </motion.h1>

          {/* SUBTITLE */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-gray-600 mb-12"
            style={{ fontSize: "18px" }}
          >
            Start with 10 free uploads + a 14-day free trial.<br />
            No immediate charges.
          </motion.p>

          {/* PLAN CARD */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="border border-gray-300 rounded-2xl p-6 mb-12"
          >
            {/* PRICE */}
            <div className="mb-6">
              <span className="text-[36px] font-semibold text-black">₹399</span>
              <span className="text-gray-600 text-[18px]"> / month</span>
              <p className="text-gray-500 text-sm mt-1">
                Charged after trial ends
              </p>
            </div>

            {/* BENEFITS */}
            <h3 className="text-black mb-4 font-semibold text-[20px]">
              Your OdyCard Benefits
            </h3>

            <ul className="space-y-3 text-[17px] text-gray-700">
              <li>✅ 10 free video uploads</li>
              <li>✅ Unlimited photo uploads</li>
              <li>✅ 14-day full access</li>
              <li>✅ QR-menu hosting</li>
              <li>✅ Daily performance insights</li>
              <li>✅ Item ratings summary</li>
              <li>✅ Low-rated items + reviews</li>
              <li>✅ Menu preview</li>
            </ul>
          </motion.div>

          {/* CTA */}
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            onClick={handleStartTrial}
            className="w-full rounded-full bg-[#0A84C1] text-white font-semibold"
            style={{ fontSize: "18px", padding: "16px" }}
          >
            Start 14-Day Free Trial
          </motion.button>

          {/* FOOTER */}
          <p className="text-center text-gray-500 text-sm mt-6">
            Cancel anytime before trial ends
          </p>

        </div>
      </div>
    </div>
  );
}