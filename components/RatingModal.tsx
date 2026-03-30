"use client";

import { useState } from "react";
import { API_BASE } from "@/lib/api";

interface RatingModalProps {
  hotelId: number;
  hotelName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const LOW_RATING_REASONS = [
  "Food quality",
  "Slow service",
  "Wrong order",
  "Cold food",
  "Too expensive",
  "Unhygienic",
  "Staff attitude",
  "Other",
];

export default function RatingModal({ hotelId, hotelName, onClose, onSuccess }: RatingModalProps) {
  const [stars, setStars] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [lowReason, setLowReason] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isLowRating = stars > 0 && stars <= 2;

  const starLabel = ["", "Poor 😞", "Fair 😐", "Good 🙂", "Great 😊", "Excellent 🤩"][stars] || "";

  const handleSubmit = async () => {
    if (stars === 0) {
      setError("Please select a star rating");
      return;
    }
    if (isLowRating && !lowReason) {
      setError("Please tell us what went wrong");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotel_id: hotelId,
          stars,
          low_rating_reason: isLowRating ? lowReason : null,
          comment: comment.trim() || null,
          visitor_name: visitorName.trim() || null,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Failed to submit. Try again.");
        setLoading(false);
        return;
      }

      onSuccess();
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center">
      <div
        className="w-full max-w-md bg-white rounded-t-[32px] px-6 pt-6 pb-10"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-6" />

        <h2 className="text-black text-xl font-semibold mb-1">Rate your experience</h2>
        <p className="text-gray-500 text-sm mb-6">{hotelName}</p>

        {/* STARS */}
        <div className="flex justify-center gap-3 mb-3">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onMouseEnter={() => setHoveredStar(s)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => { setStars(s); setLowReason(null); }}
              className="text-5xl transition-transform active:scale-110"
              style={{ lineHeight: 1 }}
            >
              <span style={{ color: s <= (hoveredStar || stars) ? "#FBBF24" : "#E5E7EB" }}>★</span>
            </button>
          ))}
        </div>

        {stars > 0 && (
          <p className="text-center text-gray-600 text-sm mb-6 font-medium">{starLabel}</p>
        )}

        {/* LOW RATING REASON */}
        {isLowRating && (
          <div className="mb-6">
            <p className="text-black font-medium text-sm mb-3">What went wrong?</p>
            <div className="flex flex-wrap gap-2">
              {LOW_RATING_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setLowReason(reason)}
                  className={`px-4 py-2 rounded-full text-sm border transition ${
                    lowReason === reason
                      ? "bg-red-100 border-red-400 text-red-700 font-medium"
                      : "bg-white border-gray-200 text-gray-600"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* OPTIONAL COMMENT */}
        <div className="mb-4">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment (optional)"
            rows={3}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-black placeholder-gray-400 resize-none focus:outline-none focus:border-[#0A84C1]"
          />
        </div>

        {/* OPTIONAL NAME */}
        <div className="mb-6">
          <input
            type="text"
            value={visitorName}
            onChange={(e) => setVisitorName(e.target.value)}
            placeholder="Your name (optional)"
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-black placeholder-gray-400 focus:outline-none focus:border-[#0A84C1]"
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        {/* SUBMIT */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-[#0A84C1] text-white font-semibold text-base disabled:opacity-60 mb-3"
        >
          {loading ? "Submitting..." : "Submit Rating"}
        </button>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-gray-100 text-gray-700 font-medium text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
