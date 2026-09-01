"use client";
import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

// Shared look-and-feel for the Bon Bon back-of-house dashboards — white + maroon (#811226),
// same palette as the chatbot so it feels like one product.

export const C = {
  maroon: "#8a1530",
  dark: "#5c0d1f",
  ink: "#16131a",
  mut: "#6c7280",
  line: "#ececf0",
  cream: "#fbeef1",
  card: "#ffffff",
  bg: "#eceef2",
  good: "#0e7a55",
  warn: "#c0392b",
};

export const font =
  "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif";

type Me = { role: "admin" | "supervisor" | "waiter" | "kitchen"; name: string; sub: string; tables?: number[] } | null;

/** Client-side guard: loads the session, redirects to login if the role isn't allowed. */
export function useBBSession(allowed: Array<"admin" | "supervisor" | "waiter" | "kitchen">) {
  const router = useRouter();
  const [me, setMe] = useState<Me>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch("/api/bonbon/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const s: Me = d.session || null;
        if (!s || !allowed.includes(s.role)) {
          router.replace("/bon-bon/login");
          return;
        }
        setMe(s);
        setReady(true);
      })
      .catch(() => router.replace("/bon-bon/login"));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { me, ready };
}

export function Shell({
  title,
  role,
  name,
  children,
  nav,
}: {
  title: string;
  role: string;
  name: string;
  children: ReactNode;
  nav?: ReactNode;
}) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/bonbon/auth/logout", { method: "POST" });
    router.replace("/bon-bon/login");
  }
  return (
    <div style={{ minHeight: "100vh", background: "#e7e9ee", fontFamily: font, color: C.ink }}>
      {/* clean light backdrop behind the phone-width column; hide scrollbars inside the column */}
      <style>{`
        html, body { background: #e7e9ee !important; }
        .bbcol *::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; }
        .bbcol, .bbcol * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
        .bbcol main > * { opacity: 0; animation: bbin .5s cubic-bezier(.2,.8,.2,1) forwards; }
        .bbcol main > *:nth-child(1){animation-delay:.02s}.bbcol main > *:nth-child(2){animation-delay:.07s}
        .bbcol main > *:nth-child(3){animation-delay:.12s}.bbcol main > *:nth-child(4){animation-delay:.17s}
        .bbcol main > *:nth-child(n+5){animation-delay:.22s}
        @keyframes bbin { from { opacity:0; transform: translateY(14px) } to { opacity:1; transform:none } }
      `}</style>
      <div
        className="bbcol"
        style={{
          maxWidth: 460,
          margin: "0 auto",
          minHeight: "100vh",
          background: C.bg,
          boxShadow: "0 0 40px rgba(20,10,15,.09)",
        }}
      >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "13px 16px",
          background: "rgba(255,255,255,.92)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid #e7e9ec",
          color: C.ink,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/bon_bon_logo.png"
            alt="Bon Bon"
            style={{ height: 34, width: 34, borderRadius: 9, objectFit: "cover" }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 700, letterSpacing: "-.01em", lineHeight: 1.15 }}>{title}</div>
            <div style={{ fontSize: 11.5, color: "#8a8a90", textTransform: "capitalize", marginTop: 1 }}>
              {role} · {name}
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          style={{
            padding: "7px 13px",
            borderRadius: 9,
            border: "1px solid #e4e4e7",
            background: "#fff",
            color: "#6c7280",
            fontWeight: 600,
            fontSize: 12.5,
            cursor: "pointer",
          }}
        >
          Log out
        </button>
      </header>
      {nav && (
        <nav
          style={{
            display: "flex",
            gap: 7,
            padding: "10px 16px",
            background: "#fff",
            borderBottom: `1px solid ${C.line}`,
            overflowX: "auto",
          }}
        >
          {nav}
        </nav>
      )}
      <main style={{ padding: "15px 15px 72px", display: "flex", flexDirection: "column", gap: 13 }}>{children}</main>
      </div>
    </div>
  );
}

export function NavLink({ href, active, children }: { href: string; active?: boolean; children: ReactNode }) {
  return (
    <a
      href={href}
      style={{
        padding: "7px 13px",
        borderRadius: 9,
        fontSize: 12.5,
        fontWeight: 700,
        textDecoration: "none",
        whiteSpace: "nowrap",
        background: active ? C.maroon : "#fff",
        color: active ? "#fff" : C.maroon,
        border: `1px solid ${active ? C.maroon : "#f0dbe0"}`,
      }}
    >
      {children}
    </a>
  );
}

/** Password input with a show/hide (eye) toggle. Pass the full input style; marginTop is honoured. */
export function PasswordField({
  value,
  onChange,
  placeholder,
  style,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  const mt = style?.marginTop;
  const inputStyle: React.CSSProperties = { ...(style || {}), marginTop: 0, paddingRight: 42, width: "100%", boxSizing: "border-box" };
  return (
    <div style={{ position: "relative", marginTop: mt }}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        style={inputStyle}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        title={show ? "Hide password" : "Show password"}
        style={{
          position: "absolute",
          right: 4,
          top: 0,
          bottom: 0,
          width: 38,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          border: 0,
          padding: 0,
          cursor: "pointer",
          color: C.mut,
        }}
      >
        {show ? (
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C5 20 1 12 1 12a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12A3 3 0 1 1 9.88 9.88" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

/** Dropdown to switch which outlet's data the current dashboard shows (menu/kitchen/waiter).
 *  Reloads the same page with ?outlet=<id>. Only appears once there's an outlet to pick. */
export function OutletSwitcher() {
  const [outlets, setOutlets] = useState<{ id: number; name: string }[]>([]);
  const [cur, setCur] = useState("");
  useEffect(() => {
    setCur(new URLSearchParams(window.location.search).get("outlet") || "");
    fetch("/api/bonbon/outlets")
      .then((r) => (r.ok ? r.json() : { outlets: [] }))
      .then((d) => setOutlets(d.outlets || []))
      .catch(() => {});
  }, []);
  if (outlets.length === 0) return null;
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  const curId = cur || String(outlets[0].id);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      <span style={{ fontSize: 12.5, color: C.mut, fontWeight: 700 }}>Outlet</span>
      <select
        value={curId}
        onChange={(e) => {
          window.location.href = `${path}?outlet=${e.target.value}`;
        }}
        style={{
          flex: 1,
          padding: "8px 11px",
          borderRadius: 10,
          border: `1.5px solid ${C.line}`,
          background: "#fff",
          color: C.ink,
          fontSize: 14,
          fontWeight: 600,
          outline: "none",
        }}
      >
        {outlets.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div style={{ padding: 50, textAlign: "center", color: C.mut, fontFamily: font }}>
      <div
        style={{
          width: 26,
          height: 26,
          border: `3px solid ${C.line}`,
          borderTopColor: C.maroon,
          borderRadius: "50%",
          margin: "0 auto 12px",
          animation: "bbspin 0.8s linear infinite",
        }}
      />
      {label}
      <style>{`@keyframes bbspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
