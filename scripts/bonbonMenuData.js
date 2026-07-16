// Single source of truth for the Bon Bon menu.
// Used by BOTH scripts/build_bonbon.js (bakes the chatbot HTML) and
// scripts/gen_bonbon_seed.js (writes lib/bonbonMenuSeed.json for the live dashboards),
// so the chatbot and the Firestore-backed dashboards can never drift apart.

// ---- per-category presentation (quantity, prep mins, default description) ----
// q = quantity. The real Bon Bon menu only prints a size for Sundae (250 ml / 500 ml);
// every other section has no quantity, so q is left blank (owner fills it in from the dashboard).
const CM = {
  scoops:   { label: "Scoops",             q: "",       pt: 3, d: "A scoop served on a crisp waffle cup or cone." },
  softy:    { label: "Softy",              q: "",       pt: 3, d: "Creamy soft-serve, freshly swirled." },
  waffle:   { label: "Waffle",             q: "",       pt: 8, d: "Hot & soft Belgian waffle with Nutella, fruits & honey." },
  icecream: { label: "Ice Cream Specials", q: "",       pt: 6, d: "A loaded ice-cream sundae — our best sellers." },
  sundae:   { label: "Sundae",             q: "250 ml", pt: 5, d: "A layered ice-cream sundae." },
  mini:     { label: "Mini Sundae",        q: "",       pt: 5, d: "A bite-sized Bon Bon sundae cup." },
  rolls:    { label: "Roll Ice Cream",     q: "",       pt: 7, d: "Instant ice cream blended on a -30° frozen pan and rolled fresh to order." },
  falooda:  { label: "Falooda",            q: "",       pt: 6, d: "Classic falooda with vermicelli, jelly & ice cream." },
  shakes:   { label: "Thick Shakes",       q: "",       pt: 5, d: "Thick, creamy blended shake." },
  snacks:   { label: "Snacks",             q: "",       pt: 8, d: "A hot, crispy savoury bite." },
};

// order the browse tabs appear in
const catOrder = ["scoops", "softy", "waffle", "icecream", "sundae", "mini", "rolls", "falooda", "shakes", "snacks"];

// ---- menu (id, name, price, flags). flags: "best" | "must"; sundae has 5th = 500ml price ----
const groups = {
  scoops: [
    ["madagascarvanilla", "Madagascar Vanilla", 80],
    ["cookiencream", "Cookie N Cream", 90, "best"],
    ["blackcurrant_sc", "Black Currant", 90],
    ["hopscotch", "Hop Scotch Butterscotch", 90],
    ["alphonsomango_sc", "Alphonso Mango", 90, "must"],
    ["bananacaramel", "Banana Caramel", 90, "best"],
    ["belgianchoc_sc", "Belgian Chocolate", 90],
    ["tendercoconut", "Tender Coconut", 90, "must"],
    ["honeynutcrunch", "Honey Nut Crunch", 90],
    ["caramelnutty", "Caramel Nutty Crunch", 90, "best"],
    ["tajmahal", "Taj Mahal", 90],
    ["strawberry_sc", "Strawberry", 80],
    ["lotusbiscoff", "Lotus Biscoff", 90, "best"],
    ["saltedcaramel", "Salted Caramel", 90],
    ["ogjackfruit", "The Og Jackfruit", 90],
    ["cottoncandy_sc", "Cotton Candy", 90, "best"],
    ["filtercoffee_sc", "Filter Coffee", 90, "must"],
    ["ferreroroucher", "Ferrero Roucher", 110, "must"],
  ],
  softy: [
    ["madagascarsofty", "Madagascar Vanilla Softy", 60],
    ["ripple", "Ripple", 90],
    ["hotchocodip", "Hot Choco Dip", 90],
    ["bonbonfruit", "Bon Bon Fruit Special", 120],
    ["apricotalmond", "Apricot Almond", 120],
    ["crackynutty", "Cracky Nutty Crunch", 120],
    ["blackcurrantalmond", "Black Currant Almond", 120],
    ["nutbutterscotch_so", "Nut Butterscotch", 120],
    ["royalkesar_so", "Royal Kesar Badam & Pista", 120],
    ["fruitycrunch", "Fruity Crunch", 120],
  ],
  waffle: [
    ["belgianwaffle", "Belgian Waffle", 160],
    ["belgianwafflesizzler", "Belgian Waffle Sizzler", 200, "must"],
    ["belgianwaffleic", "Belgian Waffle with Ice Cream", 250, "best"],
  ],
  icecream: [
    ["belgianwaffleic2", "Belgian Waffle with Icecream", 230],
    ["deathbychocolate", "Death by Chocolate", 230, "best"],
    ["mississippimud", "Mississippi Mud Sundae", 220],
    ["sizzlinghotbrownie", "Sizzling Hot Brownie Sizzler", 210, "best"],
    ["gudbud", "Gud Bud Sundae", 210],
    ["tiramisu", "Tiramisu Sundae", 210],
    ["belgiandarkchoc", "Belgian Dark Chocolate Sundae", 210],
    ["browniebomb", "Brownie Bomb", 180, "must"],
    ["specialdryfruits_ic", "Special Dry Fruits", 180],
    ["hotfudge", "Hot Fudge Sundae", 180],
    ["titanicboat", "Titanic Boat", 210, "best"],
    ["tallbeauty", "Tall Beauty", 200],
    ["naughtynutella_ic", "Naughty Nutella Sundae", 250, "must"],
    ["blackforest_ic", "Black Forest Sundae", 170],
    ["chocomania", "Choco Mania", 180],
    ["blackbeauty", "Black Beauty", 195],
    ["mixedfruitcaramel", "Mixed Fruit Caramel", 180],
  ],
  sundae: [ // [id,name,price250,flags,price500]
    ["butterscotchproline", "Butter Scotch Proline", 170, "", 300],
    ["chocobutterchips", "Choco Butter Chips", 180, "", 340],
    ["lovelichee", "Love Lichee", 180, "", 340],
    ["fruitsalad", "Fruit Salad", 170, "", 300],
    ["proteinblast_su", "Protein Blast", 180, "", 340],
    ["getsmart", "Get Smart", 180, "", 340],
    ["blackcurrant_su", "Black Currant", 170, "", 300],
    ["blackforestdream", "Black Forest Dream", 170, "", 300],
    ["pistachio", "Pista Chio", 180, "", 340],
    ["mixfruitjelly", "Mix Fruit Jelly", 170, "", 300],
    ["dryfruitjelly", "Dry Fruit Jelly", 180, "", 340],
    ["rainbowcassata", "Rainbow Cassata", 200, "must", 360],
    ["specialdryfruits_su", "Special Dry Fruits", 180, "best", 340],
  ],
  mini: [
    ["hotfudgenut", "Hot Fudge Nut Sundae", 130],
    ["nutbutterscotch_mi", "Nut Butterscotch Sundae", 130],
    ["chocobutterchips_mi", "Choco Butter Chips", 130],
    ["strawberrybanana", "Strawberry Banana Bon", 130],
    ["litchibon", "Litchi Bon", 130],
    ["proteinblastbon", "Protein Blast Bon", 130],
    ["chococherrybon", "Choco Cherry Bon", 130],
    ["blackcurrantbon", "Black Currant Bon", 130],
    ["blackforestbon", "Black Forest Bon", 130],
    ["chocolatebon", "Chocolate Bon", 130],
    ["licheechocostraw", "Lichee Choco Strawberry Bon", 130],
    ["alphonsomangobon", "Alphonso Mango Bon", 130],
  ],
  rolls: [ // rolled on a -30° frozen pan
    ["chocobrownieroll", "Chocolate Brownie", 150],
    ["oreoroll", "Oreo", 150, "best"],
    ["blackforestroll", "Black Forest", 150],
    ["hazelnutroll", "Hazelnut Roll", 180, "best"],
  ],
  falooda: [
    ["royaldryfruits", "Royal Dry Fruits", 170, "best"],
    ["realalphonso", "Real Alphonso Mango", 150, "best"],
    ["ogrose", "Og Rose Falooda", 150],
    ["belgianchoc_fa", "Belgian Chocolate", 150],
    ["cottoncandy_fa", "Cotton Candy", 170, "must"],
  ],
  shakes: [ // thick shakes -> all get the extra-ice-cream add-on
    ["frenchvanilla", "French Vanilla", 120],
    ["belgianchoc_ts", "Belgian Chocolate", 130],
    ["classiccoldcoffee", "Classic Cold Coffee", 130, "best"],
    ["caramelcoldcoffee", "Caramel Cold Coffee", 140, "must"],
    ["royalkesarbadam", "Royal Kesar Badam", 150],
    ["litchi_ts", "Litchi", 180, "best"],
    ["blackcurrant_ts", "Black Currant", 130],
    ["ogoreo", "Og Oreo", 150, "best"],
    ["chocolateoreo", "Chocolate Oreo", 160],
    ["naughtynutella_ts", "Naughty Nutella", 200, "must"],
    ["oghazelnut", "Og Hazelnut", 200],
    ["coffeehazelnut", "Coffee Hazelnut", 250, "best"],
    ["snickerscaramel", "Snickers Caramel", 250],
    ["exoticalphonso", "Exotic Alphonso Mango", 250, "best"],
    ["chocobrownie_ts", "Choco Brownie", 250],
    ["tresleches", "Tres Leches", 250, "must"],
    ["proteinblast_ts", "Protein Blast", 250],
  ],
  snacks: [
    ["frenchfriessmall", "French Fries Small", 110],
    ["frenchfrieslarge", "French Fries Large", 130],
    ["loadedfries", "Loaded Fries", 150],
    ["comboplatter", "Combo Platter", 200],
    ["cheeseball", "Cheese Ball", 150],
    ["smileyssmall", "Smileys (Small)", 100],
    ["smileyslarge", "Smileys (Large)", 160],
    ["vegsandwich", "Veg Sandwich", 110],
    ["paneersandwich", "Paneer Sandwich", 130],
    ["cheeseballsandwich", "Cheese Ball Sandwich", 180],
  ],
};

// ---- disambiguate names so each stands alone (no more "Litchi"/"Black Currant" confusion) ----
// Append the item type; leave scoops as natural flavours and cold coffees as-is.
groups.shakes.forEach((it) => { if (!/Cold Coffee/i.test(it[1])) it[1] += " Shake"; });
groups.falooda.forEach((it) => { if (!/Falooda/i.test(it[1])) it[1] += " Falooda"; });
groups.sundae.forEach((it) => { if (!/(Jelly|Cassata|Sundae)/i.test(it[1])) it[1] += " Sundae"; });
groups.mini.forEach((it) => { if (!/(Bon|Sundae)/i.test(it[1])) it[1] += " Bon"; });
groups.rolls.forEach((it) => { if (!/Roll/i.test(it[1])) it[1] += " Roll"; });

// ---- flat seed documents for Firestore (the live dashboards read/write these) ----
// This is the REAL menu, not mock data. Snacks are the only non-veg-capable items (paneer/veg
// are all vegetarian here anyway), so veg = 1 across the board, matching the parlour menu.
function seedDocs() {
  const out = [];
  let sort = 0;
  for (const cat of catOrder) {
    const cm = CM[cat];
    for (const it of groups[cat]) {
      const [key, name, price, flags, big] = it;
      const doc = {
        key,
        name,
        price,
        cat,
        cat_label: cm.label,
        q: cm.q,
        pt: cm.pt,
        desc: cat === "sundae" && big ? `A layered ice-cream sundae. Also in 500 ml — ₹${big}.` : cm.d,
        veg: 1,
        best: /best/.test(flags || "") ? 1 : 0,
        must: /must/.test(flags || "") ? 1 : 0,
        promoted: 0, // supervisor toggles this to feature a dish on the welcome screen

        available: 1, // sold-out toggle (supervisor)
        hidden: 0, // hide from menu (supervisor)
        sort: sort++,
      };
      if (cat === "sundae" && big) doc.price500 = big;
      if (cat === "shakes") doc.ao = "extraicecream";
      out.push(doc);
    }
  }
  // hidden add-on (never shown as its own card; attached to thick shakes)
  out.push({ key: "extraicecream", name: "Extra Ice Cream", price: 30, cat: "addon", cat_label: "Add-ons", q: "", pt: 1, desc: "An extra scoop of ice cream.", veg: 1, best: 0, must: 0, available: 1, hidden: 1, sort: sort++ });
  return out;
}

module.exports = { CM, groups, catOrder, seedDocs };
