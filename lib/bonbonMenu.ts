// Category metadata for the Bon Bon menu — shared by API routes and dashboard pages.
// (The actual item data lives in Firestore, seeded from lib/bonbonMenuSeed.json.)

export const catOrder = [
  "scoops",
  "softy",
  "waffle",
  "icecream",
  "sundae",
  "mini",
  "rolls",
  "falooda",
  "shakes",
  "snacks",
] as const;

export type CatKey = (typeof catOrder)[number];

export const catLabels: Record<string, string> = {
  scoops: "Scoops",
  softy: "Softy",
  waffle: "Waffle",
  icecream: "Ice Cream Specials",
  sundae: "Sundae",
  mini: "Mini Sundae",
  rolls: "Roll Ice Cream",
  falooda: "Falooda",
  shakes: "Thick Shakes",
  snacks: "Snacks",
  addon: "Add-ons",
};

export type BBMenuItem = {
  key: string;
  name: string;
  price: number;
  price500?: number;
  cat: string;
  cat_label: string;
  q: string;
  pt: number;
  desc: string;
  veg: number;
  best: number;
  must: number;
  promoted?: number; // show on the welcome screen when a customer arrives
  available: number;
  hidden: number;
  sort: number;
  ao?: string;
  ph?: string; // dish photo URL (Cloudinary); empty = show the logo block
};
