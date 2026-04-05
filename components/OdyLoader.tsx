"use client";

export default function OdyLoader({ progress = 0, showProgress = true }: { progress?: number; showProgress?: boolean }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
        <img
          src="/buffer_logo.png"
          alt="OdyCard"
          className="animate-ody-spin"
          style={{ width: 120, height: 120 }}
        />
        {showProgress && (
          <p style={{ color: "#fff", fontSize: 16, fontWeight: 600, letterSpacing: "0.5px" }}>
            {progress}%
          </p>
        )}
      </div>
    </div>
  );
}
