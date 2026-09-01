import type { Metadata, Viewport } from "next";
import ScoopStacker from "./ScoopStacker";

// Scoop Stacker — the little game guests play while they wait. Reached from the menu.
export const metadata: Metadata = { title: "Bon Bon — Scoop Stacker", description: "Stack the scoops. How high can you go?" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false, themeColor: "#8a1530" };

export default function GamePage() {
  return <ScoopStacker />;
}
