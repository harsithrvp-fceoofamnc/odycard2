"use client";

export default function OdyLoader({ progress = 0, showProgress = true }: { progress?: number; showProgress?: boolean }) {
  return (
    <>
      <style>{`
        @keyframes doubleSpinPause {
          0%     { transform: rotate(0deg); }
          30.77% { transform: rotate(360deg); }
          61.54% { transform: rotate(720deg); }
          100%   { transform: rotate(720deg); }
        }
        .ody-loader-wrapper {
          position: fixed;
          inset: 0;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          background: rgba(0, 0, 0, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
        }
        .ody-spin-logo {
          width: 120px;
          height: 120px;
          animation: doubleSpinPause 2.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .ody-progress-text {
          color: #fff;
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 0.5px;
          margin-top: 16px;
        }
      `}</style>
      <div className="ody-loader-wrapper">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <img
            src="/buffer_logo.png"
            alt="OdyCard"
            className="ody-spin-logo"
          />
          {showProgress && (
            <p className="ody-progress-text">{progress}%</p>
          )}
        </div>
      </div>
    </>
  );
}
