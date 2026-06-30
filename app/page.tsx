"use client";
import { useState, useEffect } from "react";

// odysra.com homepage = clean, professional access-code screen. Locked on every load.
// Correct code opens the Hub (or the specific demo the visitor came from).
export default function Home() {
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length < 4) return;
    setBusy(true);
    setErr(false);
    try {
      const r = await fetch("/api/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (r.ok) {
        const nx = new URLSearchParams(window.location.search).get("next");
        window.location.href = nx && (nx.startsWith("/annapoorna") || nx.startsWith("/restaurant")) ? nx : "/hub";
        return;
      }
      setErr(true);
      setCode("");
    } catch {
      setErr(true);
    }
    setBusy(false);
  }

  return (
    <div className="gate">
      <div className={"card" + (mounted ? " in" : "")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="logo" src="/odysra_logo.png" alt="Odysra" />
        <div className="word">ODYSRA</div>
        <div className="tag">The soul behind the menu</div>

        <form onSubmit={submit}>
          <div className="lab">Enter access code</div>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoFocus
            placeholder="••••••"
            className={"pin" + (err ? " bad" : "")}
          />
          {err && <div className="errl">Wrong code — try again.</div>}
          <button type="submit" disabled={busy} className="unlock">
            {busy ? "Verifying…" : "Unlock"}
          </button>
        </form>
        <div className="foot">Authorised access only</div>
      </div>

      <style>{`
        *{box-sizing:border-box}
        .gate{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:20px;
          background:radial-gradient(900px 600px at 50% -10%,#ffffff, #f4f5f7 70%);
          font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Inter,sans-serif}
        .card{width:368px;max-width:100%;padding:38px 32px 26px;text-align:center;border-radius:20px;background:#fff;
          border:1px solid #e7e9ee;box-shadow:0 24px 60px rgba(17,19,24,.10),0 2px 6px rgba(17,19,24,.04);
          opacity:0;transform:translateY(14px);transition:.55s cubic-bezier(.2,.9,.3,1)}
        .card.in{opacity:1;transform:none}
        .logo{width:62px;height:62px;object-fit:contain;display:block;margin:0 auto 12px}
        .word{font-size:22px;font-weight:800;letter-spacing:5px;color:#15171c}
        .tag{font-size:12.5px;color:#8a909c;margin:6px 0 30px;letter-spacing:.3px}
        .lab{font-size:13px;color:#4b5160;margin-bottom:12px}
        .pin{width:100%;text-align:center;font-size:28px;letter-spacing:14px;padding:13px 10px;border-radius:12px;
          border:1.5px solid #e1e4ea;background:#fbfbfc;color:#15171c;outline:none;transition:.18s}
        .pin:focus{border-color:#2f6fed;box-shadow:0 0 0 4px rgba(47,111,237,.12);background:#fff}
        .pin.bad{border-color:#e5484d;animation:shake .3s}
        @keyframes shake{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
        .errl{color:#e5484d;font-size:13px;margin-top:10px}
        .unlock{width:100%;margin-top:18px;padding:13px;border:0;border-radius:12px;cursor:pointer;font-weight:700;font-size:15px;
          color:#fff;background:#15171c;transition:transform .15s,background .2s,box-shadow .2s;box-shadow:0 8px 20px rgba(17,19,24,.18)}
        .unlock:hover{background:#000;transform:translateY(-1px);box-shadow:0 12px 26px rgba(17,19,24,.24)}
        .unlock:active{transform:translateY(0)}
        .unlock:disabled{opacity:.55}
        .foot{font-size:11px;color:#a2a8b4;margin-top:22px;letter-spacing:.4px}
        @media (max-width:420px){
          .gate{padding:16px}
          .card{padding:30px 22px 22px;border-radius:18px}
          .logo{width:54px;height:54px}
          .word{font-size:20px;letter-spacing:4px}
          .pin{font-size:24px;letter-spacing:9px}
        }
      `}</style>
    </div>
  );
}
