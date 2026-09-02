"use client";
import Script from "next/script";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { GA_ID } from "@/lib/ga";

/**
 * GA4 for the whole site. Renders nothing and changes no UI.
 *
 * Two things here are not the boilerplate snippet, and both are deliberate:
 *
 * 1. send_page_view is OFF in the config, and page_view is sent from an effect instead.
 *    The App Router changes routes without reloading the document, so the stock snippet
 *    would count the first page and then never fire again. Sending it ourselves also
 *    avoids the duplicate first hit you get if you leave the automatic one enabled.
 *
 * 2. The three stall menus are static HTML served inside an iframe, so they have no gtag
 *    of their own. They postMessage their events up here and we replay them into the
 *    parent's GA context — one property, one session, correct page path. Messages are
 *    accepted only from our own origin and only the event name and params are read.
 */
export default function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!GA_ID || typeof window.gtag !== "function") return;
    window.gtag("event", "page_view", {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname]);

  useEffect(() => {
    if (!GA_ID) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return; // ignore anything not ours
      const d = e.data as { __odyga?: { name?: unknown; params?: unknown } } | null;
      const name = d?.__odyga?.name;
      if (typeof name !== "string" || typeof window.gtag !== "function") return;
      const params = d?.__odyga?.params;
      window.gtag("event", name, params && typeof params === "object" ? params : {});
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  if (!GA_ID) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', '${GA_ID}', { send_page_view: false });
      `}</Script>
    </>
  );
}
