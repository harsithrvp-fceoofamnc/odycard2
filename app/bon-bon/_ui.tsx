"use client";
import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

// Shared look-and-feel for the Bon Bon back-of-house dashboards — white + maroon (#811226),
// same palette as the chatbot so it feels like one product.

export const C = {
  maroon: "#811226",
  dark: "#5a0c1a",
  ink: "#2a1212",
  mut: "#9a8585",
  line: "#ecdcdc",
  cream: "#faf2f1",
  card: "#fffdfc",
  bg: "#efe4e2",
  good: "#1b7d3a",
  warn: "#c0392b",
};

export const font =
  "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif";

type Me = { role: "admin" | "supervisor" | "waiter"; name: string; sub: string } | null;

/** Client-side guard: loads the session, redirects to login if the role isn't allowed. */
export function useBBSession(allowed: Array<"admin" | "supervisor" | "waiter">) {
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
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: font, color: C.ink }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "12px 18px",
          background: `linear-gradient(135deg,${C.maroon},${C.dark})`,
          color: "#fff",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/bon_bon_logo.png"
            alt="Bon Bon"
            style={{ height: 34, width: 34, borderRadius: 9, objectFit: "cover", background: "#fff", padding: 2 }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 800, lineHeight: 1.1 }}>{title}</div>
            <div style={{ fontSize: 11.5, opacity: 0.85, textTransform: "capitalize" }}>
              {role} · {name}
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          style={{
            padding: "7px 13px",
            borderRadius: 9,
            border: "1.5px solid rgba(255,255,255,.5)",
            background: "transparent",
            color: "#fff",
            fontWeight: 700,
            fontSize: 13,
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
            gap: 8,
            padding: "10px 18px",
            background: C.card,
            borderBottom: `1px solid ${C.line}`,
            overflowX: "auto",
          }}
        >
          {nav}
        </nav>
      )}
      <main style={{ maxWidth: 1040, margin: "0 auto", padding: "18px 16px 60px" }}>{children}</main>
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
        fontSize: 13.5,
        fontWeight: 700,
        textDecoration: "none",
        whiteSpace: "nowrap",
        background: active ? C.maroon : "#f3e7e6",
        color: active ? "#fff" : C.maroon,
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
