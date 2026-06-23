// Builds the GENERIC white-label Odysra demo chatbot from the built Annapoorna bot.
// Reads public/ody/index.html, rebrands to Odysra (clean light theme, generic outlets,
// no Annapoorna name), writes public/restaurant/index.html. Run AFTER build_menu.js.
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
let h = fs.readFileSync(ROOT + "/public/ody/index.html", "utf8");

// ---------- 1. Clean minimal LIGHT theme ----------
h = h.replace(/:root\{[^}]*\}/,
  ":root{--blue:#222831;--ink:#1f2430;--mut:#8a909c;--line:#e7e9ee;--cream:#f6f7f8;--gold:#c79233;--card:#ffffff;--brandtop:#2b313a;--brandbot:#161a20;}");
// dark language bar
h = h.replace(".langbar{display:flex;gap:6px;overflow-x:auto;padding:8px 12px;background:#4d3017;scrollbar-width:none;-ms-overflow-style:none}",
  ".langbar{display:flex;gap:6px;overflow-x:auto;padding:8px 12px;background:#222831;scrollbar-width:none;-ms-overflow-style:none}");
// light page frame (behind the iframe)
h = h.replace("background:#0e1116;", "background:#e9ebee;");
// drop the doodle wallpaper -> clean solid surface
h = h.replace(/background-image:linear-gradient\(rgba\(246,238,221[^)]*\),rgba\([^)]*\)\),url\('chat-bg\.jpg'\);/,
  "background:#f6f7f8;");
// lighten dish-card image placeholder
h = h.replace("linear-gradient(135deg,#f3e9d2,#e9dcbf)", "linear-gradient(135deg,#f1f3f6,#e9ecf1)");

// ---------- 2. Odysra branding (no Annapoorna) ----------
h = h.replace(/const LOGO="data:image\/png;base64,[^"]*";/, 'const LOGO="/odysra_logo.png";');
h = h.replace('<div class="logo">A</div>', '<div class="logo">O</div>');
h = h.split("Annapoorna Spl. Filter Coffee").join("Special Filter Coffee");
// generic welcome (drop the restaurant name, all 6 languages)
h = h.replace(/welcome:\{[^}]*\}/,
  'welcome:{en:"Welcome! Which outlet are you dining at today?",ta:"வரவேற்கிறோம்! இன்று எந்தக் கிளையில் சாப்பிடுகிறீர்கள்?",hi:"स्वागत है! आज आप किस आउटलेट पर हैं?",ml:"സ്വാഗതം! ഇന്ന് ഏത് ഔട്ട്‌ലെറ്റിലാണ്?",te:"స్వాగతం! ఈ రోజు మీరు ఏ అవుట్‌లెట్‌లో ఉన్నారు?",kn:"ಸ್ವಾಗತ! ಇಂದು ನೀವು ಯಾವ ಔಟ್‌ಲೆಟ್‌ನಲ್ಲಿ ಇದ್ದೀರಿ?"}');
h = h.split("Annapoorna · ").join("Odysra · ");
h = h.split("Sree Annapoorna").join("Odysra");
h = h.replace(/<title>[^<]*<\/title>/, "<title>Odysra AI Waiter — Demo</title>");
// localized restaurant name in greeting/info -> Odysra
["அன்னபூர்ணா", "अन्नपूर्णा", "അന്നപൂർണ", "అన్నపూర్ణ", "ಅನ್ನಪೂರ್ಣ"].forEach(function (s) { h = h.split(s).join("Odysra"); });
h = h.split("0422-xxxxxxx").join("+91 98765 43210");
h = h.split("Annapoorna").join("Odysra"); // catch-all for any remaining ascii mentions
// remove the "Pure Vegetarian Restaurant" line on the outlet picker (white-label)
h = h.replace(/pureVeg:\{[^}]*\}/, 'pureVeg:{en:"",ta:"",hi:"",ml:"",te:"",kn:""}');

// ---------- 3. Generic outlets ----------
h = h.replace(/const OUTLETS=\[[^\]]*\]/,
  'const OUTLETS=["Main Branch","City Centre","Marina","Highway Road","Tech Park","Lakeview"]');

// ---------- 4. Route paths: /annapoorna -> /restaurant ----------
h = h.split('"/annapoorna/"').join('"/restaurant/"');
h = h.split('"/annapoorna"').join('"/restaurant"');
h = h.split('==="annapoorna"').join('==="restaurant"');

// ---------- 5. Generic AI prompt (white-label) ----------
h = h.replace("body:JSON.stringify({message:q,lang,cart:Object.keys(cart),taste:tasteStr()})",
  'body:JSON.stringify({message:q,lang,cart:Object.keys(cart),taste:tasteStr(),restaurant:"our restaurant (a multi-cuisine restaurant)"})');
if (h.indexOf('restaurant:"our restaurant') === -1) console.log("WARN: askOdy body not rewritten");

fs.mkdirSync(ROOT + "/public/restaurant", { recursive: true });
fs.writeFileSync(ROOT + "/public/restaurant/index.html", h);

// menu data (cleaned dish names) for the restaurant admin menu manager
let md = fs.readFileSync(ROOT + "/app/annapoorna/admin/menuData.ts", "utf8");
md = md.split("Annapoorna Spl. Filter Coffee").join("Special Filter Coffee");
fs.mkdirSync(ROOT + "/app/restaurant/admin", { recursive: true });
fs.writeFileSync(ROOT + "/app/restaurant/admin/menuData.ts", md);
console.log("WROTE app/restaurant/admin/menuData.ts");
const left = (h.match(/Annapoorna/gi) || []).length;
console.log("WROTE public/restaurant/index.html — remaining 'annapoorna' mentions:", left);
