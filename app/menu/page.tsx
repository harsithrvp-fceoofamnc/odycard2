import type { Metadata, Viewport } from "next";
import MenuViewer from "./MenuViewer";

// Public QR menu — swipe through the Bon Bon menu card. No access gate (customers scan it).
export const metadata: Metadata = {
  title: "Bon Bon — Menu",
  description: "Bon Bon Ice Creams — the gourmet ice cream menu.",
};

// allow pinch-zoom so customers can read the pages
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#5a0c1a",
};

export default function MenuPage() {
  return <MenuViewer />;
}
