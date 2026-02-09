"use client";

export default function ProgressBar({ progress = 0, className = "" }) {
  return (
    <div className={`w-full h-1 bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full bg-[#0A84C1] transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
}
