import type { Metadata, Viewport } from "next";
import FestApp from "./FestApp";

// Public QR page for the VIT Chennai food stall — three menus, no AI, no payment.
export const metadata: Metadata = {
  title: "Odysra — VIT Food Stall",
  description: "Bon Bon · D'VOUR · Kim Chi & Ramen — browse all three menus.",
};
export const viewport: Viewport = {
  width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false, themeColor: "#000000",
};

export default function BonBonStallPage() {
  return <FestApp />;
}
