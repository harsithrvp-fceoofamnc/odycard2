"use client";

export default function OdyLoader({ progress = 0 }: { progress?: number }) {
  return (
    <div className="loader-wrapper">
      {/* Spinning logo */}
      <img
        src="/buffer_logo.png"
        alt="OdyCard"
        className="ody-logo"
      />

      {/* macOS style thin progress bar at bottom */}
      <div className="ody-progress-track">
        <div
          className="ody-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
