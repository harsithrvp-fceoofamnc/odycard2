import { Suspense } from "react";
import EnterForm from "./EnterForm";
import { siteAuthConfigured } from "@/lib/siteAuth";

// The sign-in screen for the whole site.
//
// Deliberately says nothing about what is behind it — no page names, no product copy,
// nothing for a stranger or a crawler to learn. noindex for the same reason.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function EnterPage() {
  const configured = siteAuthConfigured();

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <div style={S.mark}>Odysra</div>
        <p style={S.sub}>Sign in to continue</p>

        {configured ? (
          // useSearchParams needs a Suspense boundary in the App Router
          <Suspense fallback={<div style={{ height: 250 }} />}>
            <EnterForm />
          </Suspense>
        ) : (
          <p style={S.warn}>
            Sign-in is not configured yet. Set <code style={S.code}>SITE_USER</code> and{" "}
            <code style={S.code}>SITE_PASS</code> in the Vercel environment, then redeploy.
          </p>
        )}
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100dvh", background: "#0b0b0c", color: "#f1f1f1",
    display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 18px",
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  },
  wrap: { width: "100%", maxWidth: 330, display: "flex", flexDirection: "column", alignItems: "flex-start" },
  mark: { fontSize: 27, fontWeight: 800, letterSpacing: "-.02em" },
  sub: { fontSize: 14, color: "#8e8e96", margin: "6px 0 20px" },
  warn: { fontSize: 13.5, color: "#e0b26a", lineHeight: 1.55, margin: 0 },
  code: { background: "#1a1a1d", padding: "1px 6px", borderRadius: 6, fontSize: 12.5 },
};
