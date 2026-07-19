import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import seed from "@/lib/bonbonMenuSeed.json";
import { bbMenuCol } from "@/lib/bonbon";
import { catOrder, catLabels } from "@/lib/bonbonMenu";
import MenuViewer, { type MenuCategory } from "./MenuViewer";

// Public QR menu — the premium "Butter Crafted Ice Creams" card. Rendered from the LIVE menu data,
// so price / sold-out / best-seller edits from the supervisor show up here automatically.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Bon Bon — Menu", description: "Bon Bon — Butter Crafted Ice Creams." };
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 5, userScalable: true, themeColor: "#17100e" };

const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--f-serif", display: "swap" });
const sans = Jost({ subsets: ["latin"], weight: ["400", "500"], variable: "--f-sans", display: "swap" });

type Doc = { key?: string; name: string; price: number; cat: string; best?: number; must?: number; available?: number; hidden?: number; sort?: number };
const HERO: Record<string, string> = { scoops: "cat_scoops", softy: "cat_softy", waffle: "cat_waffle", icecream: "cat_icecream", sundae: "cat_sundae", mini: "cat_mini", rolls: "cat_rolls", falooda: "cat_falooda", shakes: "cat_shakes", snacks: "cat_snacks" };
const STRIP: Record<string, string> = { shakes: "Shake", falooda: "Falooda", sundae: "Sundae", rolls: "Roll" };

async function loadMenu(): Promise<Doc[]> {
  try {
    const snap = await bbMenuCol(null).get();
    if (!snap.empty) return snap.docs.map((d) => ({ ...(d.data() as Doc), key: d.id }));
  } catch {}
  return seed as Doc[];
}

export default async function MenuPage() {
  const docs = await loadMenu();
  const cats: MenuCategory[] = [];
  for (const cat of catOrder) {
    const items = docs
      .filter((d) => d.cat === cat && d.available !== 0 && !d.hidden)
      .sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0))
      .map((d) => {
        let name = d.name;
        if (STRIP[cat]) name = name.replace(new RegExp("\\s+" + STRIP[cat] + "$"), "");
        return { name, price: d.price, badge: d.best ? ("best" as const) : d.must ? ("must" as const) : null };
      });
    if (!items.length) continue;
    cats.push({ key: cat, title: catLabels[cat] || cat, hero: HERO[cat] || "cat_scoops", eyebrow: cat === "icecream" ? "Best seller" : null, items });
  }
  return (
    <div className={`${serif.variable} ${sans.variable}`}>
      <MenuViewer categories={cats} />
    </div>
  );
}
