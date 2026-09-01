// ── Limited-time combos across the three fest stalls ─────────────────────────
// A combo bundles items from ANY stall at one fixed price. It surfaces in the
// "Combos" tab of every stall it draws an item from — so a ramen + ice cream combo
// appears under Kim Chi & Ramen and Bon Bon, but NOT under D'VOUR.

import { bbDb } from "@/lib/bonbon";
import { findFestItem } from "@/lib/festMenu";

export const FEST_COMBOS = "fest_combos";

export type Combo = {
  id: string;
  name: string;
  desc: string;
  price: number;          // fixed combo price the owner types
  itemIds: string[];      // ids from lib/festMenu
  active: boolean;        // manual override — off hides it regardless of schedule
  startsAt?: string | null; // ISO; null = no start limit
  endsAt?: string | null;   // ISO; null = no end limit
  created_at?: string;
};

/** Which stalls does this combo touch? Drives where the Combos tab appears. */
export function comboStalls(c: Pick<Combo, "itemIds">): string[] {
  const s = new Set<string>();
  for (const id of c.itemIds) {
    const it = findFestItem(id);
    if (it) s.add(it.stall);
  }
  return [...s];
}

/** Sum of the individual items — used for the struck-through price and "you save". */
export function comboOriginal(c: Pick<Combo, "itemIds">): number {
  return c.itemIds.reduce((t, id) => t + (findFestItem(id)?.p || 0), 0);
}

/** Live right now? Manual switch AND inside the schedule window. */
export function comboLive(c: Combo, now = Date.now()): boolean {
  if (!c.active) return false;
  if (c.startsAt && now < Date.parse(c.startsAt)) return false;
  if (c.endsAt && now > Date.parse(c.endsAt)) return false;
  return true;
}

export async function listCombos(): Promise<Combo[]> {
  const snap = await bbDb().collection(FEST_COMBOS).get();
  return snap.docs
    .map((d) => ({ ...(d.data() as Omit<Combo, "id">), id: d.id }))
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
}
