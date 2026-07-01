// Builds the Bon Bon ice-cream-parlor chatbot from the Annapoorna template engine.
// Swaps the menu, rebrands to Bon Bon (white/maroon theme, logo), removes the outlet picker
// (single outlet -> straight to chat), and points the AI at /api/bonbon.
// Run:  node scripts/build_bonbon.js
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const TPL = path.join(ROOT, "annapoorna_chatbot_demo.html");

// ---- per-category presentation (quantity, prep mins, default description) ----
const CM = {
  scoops:   { label: "Scoops",          q: "1 scoop", pt: 3, d: "A scoop served on a crisp waffle cup or cone." },
  softy:    { label: "Softy",           q: "1 cone",  pt: 3, d: "Creamy soft-serve, freshly swirled." },
  waffle:   { label: "Waffle",          q: "1 plate", pt: 8, d: "Hot & soft Belgian waffle with Nutella, fruits & honey." },
  icecream: { label: "Ice Cream Specials", q: "1 bowl", pt: 6, d: "A loaded ice-cream sundae — our best sellers." },
  sundae:   { label: "Sundae",          q: "250 ml",  pt: 5, d: "A layered ice-cream sundae." },
  mini:     { label: "Mini Sundae",     q: "1 cup",   pt: 5, d: "A bite-sized Bon Bon sundae cup." },
  falooda:  { label: "Falooda",         q: "1 glass", pt: 6, d: "Classic falooda with vermicelli, jelly & ice cream." },
  shakes:   { label: "Thick Shakes",    q: "1 glass", pt: 5, d: "Thick, creamy blended shake." },
  snacks:   { label: "Snacks",          q: "1 plate", pt: 8, d: "A hot, crispy savoury bite." },
};

// ---- menu (id, name, price, flags). f: "best" | "must"; ao = add-on item id; big = 500ml price ----
const groups = {
  scoops: [
    ["madagascarvanilla","Madagascar Vanilla",80],
    ["cookiencream","Cookie N Cream",90,"best"],
    ["blackcurrant_sc","Black Currant",90],
    ["hopscotch","Hop Scotch Butterscotch",90],
    ["alphonsomango_sc","Alphonso Mango",90,"must"],
    ["bananacaramel","Banana Caramel",90,"best"],
    ["belgianchoc_sc","Belgian Chocolate",90],
    ["tendercoconut","Tender Coconut",90,"must"],
    ["honeynutcrunch","Honey Nut Crunch",90],
    ["caramelnutty","Caramel Nutty Crunch",90,"best"],
    ["tajmahal","Taj Mahal",90],
    ["strawberry_sc","Strawberry",80],
    ["lotusbiscoff","Lotus Biscoff",90,"best"],
    ["saltedcaramel","Salted Caramel",90],
    ["ogjackfruit","The Og Jackfruit",90],
    ["cottoncandy_sc","Cotton Candy",90,"best"],
    ["filtercoffee_sc","Filter Coffee",90,"must"],
    ["ferreroroucher","Ferrero Roucher",110,"must"],
  ],
  softy: [
    ["madagascarsofty","Madagascar Vanilla Softy",60],
    ["ripple","Ripple",90],
    ["hotchocodip","Hot Choco Dip",90],
    ["bonbonfruit","Bon Bon Fruit Special",120],
    ["apricotalmond","Apricot Almond",120],
    ["crackynutty","Cracky Nutty Crunch",120],
    ["blackcurrantalmond","Black Currant Almond",120],
    ["nutbutterscotch_so","Nut Butterscotch",120],
    ["royalkesar_so","Royal Kesar Badam & Pista",120],
    ["fruitycrunch","Fruity Crunch",120],
  ],
  waffle: [
    ["belgianwaffle","Belgian Waffle",160],
    ["belgianwafflesizzler","Belgian Waffle Sizzler",200,"must"],
    ["belgianwaffleic","Belgian Waffle with Ice Cream",250,"best"],
  ],
  icecream: [
    ["belgianwaffleic2","Belgian Waffle with Icecream",230],
    ["deathbychocolate","Death by Chocolate",230,"best"],
    ["mississippimud","Mississippi Mud Sundae",220],
    ["sizzlinghotbrownie","Sizzling Hot Brownie Sizzler",210,"best"],
    ["gudbud","Gud Bud Sundae",210],
    ["tiramisu","Tiramisu Sundae",210],
    ["belgiandarkchoc","Belgian Dark Chocolate Sundae",210],
    ["browniebomb","Brownie Bomb",180,"must"],
    ["specialdryfruits_ic","Special Dry Fruits",180],
    ["hotfudge","Hot Fudge Sundae",180],
    ["titanicboat","Titanic Boat",210,"best"],
    ["tallbeauty","Tall Beauty",200],
    ["naughtynutella_ic","Naughty Nutella Sundae",250,"must"],
    ["blackforest_ic","Black Forest Sundae",170],
    ["chocomania","Choco Mania",180],
    ["blackbeauty","Black Beauty",195],
    ["mixedfruitcaramel","Mixed Fruit Caramel",180],
  ],
  sundae: [ // [id,name,price250,flags,price500]
    ["butterscotchproline","Butter Scotch Proline",170,"",300],
    ["chocobutterchips","Choco Butter Chips",180,"",340],
    ["lovelichee","Love Lichee",180,"",340],
    ["fruitsalad","Fruit Salad",170,"",300],
    ["proteinblast_su","Protein Blast",180,"",340],
    ["getsmart","Get Smart",180,"",340],
    ["blackcurrant_su","Black Currant",170,"",300],
    ["blackforestdream","Black Forest Dream",170,"",300],
    ["pistachio","Pista Chio",180,"",340],
    ["mixfruitjelly","Mix Fruit Jelly",170,"",300],
    ["dryfruitjelly","Dry Fruit Jelly",180,"",340],
    ["rainbowcassata","Rainbow Cassata",200,"must",360],
    ["specialdryfruits_su","Special Dry Fruits",180,"best",340],
  ],
  mini: [
    ["hotfudgenut","Hot Fudge Nut Sundae",130],
    ["nutbutterscotch_mi","Nut Butterscotch Sundae",130],
    ["chocobutterchips_mi","Choco Butter Chips",130],
    ["strawberrybanana","Strawberry Banana Bon",130],
    ["litchibon","Litchi Bon",130],
    ["proteinblastbon","Protein Blast Bon",130],
    ["chococherrybon","Choco Cherry Bon",130],
    ["blackcurrantbon","Black Currant Bon",130],
    ["blackforestbon","Black Forest Bon",130],
    ["chocolatebon","Chocolate Bon",130],
    ["licheechocostraw","Lichee Choco Strawberry Bon",130],
    ["alphonsomangobon","Alphonso Mango Bon",130],
  ],
  falooda: [
    ["royaldryfruits","Royal Dry Fruits",170,"best"],
    ["realalphonso","Real Alphonso Mango",150,"best"],
    ["ogrose","Og Rose Falooda",150],
    ["belgianchoc_fa","Belgian Chocolate",150],
    ["cottoncandy_fa","Cotton Candy",170,"must"],
  ],
  shakes: [ // thick shakes -> all get the extra-ice-cream add-on
    ["frenchvanilla","French Vanilla",120],
    ["belgianchoc_ts","Belgian Chocolate",130],
    ["classiccoldcoffee","Classic Cold Coffee",130,"best"],
    ["caramelcoldcoffee","Caramel Cold Coffee",140,"must"],
    ["royalkesarbadam","Royal Kesar Badam",150],
    ["litchi_ts","Litchi",180,"best"],
    ["blackcurrant_ts","Black Currant",130],
    ["ogoreo","Og Oreo",150,"best"],
    ["chocolateoreo","Chocolate Oreo",160],
    ["naughtynutella_ts","Naughty Nutella",200,"must"],
    ["oghazelnut","Og Hazelnut",200],
    ["coffeehazelnut","Coffee Hazelnut",250,"best"],
    ["snickerscaramel","Snickers Caramel",250],
    ["exoticalphonso","Exotic Alphonso Mango",250,"best"],
    ["chocobrownie_ts","Choco Brownie",250],
    ["tresleches","Tres Leches",250,"must"],
    ["proteinblast_ts","Protein Blast",250],
  ],
  snacks: [
    ["frenchfriessmall","French Fries Small",110],
    ["frenchfrieslarge","French Fries Large",130],
    ["loadedfries","Loaded Fries",150],
    ["comboplatter","Combo Platter",200],
    ["cheeseball","Cheese Ball",150],
    ["smileyssmall","Smileys (Small)",100],
    ["smileyslarge","Smileys (Large)",160],
    ["vegsandwich","Veg Sandwich",110],
    ["paneersandwich","Paneer Sandwich",130],
    ["cheeseballsandwich","Cheese Ball Sandwich",180],
  ],
};

// ---- build MENU object ----
let entries = [];
for (const g in groups) {
  const cm = CM[g];
  for (const it of groups[g]) {
    const [id, n, p, flags, big] = it;
    let d = cm.d;
    if (g === "sundae" && big) d = "A layered ice-cream sundae. Also in 500 ml — ₹" + big + ".";
    let o = `{n:${JSON.stringify(n)},p:${p},e:"🍨",h:[[8,23]],q:${JSON.stringify(cm.q)},pt:${cm.pt},ph:"",d:${JSON.stringify(d)},veg:1`;
    if (/best/.test(flags || "")) o += ",best:1";
    if (/must/.test(flags || "")) o += ",must:1";
    if (g === "shakes") o += ',ao:"extraicecream"';
    o += "}";
    entries.push(` ${id}:${o}`);
  }
}
// hidden add-on item (not shown in any category)
entries.push(' extraicecream:{n:"Extra Ice Cream",p:30,e:"🍨",h:[[8,23]],q:"1 scoop",pt:1,ph:"",d:"An extra scoop of ice cream.",veg:1}');
const MENU = `const MENU={\n${entries.join(",\n")}};`;

// ---- CATS (browse tabs) ----
const ids = (g) => groups[g].map((x) => x[0]);
const CATS = `const CATS=[
 {name:"Scoops",ids:${JSON.stringify(ids("scoops"))}},
 {name:"Softy",ids:${JSON.stringify(ids("softy"))}},
 {name:"Waffle",ids:${JSON.stringify(ids("waffle"))}},
 {name:"Ice Cream Specials",ids:${JSON.stringify(ids("icecream"))}},
 {name:"Sundae",ids:${JSON.stringify(ids("sundae"))}},
 {name:"Mini Sundae",ids:${JSON.stringify(ids("mini"))}},
 {name:"Falooda",ids:${JSON.stringify(ids("falooda"))}},
 {name:"Thick Shakes",ids:${JSON.stringify(ids("shakes"))}},
 {name:"Snacks",ids:${JSON.stringify(ids("snacks"))}}
];`;

// ---- splice menu into the template ----
let tpl = fs.readFileSync(TPL, "utf8");
const i1 = tpl.indexOf("const MENU={");
const i2 = tpl.indexOf("const OUTLETS=");
let h = tpl.slice(0, i1) + MENU + "\n" + CATS + "\n" + tpl.slice(i2);

// ---- single outlet, no picker ----
h = h.replace(/const OUTLETS=\[[^\]]*\]/, 'const OUTLETS=["Bon Bon"]');
// init: always open the (single) outlet directly
h = h.replace("if(o)chooseOutlet(o);else renderOutlets();", "chooseOutlet(o||OUTLETS[0]);");
// header shows just the brand (single outlet)
h = h.replace('document.getElementById("hname").textContent="Annapoorna · "+o;', 'document.getElementById("hname").textContent="Bon Bon";');

// ---- branding ----
h = h.replace(/const LOGO="data:image\/png;base64,[^"]*";/, 'const LOGO="/bon_bon_logo.png";');
h = h.replace('<div class="logo">A</div>', '<div class="logo">B</div>');
h = h.replace(/<title>[^<]*<\/title>/, "<title>Bon Bon — AI Ice Cream Menu</title>");
h = h.split("Sree Annapoorna").join("Bon Bon");
h = h.split("Annapoorna").join("Bon Bon");
h = h.split("pure-vegetarian South Indian restaurant").join("ice cream parlour");
// drop "pure veg" stamp text
h = h.replace(/pureVeg:\{[^}]*\}/, 'pureVeg:{en:"Ice cream parlour",ta:"ஐஸ்கிரீம் பார்லர்",hi:"आइसक्रीम पार्लर",ml:"ഐസ്ക്രീം പാർലർ",te:"ఐస్‌క్రీం పార్లర్",kn:"ಐಸ್‌ಕ್ರೀಂ ಪಾರ್ಲರ್"}');

// ---- ice-cream-parlour theme: white + maroon (#811226), neutral surfaces ----
h = h.replace(/:root\{[^}]*\}/,
  ":root{--blue:#811226;--ink:#2a1212;--mut:#9a8585;--line:#ecdcdc;--cream:#faf2f1;--gold:#811226;--card:#fffdfc;--brandtop:#811226;--brandbot:#5a0c1a;}");
// language bar -> dark maroon
h = h.replace(/\.langbar\{display:flex;gap:6px;overflow-x:auto;padding:8px 12px;background:#4d3017;/,
  ".langbar{display:flex;gap:6px;overflow-x:auto;padding:8px 12px;background:#5a0c1a;");
// dish cards: show the image block with the logo centred (like the original chatbot)
h = h.replace("const LOGO_PICS=false;", "const LOGO_PICS=true;");
// page frame behind the phone -> warm neutral
h = h.replace("background:#0e1116;", "background:#efe4e2;");
// chat wallpaper -> clean neutral surface
h = h.replace(/background-image:linear-gradient\(rgba\(246,238,221[^)]*\),rgba\([^)]*\)\),url\('chat-bg\.jpg'\);/,
  "background:#faf2f1;");
// dish-card image placeholder tint
h = h.replace("linear-gradient(135deg,#f3e9d2,#e9dcbf)", "linear-gradient(135deg,#f3e7e6,#ead9d7)");

// ---- recolor every leftover GOLD accent -> maroon (Annapoorna keeps gold; this is Bon Bon only) ----
// active language pill: gold gradient -> solid maroon
h = h.replace(".lang.on{background:linear-gradient(135deg,#f6e8c9,#e9cf94);color:var(--brandbot);",
  ".lang.on{background:var(--blue);color:#fff;");
// mic active / gold gradients -> maroon gradient
h = h.split("linear-gradient(135deg,#e3b956,#c79233)").join("linear-gradient(135deg,#a83048,#811226)");
// gold glows/shadows (dish card, sheen, mic ripple) -> maroon
h = h.split("199,146,51").join("129,18,38");
// any remaining gold hexes -> maroon shades
h = h.split("#c79233").join("#811226");
h = h.split("#e3b956").join("#a83048");
h = h.split("#a8752a").join("#8a3a4c");

// ---- AI route -> /api/bonbon ----
h = h.split("/api/ody").join("/api/bonbon");
h = h.replace("body:JSON.stringify({message:q,lang,cart:Object.keys(cart),taste:tasteStr()})",
  'body:JSON.stringify({message:q,lang,cart:Object.keys(cart),taste:tasteStr(),restaurant:"Bon Bon, an ice cream parlour"})');
// route paths /annapoorna -> /bonbon (and the parent-path detection)
h = h.split('"/annapoorna/"').join('"/bonbon/"');
h = h.split('"/annapoorna"').join('"/bonbon"');
h = h.split('==="annapoorna"').join('==="bonbon"');

fs.mkdirSync(ROOT + "/public/bonbon", { recursive: true });
fs.writeFileSync(ROOT + "/public/bonbon/index.html", h);
console.log("WROTE public/bonbon/index.html — items:", entries.length, "— remaining 'annapoorna':", (h.match(/annapoorna/gi) || []).length);

// ---- AI route for Bon Bon ----
const catLabel = { scoops: "Scoops", softy: "Softy", waffle: "Waffle", icecream: "Ice Cream Specials", sundae: "Sundae", mini: "Mini Sundae", falooda: "Falooda", shakes: "Thick Shakes", snacks: "Snacks" };
let lines = [];
for (const g in groups) for (const it of groups[g]) lines.push(`${it[0]} | ${it[1]} | Rs.${it[2]} | ${catLabel[g]}`);
lines.push("extraicecream | Extra Ice Cream (add-on) | Rs.30 | Add-ons");
const menuTxt = lines.join("\n");

const route = `import { NextRequest, NextResponse } from "next/server";

// Auto-generated from the Bon Bon menu. Server-side only (the API key never reaches the browser).
const MENU = \`${menuTxt}\`;
const CATEGORIES = "Scoops, Softy, Waffle, Ice Cream Specials, Sundae, Mini Sundae, Falooda, Thick Shakes, Snacks";

function systemPrompt(lang: string, rest?: string) {
  return [
    "You are the warm, friendly AI server for " + (rest || "Bon Bon, an ice cream parlour") + ".",
    "You ONLY know the menu below. NEVER invent items or prices. If asked for something not on the menu, say it's unavailable and suggest a close alternative.",
    "Stay strictly about Bon Bon's ice creams, desserts, shakes and snacks. Politely decline anything unrelated.",
    "Reply ONLY in this language code: " + lang + ". Be warm and concise (1-2 short sentences).",
    "Feel free to use a few friendly dessert emojis (🍨🍦🧇😋) — but don't overdo it.",
    "You can take orders and help guests explore. Respond ONLY with a JSON object:",
    '{"reply":"<short message>","actions":[ ... ]}',
    "Each action is one of:",
    '{"type":"add","id":"<menu id>","qty":<number>}',
    '{"type":"show","ids":["<menu id>",...]}',
    '{"type":"none"}',
    "Use EXACT ids from the menu (first column). Categories: " + CATEGORIES + ".",
    "Thick Shakes can have an optional Extra Ice Cream add-on (id 'extraicecream', Rs.30) — only add it if the guest asks.",
    "ORDERING: when the guest wants to order, ALWAYS act — add every item you can identify in ONE reply. For anything unclear, add what you can and ask ONE short follow-up. Never refuse — keep the order moving warmly.",
    "To recommend, ALWAYS use a show action with 3-6 specific ids. MIX across categories for variety (e.g. a scoop, a sundae, a thick shake, a waffle). NEVER open or switch a category tab yourself.",
    "If a 'Guest taste profile' is provided, tailor picks to it and never suggest something they avoid.",
    "MENU (id | name | price | category):",
    MENU
  ].join("\\n");
}

export async function POST(req: NextRequest) {
  try {
    const { message, lang = "en", cart = [], restaurant = "", taste = "" } = await req.json();
    const key = process.env.GEMINI_API_KEY;
    if (!key) return NextResponse.json({ reply: "AI is not configured yet.", actions: [] });
    const body = {
      systemInstruction: { parts: [{ text: systemPrompt(lang, restaurant) }] },
      contents: [{ role: "user", parts: [{ text: (taste ? "Guest taste profile: " + taste + "\\n" : "") + "Current cart (ids): " + (cart.join(", ") || "empty") + "\\nGuest says: " + message }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.3, maxOutputTokens: 1200, thinkingConfig: { thinkingBudget: 0 },
        responseSchema: { type: "object", properties: { reply: { type: "string" }, actions: { type: "array", items: { type: "object", properties: { type: { type: "string" }, id: { type: "string" }, qty: { type: "number" }, ids: { type: "array", items: { type: "string" } }, name: { type: "string" } }, required: ["type"] } } }, required: ["reply"] } }
    };
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + key, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
    });
    const j = await r.json();
    if (!r.ok || (j && j.error)) {
      return NextResponse.json({ reply: "Sorry, I'm having a little trouble right now — please try again.", actions: [] });
    }
    let out: { reply?: string; actions?: unknown[] } = { reply: "", actions: [] };
    try { out = JSON.parse(j.candidates[0].content.parts[0].text); } catch { out = { reply: "Sorry, could you say that again?", actions: [] }; }
    return NextResponse.json({ reply: out.reply || "", actions: out.actions || [] });
  } catch {
    return NextResponse.json({ reply: "Sorry, something went wrong — please try again.", actions: [] });
  }
}
`;
fs.mkdirSync(ROOT + "/app/api/bonbon", { recursive: true });
fs.writeFileSync(ROOT + "/app/api/bonbon/route.ts", route);
console.log("WROTE app/api/bonbon/route.ts");
