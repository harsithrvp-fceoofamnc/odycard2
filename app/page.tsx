"use client";
import { useState, useEffect } from "react";

// odysra.com homepage = futuristic access-code screen. Starts locked on every load.
// On the correct code it opens the Hub (or the specific demo the visitor came from).
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
      <div className="glow g1" />
      <div className="glow g2" />
      <div className="grid" />
      <div className={"card" + (mounted ? " in" : "")}>
        <div className="orb"><span>O</span></div>
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
            <span>{busy ? "Verifying…" : "Unlock"}</span>
          </button>
        </form>
        <div className="foot">Authorised access only</div>
      </div>

      <style>{`
        *{box-sizing:border-box}
        .gate{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;overflow:hidden;
          background:radial-gradient(1200px 700px at 50% -10%,#1a2030 0%,#0c0e14 55%,#08090d 100%);
          font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;padding:20px}
        .grid{position:absolute;inset:0;background-image:linear-gradient(rgba(227,185,86,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(227,185,86,.05) 1px,transparent 1px);background-size:46px 46px;mask-image:radial-gradient(circle at 50% 40%,#000 0%,transparent 75%);-webkit-mask-image:radial-gradient(circle at 50% 40%,#000 0%,transparent 75%);animation:drift 22s linear infinite}
        @keyframes drift{to{background-position:46px 46px,46px 46px}}
        .glow{position:absolute;border-radius:50%;filter:blur(80px);opacity:.5;pointer-events:none}
        .g1{width:520px;height:520px;background:radial-gradient(circle,#c79233,transparent 65%);top:-180px;left:-120px;animation:float1 16s ease-in-out infinite}
        .g2{width:480px;height:480px;background:radial-gradient(circle,#3d6bff,transparent 65%);bottom:-200px;right:-140px;opacity:.35;animation:float2 20s ease-in-out infinite}
        @keyframes float1{0%,100%{transform:translate(0,0)}50%{transform:translate(60px,50px)}}
        @keyframes float2{0%,100%{transform:translate(0,0)}50%{transform:translate(-50px,-40px)}}
        .card{position:relative;z-index:2;width:360px;max-width:100%;padding:38px 30px 26px;text-align:center;border-radius:24px;
          background:rgba(255,255,255,.05);border:1px solid rgba(227,185,86,.22);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
          box-shadow:0 30px 80px rgba(0,0,0,.55);opacity:0;transform:translateY(18px) scale(.98);transition:.6s cubic-bezier(.2,.9,.3,1)}
        .card.in{opacity:1;transform:none}
        .orb{width:64px;height:64px;margin:0 auto 16px;border-radius:18px;display:flex;align-items:center;justify-content:center;
          color:#1b1408;font-weight:800;font-size:30px;background:conic-gradient(from 130deg,#e3b956,#c79233,#f0d28a,#c79233,#e3b956);
          box-shadow:0 0 0 1px rgba(227,185,86,.5),0 12px 30px rgba(199,146,51,.4);animation:spin 12s linear infinite}
        .orb span{animation:spin 12s linear infinite reverse;display:block}
        @keyframes spin{to{transform:rotate(360deg)}}
        .word{font-size:27px;font-weight:800;letter-spacing:4px;background:linear-gradient(100deg,#f3d9a0,#e3b956,#fff4d6,#e3b956);
          -webkit-background-clip:text;background-clip:text;color:transparent;background-size:250% 100%;animation:hue 7s linear infinite}
        @keyframes hue{to{background-position:250% 0}}
        .tag{font-size:12.5px;color:#9aa3b5;margin:6px 0 30px;letter-spacing:.4px}
        .lab{font-size:13px;color:#c9cfdd;margin-bottom:12px;letter-spacing:.3px}
        .pin{width:100%;text-align:center;font-size:30px;letter-spacing:14px;padding:14px 10px;border-radius:14px;
          border:1.5px solid rgba(227,185,86,.35);background:rgba(8,10,16,.6);color:#fff;outline:none;transition:.2s}
        .pin:focus{border-color:#e3b956;box-shadow:0 0 0 4px rgba(227,185,86,.16)}
        .pin.bad{border-color:#e76f51;animation:shake .3s}
        @keyframes shake{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
        .errl{color:#f4a261;font-size:13px;margin-top:10px}
        .unlock{position:relative;overflow:hidden;width:100%;margin-top:18px;padding:14px;border:0;border-radius:13px;cursor:pointer;
          font-weight:800;font-size:15px;letter-spacing:.5px;color:#1b1408;background:linear-gradient(135deg,#e3b956,#c79233);
          box-shadow:0 10px 26px rgba(199,146,51,.4);transition:transform .15s,box-shadow .2s}
        .unlock:hover{transform:translateY(-2px);box-shadow:0 16px 34px rgba(199,146,51,.5)}
        .unlock:active{transform:translateY(0) scale(.99)}
        .unlock:disabled{opacity:.6}
        .foot{font-size:11px;color:#6a7283;margin-top:22px;letter-spacing:.5px}
      `}</style>
    </div>
  );
}
