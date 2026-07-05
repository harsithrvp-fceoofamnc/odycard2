// Builds the Bon Bon ice-cream-parlor chatbot from the Annapoorna template engine.
// Swaps the menu, rebrands to Bon Bon (white/maroon theme, logo), removes the outlet picker
// (single outlet -> straight to chat), and points the AI at /api/bonbon.
// Run:  node scripts/build_bonbon.js
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const TPL = path.join(ROOT, "annapoorna_chatbot_demo.html");

// Menu data (CM + groups, already name-disambiguated) comes from the single source of truth
// so the chatbot HTML and the Firestore-backed dashboards can never drift apart.
const { CM, groups } = require("./bonbonMenuData.js");

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
entries.push(' extraicecream:{n:"Extra Ice Cream",p:30,e:"🍨",h:[[8,23]],q:"",pt:1,ph:"",d:"An extra scoop of ice cream.",veg:1}');
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

// ---- LIVE MENU: pull the supervisor-managed menu from Firestore before first render ----
// The supervisor's edits (price, sold-out, hide, best/must, new items) show up for customers.
// Falls back to the baked-in menu if the fetch fails, so the bot always works.
const LIVE_FN = `
function bbApplyLiveMenu(items){
  try{
    var order=["scoops","softy","waffle","icecream","sundae","mini","falooda","shakes","snacks"];
    var labels={scoops:"Scoops",softy:"Softy",waffle:"Waffle",icecream:"Ice Cream Specials",sundae:"Sundae",mini:"Mini Sundae",falooda:"Falooda",shakes:"Thick Shakes",snacks:"Snacks"};
    Object.keys(MENU).forEach(function(k){delete MENU[k];});
    var byCat={};
    items.forEach(function(it){
      // add-ons (e.g. extra ice cream) stay available but never appear as their own card;
      // ordinary items only appear when they're not hidden and not sold out.
      var isAddon=it.cat==="addon";
      if(!isAddon && (it.hidden || it.available===0)) return;
      MENU[it.key]={n:it.name,p:it.price,e:"\\uD83C\\uDF68",h:[[8,23]],q:it.q||"",pt:it.pt||0,ph:"",d:it.desc||"",veg:1};
      if(it.best)MENU[it.key].best=1;
      if(it.must)MENU[it.key].must=1;
      if(it.ao)MENU[it.key].ao=it.ao;
      if(!isAddon)(byCat[it.cat]=byCat[it.cat]||[]).push(it);
    });
    CATS.length=0;
    order.forEach(function(c){
      var list=(byCat[c]||[]).sort(function(a,b){return (a.sort||0)-(b.sort||0);}).map(function(it){return it.key;});
      if(list.length)CATS.push({name:labels[c],ids:list});
    });
  }catch(e){}
}`;
h = h.replace("/* init */", LIVE_FN + "\n/* init */");
// init: fetch the live menu, then open the (single) outlet directly
h = h.replace("if(o)chooseOutlet(o);else renderOutlets();",
  "chooseOutlet(o||OUTLETS[0],true);fetch('/api/bonbon/menu').then(function(r){return r.json();}).then(function(d){if(d&&d.items&&d.items.length)bbApplyLiveMenu(d.items);}).catch(function(){}).then(function(){showGreeting();});");

// ---- REAL ORDERS: on successful payment, send the order to the kitchen board ----
h = h.replace(
  "saveCustomer({name:nm,phone:ph,last:orderedIds,at:Date.now(),visits:((getCustomer()||{}).visits||0)+1});",
  "saveCustomer({name:nm,phone:ph,last:orderedIds,at:Date.now(),visits:((getCustomer()||{}).visits||0)+1});" +
  "try{fetch('/api/bonbon/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:items.map(function(it){return {name:it.n,qty:it.q,price:it.p};}),total:gt,name:nm,phone:ph,mode:order.mode,table:(order.mode==='dine'?('Table '+order.table+(order.room?' ('+order.room+')':'')):'')})});}catch(e){}"
);
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
// hide dish timings on the cards (prep "~X min" + availability window) — Bon Bon only, for now
h = h.replace('if(m.pt)p.push("~"+m.pt+" min");if(SHOW_TIMING&&fmtWin(id))p.push(fmtWin(id));', "");
// (voice diagnostic readout stays OFF — window.__VDBG defaults to false)

// ---- recording pill + active mic: white text/icon (gold pill used near-black; on maroon it must be white) ----
h = h.replace(".micpill.on .microt{color:#3a2a05}", ".micpill.on .microt{color:#fff}");
h = h.replace(".micpill.on .micicon{stroke:#3a2a05}", ".micpill.on .micicon{stroke:#fff}");
h = h.replace(".mic.on{background:linear-gradient(135deg,#e3b956,#c79233);color:#3a2a05;border-color:#c79233}", ".mic.on{background:linear-gradient(135deg,#e3b956,#c79233);color:#fff;border-color:#c79233}");

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
h = h.split("#c8972f").join("#811226"); // typing-indicator dots

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
// single outlet -> keep the browser URL clean at /bon-bon (no nested outlet slug)
h = h.split('setUrl("/bonbon/"+slugify(o))').join('setUrl("/bon-bon")');
h = h.split('setUrl("/bonbon")').join('setUrl("/bon-bon")');

// (keep the original mobile phone-view framing — same as Annapoorna)

// ---- ice-cream tone: greeting, "specials", moods, find-for-me wording ----
h = h.replace(/const GREET=\{[\s\S]*?\};/,
  'const GREET={en:"Hi! 🍦 Welcome to Bon Bon Ice Creams — what are you craving today?",ta:"வணக்கம்! 🍦 பான் பான் ஐஸ்கிரீம்ஸுக்கு வரவேற்கிறோம் — இன்று என்ன விரும்புகிறீர்கள்?",hi:"नमस्ते! 🍦 बॉन बॉन आइसक्रीम्स में आपका स्वागत है — आज क्या खाने का मन है?",ml:"ഹായ്! 🍦 ബോൺ ബോൺ ഐസ്ക്രീംസിലേക്ക് സ്വാഗതം — ഇന്ന് എന്ത് വേണം?",te:"హాయ్! 🍦 బాన్ బాన్ ఐస్‌క్రీమ్స్‌కు స్వాగతం — ఈరోజు ఏం కావాలి?",kn:"ಹಾಯ್! 🍦 ಬಾನ್ ಬಾನ್ ಐಸ್‌ಕ್ರೀಮ್ಸ್‌ಗೆ ಸ್ವಾಗತ — ಇಂದು ಏನು ಬೇಕು?"};');
h = h.replace(/const FRESH=\{[\s\S]*?\};/,
  'const FRESH={en:"Here are some of our favourites 🍨👇",ta:"எங்கள் சில பிடித்தவை 🍨👇",hi:"हमारी कुछ पसंदीदा 🍨👇",ml:"ഞങ്ങളുടെ ചില പ്രിയപ്പെട്ടവ 🍨👇",te:"మా కొన్ని ఇష్టమైనవి 🍨👇",kn:"ನಮ್ಮ ಕೆಲವು ಮೆಚ್ಚಿನವು 🍨👇"};');
// "hot & fresh" specials line -> sweet favourites
h = h.replace("Here's what's <b>hot &amp; fresh</b> this ${part()} 👇", "Here are our sweet favourites 🍨👇");
// dessert moods for "Find what's for me"
h = h.replace(/const MOODS=\[[\s\S]*?\];/,
  'const MOODS=[' +
  '{k:"chocolatey",prompt:"something rich and chocolatey",lab:{en:"Chocolatey",ta:"சாக்லேட்",hi:"चॉकलेटी",ml:"ചോക്ലേറ്റ്",te:"చాక్లెట్",kn:"ಚಾಕ್ಲೇಟ್"}},' +
  '{k:"fruity",prompt:"something fruity and refreshing",lab:{en:"Fruity & fresh",ta:"பழச்சுவை",hi:"फ्रूटी",ml:"ഫ്രൂട്ടി",te:"ఫ్రూటీ",kn:"ಹಣ್ಣಿನ"}},' +
  '{k:"nutty",prompt:"something nutty and crunchy",lab:{en:"Nutty & crunchy",ta:"நட்ஸ்",hi:"नट्स वाला",ml:"നട്ട്സ്",te:"నట్స్",kn:"ಬೀಜಗಳ"}},' +
  '{k:"classic",prompt:"a classic, timeless ice cream flavour",lab:{en:"Classic flavour",ta:"கிளாசிக்",hi:"क्लासिक",ml:"ക്ലാസിക്",te:"క్లాసిక్",kn:"ಕ್ಲಾಸಿಕ್"}},' +
  '{k:"shake",prompt:"a thick, creamy milkshake",lab:{en:"A thick shake",ta:"திக் ஷேக்",hi:"थिक शेक",ml:"തിക് ഷേക്ക്",te:"థిక్ షేక్",kn:"ತಿಕ್ ಶೇಕ್"}},' +
  '{k:"waffle",prompt:"a warm waffle with ice cream",lab:{en:"Waffle treat",ta:"வாஃபிள்",hi:"वॉफल",ml:"വാഫിൾ",te:"వాఫిల్",kn:"ವಾಫಲ್"}},' +
  '{k:"popular",prompt:"the most popular, best-loved treats",lab:{en:"Most loved",ta:"அதிகம் விரும்பப்படுவது",hi:"सबसे पसंदीदा",ml:"ഏറ്റവും പ്രിയം",te:"అత్యంత ఇష్టమైనవి",kn:"ಅತಿ ಪ್ರಿಯ"}},' +
  '{k:"surprise",prompt:"surprise me with an exciting mix of treats",lab:{en:"Surprise me",ta:"ஆச்சரியப்படுத்து",hi:"सरप्राइज़ करें",ml:"അത്ഭുതപ്പെടുത്തൂ",te:"ఆశ్చర్యపరచండి",kn:"ಅಚ್ಚರಿ ಮಾಡಿ"}}' +
  '];');
// find-for-me AI wording -> desserts, not "eat / cuisines"
h = h.replace("The guest is deciding what to eat right now. Their mood/craving: ", "The guest is choosing a dessert at an ice cream parlour. Their craving: ");
h = h.replace("Recommend 5-6 dishes they'll enjoy, MIXED across different categories and cuisines so they get variety", "Recommend 5-6 treats they'll love, MIXED across categories (scoops, sundaes, shakes, waffles, falooda) for variety");

// ---- chips: drop banquet + change-outlet (not relevant), relabel header + info ----
h = h.replace('<button class="chip alt" onclick="banquet()">${IC.hall}${lbl("banquet")}</button><button class="chip alt" onclick="goOutlets()">${IC.pin}${lbl("changeOutlet")}</button>', "");
h = h.split("AI Waiter — powered by Odysra").join("AI Menu — powered by Odysra");
h = h.split("Restaurant info").join("Store info");

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
    "IMPORTANT: Bon Bon is an ICE CREAM PARLOUR. Almost everything is a COLD sweet treat — scoops, softy, sundaes, thick shakes, falooda, waffles. NEVER describe items as 'hot and fresh' or like cooked restaurant meals, and NEVER call yourself a 'waiter' serving food — you are helping pick desserts. Talk about flavours, scoops, toppings and sweetness.",
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
