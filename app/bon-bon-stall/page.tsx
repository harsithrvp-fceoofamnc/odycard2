import type { Metadata, Viewport } from "next";
import FestApp from "./FestApp";

// Public QR page for the VIT Chennai food stall — three menus, no AI, no payment.
export const metadata: Metadata = {
  title: "VIT Food Stall",
  description:
    "Bon Bon Ice Creams, D'VOUR and Kim Chi & Ramen at VIT Chennai — browse all three menus on your phone.",
  openGraph: {
    title: "Odysra — VIT Food Stall",
    description: "Bon Bon · D'VOUR · Kim Chi & Ramen. Browse all three menus on your phone.",
    images: [{ url: "/odysra_logo.png", alt: "Odysra" }],
  },
};
export const viewport: Viewport = {
  width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false, themeColor: "#000000",
};

export default function BonBonStallPage() {
  return <FestApp />;
}
