import type { Metadata } from "next";
import "./globals.css";
import { LoaderProvider } from "@/context/LoaderContext";
import Analytics from "@/components/Analytics";

// Site-wide metadata. Without a real description here Google had nothing to quote, so it
// scraped whatever text was on the page and printed "Enter access code Unlock Authorised
// access only" as the search result. A description tag gives it something to use instead.
//
// metadataBase makes the relative og:image below resolve to an absolute URL, which is what
// WhatsApp, iMessage and Twitter need in order to show a preview card.
export const metadata: Metadata = {
  metadataBase: new URL("https://www.odysra.com"),
  title: {
    default: "Odysra — AI menus for restaurants",
    template: "%s · Odysra",
  },
  description:
    "Odysra builds AI-powered digital menus for restaurants and food brands. Guests scan a QR code, " +
    "browse the full menu on their phone and get recommendations — and owners see what people actually want.",
  applicationName: "Odysra",
  keywords: ["Odysra", "digital menu", "QR menu", "restaurant menu", "AI waiter", "food tech", "Chennai"],
  authors: [{ name: "Odysra" }],
  openGraph: {
    type: "website",
    siteName: "Odysra",
    url: "https://www.odysra.com",
    title: "Odysra — AI menus for restaurants",
    description:
      "Scan, browse, decide. AI-powered digital menus for restaurants and food brands.",
    images: [{ url: "/odysra_logo.png", width: 1200, height: 630, alt: "Odysra" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Odysra — AI menus for restaurants",
    description: "Scan, browse, decide. AI-powered digital menus for restaurants and food brands.",
    images: ["/odysra_logo.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* renders nothing; no-op unless NEXT_PUBLIC_GA_ID is set */}
        <Analytics />
        <LoaderProvider>
          {children}
        </LoaderProvider>
      </body>
    </html>
  );
}
