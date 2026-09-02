// ── VIT Chennai food-stall menus ─────────────────────────────────────────────
// Transcribed verbatim from the three printed A3/A4 menu cards. Descriptions are
// EXACTLY as printed — do not paraphrase them. Prices in INR.
//
// veg: 1 = vegetarian, 0 = non-vegetarian.
// tag: badge shown on the card ("NEW" comes from the printed menu; "BESTSELLER" /
//      "MUST TRY" are ours and can be changed freely).
// off: 1 = sold out today (admin toggles this; the card greys out).

export type FestItem = {
  id: string;
  n: string;          // dish name
  p: number;          // price
  d: string;          // description, exactly as printed ("" where the card has none)
  veg: 0 | 1;
  tag?: string;
  off?: 0 | 1;
};

export type FestCategory = { key: string; label: string; items: FestItem[] };

export type FestStall = {
  key: "bonbon" | "kimchi" | "dvour";
  name: string;
  tagline: string;
  categories: FestCategory[];
};

/* ═══════════════════════ BON BON ICE CREAMS ═══════════════════════ */
const BONBON: FestStall = {
  key: "bonbon",
  name: "Bon Bon",
  tagline: "THE GOURMET ICE CREAM",
  categories: [
    {
      key: "icecreams",
      label: "🍨 Ice Creams",
      items: [
        { id: "bb_vanilla",   n: "Vanilla",              p: 60, d: "Slow-churned Madagascar vanilla. Clean, cold and never just one scoop.", veg: 1 },
        { id: "bb_cookies",   n: "Cookies & Cream",      p: 60, d: "Chocolate cookies crushed through thick vanilla cream — crunch in every spoon.", veg: 1, tag: "BESTSELLER"},
        { id: "bb_belgian",   n: "Belgian Chocolate",    p: 60, d: "Dark Belgian cocoa churned until it is almost fudge.", veg: 1 },
        { id: "bb_lotus",     n: "Lotus Biscoff",        p: 60, d: "Caramelised Biscoff swirled into cream, with crumbled biscuit running right through.", veg: 1, tag: "MUST TRY"},
        { id: "bb_caramel",   n: "Caramel Nutty Crunch", p: 60, d: "Golden caramel and toasted nuts, with a crunch in every single bite.", veg: 1 },
        { id: "bb_cotton",    n: "Cotton Candy",         p: 60, d: "Spun sugar in ice cream form — pink, sweet and straight off the carnival stand.", veg: 1 },
        { id: "bb_spanish",   n: "Spanish Delight",      p: 60, d: "Cinnamon-warm and nutty. Our smoothest scoop, and quietly the one people come back for.", veg: 1, tag: "MUST TRY"},
      ],
    },
    {
      key: "bubble",
      label: "🧋 Bubble Shakes",
      items: [
        { id: "bb_bub_hops",    n: "Hopscotch Butterscotch Bubble Shake", p: 150, d: "Thick butterscotch shake, ice cold, loaded with chewy boba pearls.", veg: 1 },
        { id: "bb_bub_belgian", n: "Belgian Chocolate Bubble Shake",      p: 150, d: "Deep Belgian chocolate shake with boba pearls waiting at the bottom.", veg: 1 },
        { id: "bb_bub_cookie",  n: "Cookie and Cream Bubble Shake",       p: 150, d: "Cookies blitzed into cream, with boba to chew on right down to the last sip.", veg: 1, tag: "BESTSELLER"},
      ],
    },
    {
      key: "thick",
      label: "🥤 Milk Shakes – Thick Shakes",
      items: [
        { id: "bb_th_hops",    n: "Hopscotch Butterscotch Milkshake", p: 130, d: "Butterscotch and ice cream blended thick enough to stand a straw in.", veg: 1 },
        { id: "bb_th_belgian", n: "Belgian Chocolate Milkshake",      p: 130, d: "Belgian cocoa and ice cream, blended dark, thick and properly cold.", veg: 1 },
        { id: "bb_th_cookie",  n: "Cookie and Cream Milkshake",       p: 130, d: "Whole cookies blended into vanilla ice cream — crunchy bits and all.", veg: 1 },
      ],
    },
  ],
};

/* ═══════════════════════ KIM CHI & RAMEN ═══════════════════════ */
const KIMCHI: FestStall = {
  key: "kimchi",
  name: "Kim Chi & Ramen",
  tagline: "INDO ASIAN FOOD",
  categories: [
    {
      key: "soup",
      label: "🍜 Soup",
      items: [
        { id: "kr_soup_veg",     n: "Veg Soup",           p: 100, d: "", veg: 1 },
        { id: "kr_soup_chicken", n: "Chicken Clear Soup", p: 150, d: "", veg: 0 },
      ],
    },
    {
      key: "momos",
      label: "🥟 Momos",
      items: [
        { id: "kr_m_fried",     n: "Fried Momos",             p: 100, veg: 1,
          d: "5 pieces of piping hot, lip smacking momos with veg filling, served with schezwan chutney" },
        { id: "kr_m_korean",    n: "Korean Veg Momos",        p: 150, veg: 1,
          d: "Steamed dumplings stuffed with fresh vegetables, seasoned with Korean spices and served with a spicy gochujang dip", tag: "BESTSELLER"},
        { id: "kr_m_honey",     n: "Honey Veg Momos",         p: 150, veg: 1,
          d: "Soft dumplings filled with fresh vegetables, tossed in a sweet and mildly spicy honey glaze" },
        { id: "kr_m_mongolian", n: "Mongolian Veg Momos",     p: 180, veg: 1,
          d: "Steamed dumplings stuffed with fresh vegetables, tossed in a classic Mongolian sauce", tag: "MUST TRY,NEW"},
        { id: "kr_m_cfried",    n: "Fried Chicken Momos",     p: 120, veg: 0,
          d: "5 pieces of piping hot, lip smacking momos with chicken filling, served with schezwan chutney" },
        { id: "kr_m_ckorean",   n: "Korean Chicken Momos",    p: 150, veg: 0,
          d: "Steamed dumplings filled with juicy minced chicken, Korean spices and fresh veggies, served with a spicy gochujang dip" },
        { id: "kr_m_choney",    n: "Honey Chicken Momos",     p: 150, veg: 0,
          d: "Soft dumplings stuffed with juicy minced chicken, tossed in a sweet and spicy honey glaze", tag: "BESTSELLER"},
        { id: "kr_m_cmongol",   n: "Mongolian Chicken Momos", p: 180, veg: 0,
          d: "Soft dumplings stuffed with juicy minced chicken, tossed in a classic Mongolian sauce and spices", tag: "MUST TRY,NEW"},
      ],
    },
    {
      key: "starters",
      label: "🍢 Starters",
      items: [
        { id: "kr_s_honeyp",   n: "Honey Paneer",        p: 220, veg: 1,
          d: "Paneer tossed in a sweet and mildly spicy honey sauce", tag: "BESTSELLER"},
        { id: "kr_s_dragonp",  n: "Dragon Paneer",       p: 220, veg: 1,
          d: "Spiced paneer strips tossed with a bold dragon sauce" },
        { id: "kr_s_manch",    n: "Paneer Manchurian",   p: 180, veg: 1,
          d: "Crispy paneer cubes tossed in a tangy Indo-Chinese sauce with garlic and peppers" },
        { id: "kr_s_mongolp",  n: "Mongolian Paneer",    p: 220, veg: 1,
          d: "Soft paneer cubes simmered in a rich, classic Mongolian sauce with aromatic herbs and spices", tag: "MUST TRY,NEW"},
        { id: "kr_s_koreanp",  n: "Korean Fried Paneer", p: 220, veg: 1,
          d: "Crispy fried paneer cubes coated in a sweet, spicy and tangy Korean gochujang glaze" },
        { id: "kr_s_dragonc",  n: "Dragon Chicken",      p: 220, veg: 0,
          d: "Spicy chicken strips tossed with dragon sauce", tag: "BESTSELLER"},
        { id: "kr_s_honeyc",   n: "Honey Chicken",       p: 220, veg: 0,
          d: "Signature dish - crispy chicken tossed in honey and spicy gochujang" },
        { id: "kr_s_kwings",   n: "Korean Fried Wings",  p: 220, veg: 0,
          d: "7 pcs. Crispy double-fried wings glazed with spicy-sweet gochujang sauce" },
        { id: "kr_s_mwings",   n: "Mongolian Wings",     p: 220, veg: 0,
          d: "7 pcs. Crispy fried chicken wings coated in a classic Mongolian sauce, served with a cooling dip", tag: "MUST TRY,NEW"},
        { id: "kr_s_hwings",   n: "Honey Wings",         p: 220, veg: 0,
          d: "7 pcs. Golden fried chicken wings glazed with a sweet honey sauce, balanced with a hint of spice", tag: "BESTSELLER"},
        { id: "kr_s_kwingst",  n: "Korean Wings Tower",  p: 270, veg: 0,
          d: "7 pcs. A towering stack of crispy Korean fried wings glazed in spicy-sweet gochujang sauce, served with fries and dip" },
        { id: "kr_s_mwingst",  n: "Mongolian Wings Tower", p: 270, veg: 0,
          d: "7 pcs. Crispy fried wings in a classic Mongolian sauce, served with a cooling dip and the mojito combo", tag: "NEW"},
        { id: "kr_s_hwingst",  n: "Honey Wings Tower",   p: 270, veg: 0,
          d: "Golden fried wings glazed with sweet honey sauce, served with a cooling dip and the mojito combo", tag: "MUST TRY"},
      ],
    },
    {
      key: "main",
      label: "🍚 Main Course",
      items: [
        { id: "kr_mc_veg",      n: "Veg Rice / Noodles",            p: 120, veg: 1,
          d: "Classic fried rice with fresh veggies and soy seasoning, or wok-tossed noodles with veggies and sauces" },
        { id: "kr_mc_schez",    n: "Schezwan Rice / Noodles",       p: 160, veg: 1,
          d: "Spicy fried rice with veggies and schezwan sauce, or fiery wok-tossed noodles" },
        { id: "kr_mc_mongolv",  n: "Mongolian Veg",                 p: 180, veg: 1,
          d: "Rice or noodles. Fried rice or wok-tossed noodles with veggies and a classic Mongolian sauce", tag: "MUST TRY,NEW"},
        { id: "kr_mc_paneer",   n: "Paneer Rice / Noodles",         p: 170, veg: 1,
          d: "Soft paneer stir fried with rice or noodles for the perfect comfort meal" },
        { id: "kr_mc_pschez",   n: "Paneer Schezwan Rice / Noodles", p: 180, veg: 1,
          d: "Soft paneer stir fried with rice or noodles in a fiery schezwan sauce" },
        { id: "kr_mc_pramen",   n: "Paneer Ramen",                  p: 220, veg: 1,
          d: "Ramen noodles in a flavourful broth with spiced paneer and veggies" },
        { id: "kr_mc_kvrice",   n: "Kimchi Veg Rice",               p: 220, veg: 1,
          d: "Spicy fried rice with kimchi, veggies and Asian seasoning" },
        { id: "kr_mc_kvnood",   n: "Kimchi Veg Noodles",            p: 220, veg: 1,
          d: "Fiery noodles tossed with kimchi, veggies and Asian spices" },
        { id: "kr_mc_kricet",   n: "Kimchi Rice Tower",             p: 270, veg: 1,
          d: "A tall stack of spicy kimchi fried rice with veggies and Asian seasoning" },
        { id: "kr_mc_ktowern",  n: "Kimchi Tower Noodles",          p: 270, veg: 1,
          d: "A tall stack of spicy noodles layered with kimchi, veggies and sauces, with the mojito combo" },
        { id: "kr_mc_svramen",  n: "Special Veg Ramen",             p: 350, veg: 1,
          d: "A soulful mix of veggies, noodles and rich broth - comfort in every spoonful" },
        { id: "kr_mc_cramen",   n: "Ramen Chicken",                 p: 220, veg: 0,
          d: "Slow cooked chicken broth, noodles, chicken keema, veggies, dumpling and egg", tag: "BESTSELLER"},
        { id: "kr_mc_scramen",  n: "Special Chicken Ramen",         p: 350, veg: 0,
          d: "Slow chicken broth, noodles, chicken keema, chicken strips, veggies, egg, dumpling and kimchi" },
        { id: "kr_mc_egg",      n: "Egg Rice / Noodles",            p: 150, veg: 0,
          d: "Classic fried rice tossed with egg, spring onions and soy, or wok-tossed noodles with scrambled egg and veggies" },
        { id: "kr_mc_eggschez", n: "Schezwan Egg Rice / Noodles",   p: 160, veg: 0,
          d: "Spicy fried rice with egg, veggies and schezwan sauce, or wok-tossed noodles with egg and fiery schezwan sauce" },
        { id: "kr_mc_mongolc",  n: "Mongolian Chicken",             p: 190, veg: 0,
          d: "Rice or noodles. Fried rice or wok-tossed noodles with chicken, veggies and a classic Mongolian sauce", tag: "MUST TRY,NEW"},
        { id: "kr_mc_crice",    n: "Chicken Rice / Noodles",        p: 150, veg: 0,
          d: "Fried rice with chicken, veggies and light soy seasoning, or wok-tossed noodles with chicken and sauces" },
        { id: "kr_mc_cschez",   n: "Chicken Schezwan Rice / Noodles", p: 180, veg: 0,
          d: "Spicy fried rice with chicken, veggies and schezwan sauce, or fiery wok-tossed noodles" },
        { id: "kr_mc_kcrice",   n: "Kimchi Chicken Rice / Noodles", p: 180, veg: 0,
          d: "Spicy fried rice with chicken, kimchi and Asian seasonings" },
        { id: "kr_mc_kctower",  n: "Kimchi Chicken Tower",          p: 270, veg: 0,
          d: "Fiery noodles tossed with chicken, kimchi and Asian spices", tag: "BESTSELLER"},
        { id: "kr_mc_kcnood",   n: "Kimchi Chicken Noodles",        p: 270, veg: 0,
          d: "A tall stack of spicy noodles layered with kimchi, veggies and sauces, with the mojito combo" },
      ],
    },
    {
      key: "mojito",
      label: "🥤 Mojito",
      items: [
        { id: "kr_mo_mint",   n: "Virgin Mint Mojito", p: 80, d: "", veg: 1 },
        { id: "kr_mo_blue",   n: "Blue Curaçao Mojito", p: 80, d: "", veg: 1 },
        { id: "kr_mo_bubble", n: "Bubble Gum Mojito",  p: 80, d: "", veg: 1 },
      ],
    },
  ],
};

/* ═══════════════════════ D'VOUR ═══════════════════════ */
const DVOUR: FestStall = {
  key: "dvour",
  name: "D'VOUR",
  tagline: "SAVOUR THE SPEED",
  categories: [
    {
      key: "burgers",
      label: "🍔 Burgers",
      items: [
        { id: "dv_b_green",     n: "Green Flag Burger",       p: 150, veg: 1,
          d: "Grill patty, layered fresh veggies, cheese melt, bun hug - bite heaven" },
        { id: "dv_b_nash",      n: "Nashville Burger",        p: 230, veg: 1,
          d: "Spicy crispy patty, tangy pickles, creamy mayo, soft bun - fiery buzz", tag: "BESTSELLER"},
        { id: "dv_b_korean",    n: "Korean Burger",           p: 230, veg: 1,
          d: "Korean spiced patty, kimchi crunch, gochujang mayo, soft bun - bold bite", tag: "BESTSELLER"},
        { id: "dv_b_makhani",   n: "Makhani Gravy Burger",    p: 250, veg: 1,
          d: "Grill patty glazed in rich, buttery makhani gravy with a cheese melt, soft bun - desi comfort" },
        { id: "dv_b_avop",      n: "Avocado Paneer Burger",   p: 250, veg: 1,
          d: "Golden seared paneer with creamy avocado sauce, crisp lettuce and tomato, soft bun - cool and creamy" },
        { id: "dv_b_jal",       n: "Cheese & Jalapeño Burger", p: 250, veg: 1,
          d: "Grill patty, cheese melt and pickled jalapeños, soft bun - sharp and cheesy" },
        { id: "dv_b_buff",      n: "Buffalo Burger",          p: 270, veg: 1,
          d: "Golden seared paneer, ranch drizzle, soft bun - zesty bite" },
        { id: "dv_b_dunk",      n: "Cheese Dunk Burger",      p: 270, veg: 1,
          d: "Loaded with cheese, built to dunk - pure cheesy indulgence", tag: "MUST TRY"},
        { id: "dv_b_sig",       n: "Signature Burger",        p: 270, veg: 1,
          d: "Chef's special patty, secret sauce, fresh layers - your perfect bite" },
        { id: "dv_b_double",    n: "Double Decker Burger",    p: 350, veg: 1,
          d: "Two juicy patties, double cheese, extra layers - twice the taste, twice the joy", tag: "BESTSELLER"},
        { id: "dv_b_cclassic",  n: "Classic Burger",          p: 160, veg: 0,
          d: "Golden chicken patty, garden fresh veggies, creamy cheese, soft bun - simple bliss" },
        { id: "dv_b_cnash",     n: "Nashville Chicken Burger", p: 250, veg: 0,
          d: "Crispy fried chicken, Nashville spice kick, tangy pickles, soft bun - fiery southern bite", tag: "BESTSELLER"},
        { id: "dv_b_ckorean",   n: "Korean Chicken Burger",   p: 250, veg: 0,
          d: "Crispy chicken, kimchi crunch, gochujang mayo, soft bun - bold Korean punch", tag: "BESTSELLER"},
        { id: "dv_b_cjal",      n: "Cheese & Jalapeño Chicken Burger", p: 250, veg: 0,
          d: "Crispy chicken, cheese melt and pickled jalapeños, soft bun - sharp and cheesy" },
        { id: "dv_b_cavo",      n: "Avocado Chicken Burger",  p: 270, veg: 0,
          d: "Crispy chicken with creamy avocado sauce, crisp lettuce and tomato, soft bun - cool and creamy" },
        { id: "dv_b_cbuff",     n: "Buffalo Chicken Burger",  p: 290, veg: 0,
          d: "Crispy chicken, buffalo hot sauce, cool ranch drizzle, soft bun - zesty kick in every bite" },
        { id: "dv_b_csig",      n: "Signature Burger",        p: 290, veg: 0,
          d: "Chef's special chicken patty, secret sauce, melted cheese, fresh layers - pure gourmet bite" },
        { id: "dv_b_cdunk",     n: "Cheese Dunk Burger",      p: 300, veg: 0,
          d: "Loaded with cheese inside and outside, ready to dunk for the ultimate melt down", tag: "MUST TRY"},
        { id: "dv_b_cdouble",   n: "Double Decker Burger",    p: 350, veg: 0,
          d: "Two juicy patties, double cheese, extra layers - twice the taste, twice the joy", tag: "BESTSELLER"},
        { id: "dv_b_noroti",    n: "No Roti Burger",          p: 350, veg: 0,
          d: "Flame grilled patty stacked with cheddar, fresh layers and house made sauce, soft bun" },
      ],
    },
    {
      key: "fries",
      label: "🍟 Fries",
      items: [
        { id: "dv_f_classic", n: "Classic Fries",                p: 130, d: "", veg: 1 },
        { id: "dv_f_peri",    n: "French Fries Peri Peri",       p: 130, d: "", veg: 1 },
        { id: "dv_f_mafia",   n: "Cheese Mafia Fries",           p: 160, d: "", veg: 1, tag: "MUST TRY"},
        { id: "dv_f_cload",   n: "Chicken Loaded Fries with Mojito", p: 250, veg: 0,
          d: "Crispy fries topped with Korean or Nashville chicken, cheese sauce and spicy mayo, served with mojito" },
        { id: "dv_f_pload",   n: "Paneer Loaded Fries with Mojito",  p: 250, veg: 1,
          d: "Crispy fries topped with spicy paneer, cheese and sauces, paired with a refreshing mint mojito" },
      ],
    },
    {
      key: "starters",
      label: "🍗 Special Starters",
      items: [
        { id: "dv_s_tender",  n: "Fried Chicken Tender",      p: 220, veg: 0,
          d: "Juicy golden fried chicken strips seasoned to perfection, served with your choice of dipping sauce", tag: "MUST TRY"},
        { id: "dv_s_firebird", n: "Nashville Fire Bird Tenders", p: 220, veg: 0,
          d: "Crispy, juicy tenders tossed in a fiery Nashville style hot sauce, served with pickles and cooling ranch" },
        { id: "dv_s_wings",   n: "Buffalo Wings",             p: 220, veg: 0,
          d: "Classic crispy wings tossed in tangy buffalo sauce, served with cool ranch or blue cheese dip" },
        { id: "dv_s_wingst",  n: "Buffalo Wings Tower",       p: 270, veg: 0,
          d: "Classic crispy wings tossed in tangy buffalo sauce, served with cool ranch or blue cheese dip and mojito" },
      ],
    },
    {
      key: "wraps",
      label: "🌯 Wraps",
      items: [
        { id: "dv_w_yinv", n: "Yin & Yang Garlic Burst Wrap (Veg)",     p: 250, veg: 1,
          d: "A garlicky rush of flavour in this juicy roll with onions, tomatoes, lettuce and fillet" },
        { id: "dv_w_yinc", n: "Yin & Yang Garlic Burst Wrap (Chicken)", p: 270, veg: 0,
          d: "A garlicky rush of flavour in this juicy roll with onions, tomatoes, lettuce and fillet" },
        { id: "dv_w_seov", n: "Seoul Street Wrap (Veg)",                p: 210, veg: 1,
          d: "Enjoy the Korean flavours of this big, juicy paneer or chicken roll", tag: "MUST TRY"},
        { id: "dv_w_seoc", n: "Seoul Street Wrap (Chicken)",            p: 230, veg: 0,
          d: "Enjoy the Korean flavours of this big, juicy paneer or chicken roll", tag: "MUST TRY"},
        { id: "dv_w_swtv", n: "Sweet Chilli Wrap (Veg)",                p: 200, veg: 1,
          d: "A rush of sweet chilli flavour in this juicy roll with onions, tomatoes and lettuce" },
        { id: "dv_w_swtc", n: "Sweet Chilli Wrap (Chicken)",            p: 220, veg: 0,
          d: "A rush of sweet chilli flavour in this juicy roll with onions, tomatoes and lettuce" },
      ],
    },
    {
      key: "mexican",
      label: "🌮 Mexican Corner",
      items: [
        { id: "dv_x_ricev", n: "Mexican Rice (Veg)",      p: 190, veg: 1,
          d: "Fragrant Mexican style rice tossed with golden seared paneer, sweet corn and bell peppers" },
        { id: "dv_x_noodv", n: "Mexican Noodles (Veg)",   p: 190, veg: 1,
          d: "Golden seared paneer cubes folded into rich, buttery noodles with warm Mexican spices and peppers" },
        { id: "dv_x_ricec", n: "Mexican Rice (Chicken)",  p: 220, veg: 0,
          d: "Smoky seasoned chicken layered over mildly spiced Mexican rice with peppers and corn" },
        { id: "dv_x_noodc", n: "Mexican Noodles (Chicken)", p: 220, veg: 0,
          d: "Creamy, mildly spiced noodles with tender chicken bites and sauced vegetables" },
      ],
    },
    {
      key: "drinks",
      label: "🥤 Mojitos",
      items: [
        { id: "dv_d_mint",  n: "Virgin Mint Mojito",    p: 80, d: "", veg: 1 },
        { id: "dv_d_blue",  n: "Blue Curaçao Mojito",   p: 80, d: "", veg: 1 },
        { id: "dv_d_butter", n: "Harry Potter Butter Fizz", p: 160, veg: 1,
          d: "Our signature butterbeer-style fizz.", tag: "MUST TRY"},
      ],
    },
  ],
};

export const FEST_STALLS: FestStall[] = [DVOUR, BONBON, KIMCHI];

/** Every item across all three stalls, flattened — used by the combo builder. */
export function allFestItems(): Array<FestItem & { stall: string; stallName: string; category: string }> {
  const out: Array<FestItem & { stall: string; stallName: string; category: string }> = [];
  for (const s of FEST_STALLS)
    for (const c of s.categories)
      for (const i of c.items) out.push({ ...i, stall: s.key, stallName: s.name, category: c.label });
  return out;
}

export function findFestItem(id: string) {
  return allFestItems().find((i) => i.id === id) || null;
}
