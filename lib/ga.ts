// Google Analytics 4.
//
// The measurement ID comes from the environment, never the source, so the same code runs
// with analytics off locally and on in production. Set NEXT_PUBLIC_GA_ID in Vercel to a
// value like "G-XXXXXXXXXX"; with it unset, every call here is a silent no-op and not a
// single byte is loaded from Google.
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";

export type GAParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/** Send one GA4 event. Safe to call during SSR, before gtag loads, or with GA_ID unset. */
export function track(name: string, params: GAParams = {}): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}
