"use client";

export default function OdyLoader({ progress = 0 }: { progress?: number }) {
  return (
    <div className="loader-wrapper">
      <div className="flex flex-col items-center gap-4">
        <img
          src="/buffer_logo.png"
          alt="OdyCard Logo"
          className="ody-logo"
        />
        {progress > 0 && (
          <p style={{ color: "#fff", fontSize: "16px", fontWeight: 600, letterSpacing: "0.5px" }}>
            {progress}%
          </p>
        )}
      </div>
    </div>
  );
}
