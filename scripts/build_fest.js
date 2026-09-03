// Builds the three VIT food-stall menu pages from the REAL Bon Bon chatbot.
//
// It does NOT recreate the UI — it copies public/bonbon/index.html and applies a
// handful of surgical patches, so the shutter, board, awning, chat bubbles, dish
// cards and info sheet are byte-for-byte the chatbot's. What changes:
//   1. MENU + CATS  -> that stall's real menu (from lib/festMenu.ts)
//   2. the ask bar  -> removed (no typing, no mic, no send)
//   3. + Add        -> removed (browse only, no cart)
//   4. theme + art  -> per-stall board / awning / shutter / logo / colours
//   5. bot bubbles  -> get the mascot's face in a small circle
//   6. typewriter   -> off; the whole line lands at once
//
// Run:  node scripts/build_fest.js
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "public", "bonbon", "index.html");

/* ── read the menus straight out of the TS source (single source of truth) ── */
function readFestMenu() {
  const ts = fs.readFileSync(path.join(ROOT, "lib", "festMenu.ts"), "utf8");
  const stalls = {};
  for (const key of ["BONBON", "KIMCHI", "DVOUR"]) {
    const start = ts.indexOf(`const ${key}: FestStall = {`);
    if (start < 0) throw new Error("stall not found: " + key);
    // walk braces to find the end of the object
    let i = ts.indexOf("{", start), depth = 0, end = -1;
    for (let j = i; j < ts.length; j++) {
      if (ts[j] === "{") depth++;
      else if (ts[j] === "}") { depth--; if (depth === 0) { end = j + 1; break; } }
    }
    const body = ts.slice(i, end);
    const name = (body.match(/name:\s*"([^"]+)"/) || [])[1];
    const tagline = (body.match(/tagline:\s*"([^"]+)"/) || [])[1];
    const stallKey = (body.match(/key:\s*"([^"]+)"/) || [])[1];

    const cats = [];
    const catRe = /\{\s*key:\s*"([^"]+)",\s*label:\s*"([^"]+)",\s*items:\s*\[([\s\S]*?)\n\s{6}\],/g;
    let cm;
    while ((cm = catRe.exec(body))) {
      const items = [];
      const itemRe = /\{\s*id:\s*"([^"]+)",([\s\S]*?)\},?\s*(?=\n\s*\{|\n\s*\]|\s*$)/g;
      let im;
      while ((im = itemRe.exec(cm[3]))) {
        const raw = im[2];
        const g = (re) => { const m = raw.match(re); return m ? m[1] : null; };
        items.push({
          id: im[1],
          n: g(/\bn:\s*"((?:[^"\\]|\\.)*)"/),
          p: parseInt(g(/\bp:\s*(\d+)/) || "0", 10),
          d: (g(/\bd:\s*"((?:[^"\\]|\\.)*)"/) || "").replace(/\\"/g, '"'),
          veg: g(/\bveg:\s*(\d)/) === "1",
          tag: g(/\btag:\s*"([^"]+)"/),
          off: g(/\boff:\s*(\d)/) === "1",
        });
      }
      cats.push({ key: cm[1], label: cm[2], items });
    }
    stalls[stallKey] = { key: stallKey, name, tagline, cats };
  }
  return stalls;
}

/* ── per-stall look ── */
const SKIN = {
  bonbon: {
    file: "bonbon", title: "Bon Bon — Menu",
    vars: { blue: "#811226", ink: "#f1f1f1", mut: "#9d9d9d", line: "#242424", cream: "#000000",
            gold: "#811226", card: "#161616", brandtop: "#811226", brandbot: "#5a0c1a" },
    wood: "/wood_web.jpg", awning: "/awning_web.png", shutter: "/shutter_web.jpg", logo: "/logo_web.png",
    greet: "Hi! 🍦 Welcome to Bon Bon Ice Creams — what are you craving today?", emoji: "🍨",
    // The dishes the stall pushes: they fill the opening "our favourites" grid and
    // "Today's picks". topDishes() prefers anything flagged promoted over its own guess.
    promote: ["bb_lotus", "bb_caramel", "bb_bub_cookie", "bb_spanish"],
    filters: ["best", "must"],   // every Bon Bon item is veg, so no diet filter
    // #811226 is too dark to read as text or a border on black, so the on-black accent is
    // the same hue lifted. The fills (.me bubble, active chip) keep the true brand maroon.
    accentDark: "#e8557c",
    accentRgb: "0,0,0",
    hasAwning: false,
  },
  kimchi: {
    file: "kimchi", title: "Kim Chi & Ramen — Menu",
    vars: { blue: "#c8141e", ink: "#f1f1f1", mut: "#9d9d9d", line: "#242424", cream: "#000000",
            gold: "#c8141e", card: "#161616", brandtop: "#d8323c", brandbot: "#96101c" },
    wood: "/fest/kimchi_board.png", awning: "/fest/kimchi_awning.png",
    shutter: "/kimchi_shutter.png", logo: "/kimchi_new_logo.png",
    greet: "Hi! 🍜 Welcome to Kim Chi & Ramen — what are you craving today?", emoji: "🍜",
    promote: ["kr_s_kwingst", "kr_mc_cramen", "kr_m_cmongol", "kr_mc_svramen"],
    // Kim Chi is the only stall with new dishes on it — the whole Mongolian line.
    filters: ["veg", "nonveg", "best", "must", "neu"],
    accentRgb: "0,0,0",
    accentDark: "#ff4d55",   // its own red already carries on black
    hasAwning: false, lanterns: true,
  },
  dvour: {
    file: "dvour", title: "D'VOUR — Menu",
    vars: { blue: "#a87c00", ink: "#f1f1f1", mut: "#9d9d9d", line: "#242424", cream: "#000000",
            gold: "#ffc400", card: "#161616", brandtop: "#1d1d1f", brandbot: "#050505" },
    wood: "", awning: "", shutter: "/fest/dvour_shutter.png", logo: "/fest/logo_dvour.png",
    greet: "Hi! 🍔 Welcome to D'VOUR — what are you craving today?", emoji: "🍔",
    // Chicken versions where the dish comes both ways: Signature ₹290, Mexican Rice ₹220,
    // Seoul Street Wrap ₹230. Green Flag Burger only exists the one way.
    promote: ["dv_b_green", "dv_b_csig", "dv_x_ricec", "dv_w_seoc"],
    filters: ["veg", "nonveg", "best", "must"],
    accentRgb: "0,0,0",
    accentDark: "#ffc400",
    hasAwning: false,
  },
};

/* ── turn a stall into the chatbot's MENU / CATS shapes ── */
function menuJs(stall, sk) {
  const entries = [];
  const promote = new Set(sk.promote || []);
  const seen = new Set();
  for (const c of stall.cats) {
    // The emoji still tags each dish card, but it is stripped off the category NAME —
    // the category blocks are plain text. Match pictographs specifically so a category
    // that happens to start with a normal word doesn't lose it.
    const em = c.label.match(/^([\p{Extended_Pictographic}️]+)\s*/u);
    const emoji = em ? em[1] : "🍽️";
    for (const it of c.items) {
      let o = `{n:${JSON.stringify(it.n)},p:${it.p},e:${JSON.stringify(emoji)},h:[[8,23]],q:"",pt:8,ph:"",d:${JSON.stringify(it.d)},veg:${it.veg ? 1 : 0}`;
      if (!it.veg) o += ",nv:1";
      if (it.tag) o += `,tagtxt:${JSON.stringify(it.tag)}`;
      if (it.off) o += ",off:1";
      if (promote.has(it.id)) { o += ",promoted:1"; seen.add(it.id); }
      o += "}";
      entries.push(` ${it.id}:${o}`);
    }
  }
  const cats = stall.cats.map((c) => {
    const em = c.label.match(/^([\p{Extended_Pictographic}️]+)\s*/u);
    const name = em ? c.label.slice(em[0].length) : c.label;
    return ` {name:${JSON.stringify(name)},ids:${JSON.stringify(c.items.map((i) => i.id))}}`;
  });
  // A promoted id that matches nothing is a silent no-op at runtime — catch it here.
  for (const id of promote) if (!seen.has(id)) throw new Error(`promote: no such item "${id}" in ${stall.key}`);
  return { menu: "const MENU={\n" + entries.join(",\n") + "\n};", cats: "const CATS=[\n" + cats.join(",\n") + "\n];" };
}

/** Replace a whole `function NAME(…){…}` with `replacement`.
 *
 *  This needs a real scanner, not a regex. The chatbot's functions are full of template
 *  literals like `<button onclick="explainDish('${id}')">`, and a lazy [\s\S]*?\} stops at
 *  the "}" of ${id} — leaving the tail of the old body dangling after the new one. That
 *  produced a SyntaxError, which meant NO script on the page ran at all: the boot splash
 *  sat there forever and the chat never appeared. So: walk the characters, and only count
 *  braces while outside strings, template literals, regex-ish slashes and comments. */
function replaceFn(src, name, replacement) {
  const sig = new RegExp("function\\s+" + name + "\\s*\\(");
  const m = sig.exec(src);
  if (!m) throw new Error("function not found: " + name);
  const start = m.index;
  const body = src.indexOf("{", src.indexOf(")", m.index));
  if (body < 0) throw new Error("no body for: " + name);

  let depth = 0, quote = null, end = -1;
  for (let j = body; j < src.length; j++) {
    const c = src[j], n = src[j + 1];
    if (quote) {
      if (c === "\\") { j++; continue; }        // escaped char — skip it
      if (c === quote) quote = null;            // ${…} inside a template stays "in string",
      continue;                                 // so its braces are skipped as a matched pair
    }
    if (c === "/" && n === "/") { const nl = src.indexOf("\n", j); if (nl < 0) break; j = nl; continue; }
    if (c === "/" && n === "*") { j = src.indexOf("*/", j) + 1; continue; }
    if (c === '"' || c === "'" || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) { end = j + 1; break; } }
  }
  if (end < 0) throw new Error("unterminated function: " + name);
  return src.slice(0, start) + replacement + src.slice(end);
}

function replaceBlock(src, startNeedle, open, close) {
  const s = src.indexOf(startNeedle);
  if (s < 0) throw new Error("not found: " + startNeedle);
  let i = src.indexOf(open, s), depth = 0, end = -1;
  for (let j = i; j < src.length; j++) {
    if (src[j] === open) depth++;
    else if (src[j] === close) { depth--; if (depth === 0) { end = j + 1; break; } }
  }
  // include the trailing semicolon
  while (src[end] === ";") end++;
  return [src.slice(0, s), src.slice(end)];
}

function build(stallKey, stalls) {
  const stall = stalls[stallKey];
  const sk = SKIN[stallKey];
  let s = fs.readFileSync(SRC, "utf8");
  const { menu, cats } = menuJs(stall, sk);
  const extra = []; // CSS appended last, so it wins on source order without !important spam

  // 1 ── swap MENU and CATS
  let [a, b] = replaceBlock(s, "const MENU=", "{", "}");
  s = a + menu + b;
  [a, b] = replaceBlock(s, "const CATS=", "[", "]");
  s = a + cats + b;

  // 2 ── the ask bar goes, but #bar and #inp stay as inert, permanently hidden stubs.
  //
  // Deleting the nodes outright was wrong. The chatbot's boot path runs
  //     chooseOutlet() -> document.getElementById("bar").style.display=""
  //                    -> document.getElementById("inp").placeholder=T("ask")
  // with no null guard, so on a page with no bar that threw immediately and killed the
  // script *during boot* — the white splash with the logo stayed up forever and the chat
  // never rendered. Same story in setLang and the whole voice-input block.
  //
  // Keeping empty stubs costs nothing: there is no textarea to type into (it is readonly,
  // inside a display:none container), no mic, no send, no cart button. Guests still can't
  // type. Nothing throws.
  {
    const OPEN = '<div class="barwrap" id="bar">';
    const st = s.indexOf(OPEN);
    if (st < 0) throw new Error("ask bar not found — did the chatbot markup change?");
    let depth = 0, end = -1, m;
    const re = /<div\b|<\/div>/g;
    re.lastIndex = st;
    while ((m = re.exec(s))) {
      if (m[0] === "</div>") { depth--; if (depth === 0) { end = m.index + 6; break; } }
      else depth++;
    }
    if (end < 0) throw new Error("ask bar has no matching </div>");
    s = s.slice(0, st) +
        '<div class="barwrap" id="bar" aria-hidden="true"><textarea id="inp" tabindex="-1" readonly></textarea></div>' +
        s.slice(end);
  }

  // 2b ── setUrl() must not touch the page that hosts us.
  // The original does window.parent.history.replaceState(null,"","/bon-bon"), which rewrote
  // the address bar from /bon-bon-stall to /bon-bon the instant a stall opened. Reload or
  // Back then landed on /bon-bon — a gated page — so the guest got bounced to the access
  // code screen and on to the hub. Inside the fest iframe the URL must stay put.
  s = replaceFn(s, "setUrl", "function setUrl(){}");

  // 2c ── no live-menu fetch. /api/bonbon/menu is staff-gated and would 302 for a guest,
  // and even when it worked it would overwrite this stall's fixed fest menu with Bon Bon's.
  s = s.replace(
    /fetch\('\/api\/bonbon\/menu'\)[\s\S]*?\.then\(function\(\)\{bbBoot\(\);\}\);/,
    "bbBoot();"
  );

  // 3 ── no + Add anywhere: dish cards keep only the info button, pairings show the price
  s = replaceFn(s, "dishFooter",
    'function dishFooter(id){return `<button class="infob" onclick="explainDish(\'${id}\')" title="Tell me about this">${IC.info}</button>`;}');
  s = replaceFn(s, "pairFoot",
    'function pairFoot(id){return `<span class="pr">₹${MENU[id].p}</span>`;}');
  // and make sure nothing else can add to a cart
  s = replaceFn(s, "addDish", "function addDish(){}");

  // 4 ── theme + artwork
  for (const [k, v] of Object.entries(sk.vars)) {
    s = s.replace(new RegExp(`--${k}:#[0-9a-fA-F]{3,8}`), `--${k}:${v}`);
  }
  s = s.replace(/\/wood_web\.jpg/g, sk.wood || "/wood_web.jpg")
       .replace(/\/awning_web\.png/g, sk.awning || "/awning_web.png")
       .replace(/\/shutter_web\.jpg/g, sk.shutter)
       .replace(/\/logo_web\.png/g, sk.logo);
  s = s.replace(/<title>[^<]*<\/title>/, `<title>${sk.title}</title>`);
  // the watermark / fallback logo, and Bon Bon's category photos (wrong food for the others)
  s = s.replace(/const LOGO="[^"]*";/, `const LOGO="${sk.logo}";`);
  s = s.replace(/var CATPIC=\{[^}]*\};/, "var CATPIC={};");
  s = s.replace(/setTimeout\(function\(\)\{\["\/cat_[\s\S]*?\n/, "\n");

  // 4b ── the page background.
  // :root --cream is per-stall, but a later rule hardcodes #phone{background:#f2e0de},
  // which is Bon Bon's pink — so every stall came out pink no matter what --cream said.
  // Point it at the variable instead. (String.replace with no match is a silent no-op,
  // which is exactly how the old #board/#awning patches below "worked" for weeks.)
  const bgBefore = s;
  s = s.replace(/(#phone\{\s*)background:#f2e0de;/, "$1background:var(--cream);");
  if (s === bgBefore) throw new Error("page background rule not found — chatbot CSS changed");

  // 4b2 ── an image behind the whole screen, for stalls that want one.
  // This has to be pushed as an override rather than edited into the #phone rule: the
  // stall's own art paths must NOT go through the /wood_web.jpg swap in patch 4 below.
  if (sk.pageBg) extra.push(
    `#phone{background-image:${sk.pageBg};background-size:cover,cover;` +
    "background-position:center,center;background-repeat:no-repeat,no-repeat}");

  // 4c ── the board (header.woodhdr). Bon Bon keeps the wood and its dark scrim; the other
  // two get their own rule appended, so it wins on source order.
  if (sk.board) extra.push(sk.board);

  // 4d ── D'VOUR has no awning at all, so the chat's awning allowance goes with it.
  if (!sk.hasAwning) extra.push(".awnbar{display:none}", "#chat{padding-top:14px}");

  // 4e ── Kim Chi's two lanterns hang from the top of the board, one each side of the logo.
  // They're separate images, not the one wide PNG, because a pendulum has to swing about
  // its OWN cord: rotating a single image containing both would pivot them around a point
  // between them and slide them sideways. transform-origin sits on each cord (45% / 54% of
  // the crop), and the two run at different speeds so they don't march in lockstep.
  if (sk.lanterns) {
    extra.push(
      // Inside the header, not on #phone: the chatbot collapses header.woodhdr with a
      // negative margin-top as you scroll the chat, and lanterns parked on #phone stayed
      // put and floated over the messages. As children of the board they leave with it.
      ".lantern{position:absolute;top:0;width:17%;z-index:4;pointer-events:none}",
      ".lantern.l{left:3%;transform-origin:45% 0;animation:swayL 5.2s ease-in-out infinite}",
      ".lantern.r{right:3%;transform-origin:54% 0;animation:swayR 6.1s ease-in-out infinite}",
      "@keyframes swayL{0%,100%{transform:rotate(-3.5deg)}50%{transform:rotate(3.5deg)}}",
      "@keyframes swayR{0%,100%{transform:rotate(3deg)}50%{transform:rotate(-3deg)}}"
    );
    s = s.replace(/(<header class="woodhdr">)/,
      '$1<img class="lantern l" src="/fest/kimchi_lantern_l.png" alt="">' +
      '<img class="lantern r" src="/fest/kimchi_lantern_r.png" alt="">');
  }

  // 4h ── the selection glow. Twenty-odd shadows across the stylesheet hardcode Bon Bon's
  // maroon rgba(129,18,38,…) — on D'VOUR every chip and card lit up purple. One global
  // swap of the RGB triple keeps each shadow's own alpha.
  if (sk.accentRgb) s = s.split("rgba(129,18,38,").join(`rgba(${sk.accentRgb},`);
  // Same story for the solid maroon: the typing dots, spinner and a few gradients name
  // #811226 directly rather than var(--blue), so they ignored the theme entirely.
  if (sk.vars.blue !== "#811226") s = s.split("#811226").join(sk.vars.blue);

  // 4i ── the boot logo is forced to Bon Bon's 480x248. D'VOUR's mark is 620x181 and
  // Kim Chi's 620x372, so both were stretched to a shape they aren't. Let the image decide.
  extra.push("#bootveil .bootlogo{aspect-ratio:auto}");

  // 4g ── the boot splash behind the shutter, which shows the stall logo while art loads.
  if (sk.bootveil) extra.push(`#bootveil{background:${sk.bootveil}}`);

  // 4f ── no language globe. It isn't just unused here, it's broken: setLang() re-runs
  // showGreeting(), which reads GREET[lang], and the fest build ships English only — any
  // other language would throw. #langbar stays in the DOM (init writes to it) but hidden.
  const langBefore = s;
  s = s.replace(/<button class="langtoggle"[\s\S]*?<\/button>/, "");
  if (s === langBefore) throw new Error("language toggle not found");
  extra.push("#langbar{display:none!important}");

  // 4j ── the shutter covers the WHOLE screen, logo included, then rolls up off it.
  // It used to anchor to the awning's top, which on a stall with no awning resolved to 0
  // anyway; now it is pinned to 0 deliberately and lifted above the lanterns so nothing
  // pokes through the closed shutter.
  s = replaceFn(s, "showShutter",
    'function showShutter(){ if(!frame)return;\n' +
    '    frame.style.top="0px";\n' +
    '    if(bar)bar.style.visibility="hidden";\n' +
    '    frame.classList.add("on");\n' +
    '  }');

  // 5 ── mascot face beside every waiter bubble.
  // mascot_face.png is a head crop with transparent headroom, so plain center/contain shows
  // the whole head. The old "center 12% / 150%" zoomed in and sliced the top of his hair off.
  s = s.replace(/\.bot\{align-self:flex-start;/, ".bot{align-self:flex-start;position:relative;margin-left:42px;");
  extra.push(
    '.bot:before{content:"";position:absolute;left:-42px;bottom:0;width:34px;height:34px;border-radius:50%;' +
      "background:#fff url('/fest/mascot_face.png') center bottom / 100% auto no-repeat;" +
      "border:1.5px solid var(--line);box-shadow:0 1px 4px rgba(0,0,0,.12)}"
  );

  // 5a1 ── no badges on the dish cards.
  // The BESTSELLER / MUST TRY / NEW labels stay in the data (MENU[id].tagtxt) because the
  // filters read them, but nothing is drawn on the card — the pills were noise, and they
  // were what made the cards uneven in the first place.
  s = replaceFn(s, "tagsHTML", 'function tagsHTML(){return "";}');

  // Every dish card the same size: veg dot, name, price, info button and nothing else.
  // A fixed min-height with the price pinned to the bottom means a two-line name never
  // leaves the card beside it looking half empty, and rows line up with each other.
  extra.push(".grid{align-items:stretch}",
    ".dish.simple{min-height:104px}",
    ".dish.simple .sbd{padding:13px;gap:4px}",
    ".sfoot{margin-top:auto}",
    ".tags,.tag{display:none}");

  // 5a2 ── the description leaves the card; it belongs to the info button.
  // Everything else about the card is untouched: veg dot, name, badge, price, the button.
  s = replaceFn(s, "compactCard",
    'function compactCard(id){const m=MENU[id];\n' +
    ' return `<div class="dish simple" data-id="${id}"><div class="sbd">' +
    '<div class="srow"><span class="vegdot${m.nv?\' nv\':\'\'}"></span><div class="nm">${dn(id)}</div></div>' +
    '${tagsHTML(m)}${dishMeta(id)?`<div class="meta">${dishMeta(id)}</div>`:""}' +
    '<div class="sfoot"><div class="pr">\u20b9${m.p}</div><div class="frow">${dishFooter(id)}</div></div>' +
    '</div></div>`;}');

  // 5a3 ── the filter bar.
  // Hooking the filters into avail() rather than into each grid means the whole page obeys
  // them at once: the category list drops categories that go empty, the specials grid
  // re-picks, and openCat() shows a filtered list — one switch, everywhere.
  //   FDIET  0 = any, 1 = veg only, 2 = non-veg only   (mutually exclusive by nature)
  //   FTAG   "" | BESTSELLER | MUST TRY | NEW          (one at a time; they overlap)
  // Diet and tag stack, so "Veg only + Must try" is a valid, useful combination.
  {
    // ONE filter at a time. Diet and tag used to be two independent variables, so you could
    // hold "Non-veg only" and "Must try" together; they are a single FILTER value now, and
    // tapping a chip either selects it or, if it was already on, clears it.
    const FILTERS = {
      veg:    ["veg",        "Veg only"],
      nonveg: ["nonveg",     "Non-veg only"],
      best:   ["BESTSELLER", "\u2605 Bestsellers"],
      must:   ["MUST TRY",   "\u2726 Must try"],
      neu:    ["NEW",        "\u2726 New"],
    };
    const chipJs = (f) => {
      const [val, label] = FILTERS[f];
      return `'<button class="chip '+(FILTER===${JSON.stringify(val)}?'go':'alt')`
        + `+'" onclick="setFilter(&quot;${val}&quot;)">${label}</button>'`;
    };
    // "New" leads the row rather than trailing the diet filters — it is the thing the
    // stall wants noticed, so it sits ahead of "Today's specials" instead of below it.
    const hasNew = (sk.filters || []).includes("neu");
    const newChip = hasNew ? chipJs("neu") : "''";
    const chips = (sk.filters || []).filter((f) => f !== "neu").map(chipJs);
    if (!chips.length) chips.push("''");

    s = s.replace(
      "const avail=id=>!TIME_FILTER||!OPEN||(HOUR>=MENU[id].h[0]&&HOUR<MENU[id].h[1]);",
      "var FILTER=\"\",LASTCAT=-1;\n" +
      "function hasTag(id,t){return (MENU[id].tagtxt||\"\").split(\",\").indexOf(t)>=0;}\n" +
      "function filterPass(id){if(!FILTER)return true;\n" +
      " if(FILTER==='veg')return !MENU[id].nv;\n" +
      " if(FILTER==='nonveg')return !!MENU[id].nv;\n" +
      " return hasTag(id,FILTER);}\n" +
      // renderGrid anchors the scroll to the grid, then the chip row that follows calls
      // toBottom() again with no anchor and lands on chat.scrollHeight. Re-anchor after it,
      // unconditionally — renderGrid only self-anchors past 2 dishes, so a 2-dish result
      // used to scroll straight past itself.
      "function anchorGrid(g,after){window.__userScroll=false;(after||exploreBar)();_bigTarget=g;toBottom();}\n" +
      // The feedback toggle rides in the same row as the filters, so it is present on
      // every chip row the guest ever sees without a second layout to maintain.
      "function newChip(){return " + newChip + ";}\n" +
      "function filterChips(){return " + chips.join("+") +
      "+'<button class=\"chip alt\" onclick=\"odyFeedback()\">\\u2606 Feedback</button>';}\n" +

      // ── Feedback sheet ────────────────────────────────────────────────────
      // Two ratings kept separate on purpose: the FOOD is the stall's, the APP is ours.
      // Send stays disabled until both are set; the comment is optional, because a guest
      // in a queue will give you stars and nothing else, and that is still worth having.
      "var FB={food:0,app:0};\n" +
      "function fbStarRow(k){var h='';for(var i=1;i<=5;i++){h+='<button class=\"fbst'+(FB[k]>=i?' on':'')+" +
      "'\" onclick=\"fbSet(&quot;'+k+'&quot;,'+i+')\" aria-label=\"'+i+' out of 5\">\\u2605</button>';}return h;}\n" +
      "function fbSet(k,n){FB[k]=n;fbPaint();}\n" +
      "function fbPaint(){var f=document.getElementById('fbFood'),a=document.getElementById('fbApp')," +
      "b=document.getElementById('fbSend');\n" +
      " if(f)f.innerHTML=fbStarRow('food');if(a)a.innerHTML=fbStarRow('app');\n" +
      " if(b)b.disabled=!(FB.food&&FB.app);}\n" +
      "function odyFeedback(){FB={food:0,app:0};\n" +
      " sheet.innerHTML='<h3 class=\"fbh\">How did we do?</h3>'+\n" +
      "  '<div class=\"fbrow\"><span>The food</span><span id=\"fbFood\" class=\"odystars\"></span></div>'+\n" +
      "  '<div class=\"fbrow\"><span>This menu app</span><span id=\"fbApp\" class=\"odystars\"></span></div>'+\n" +
      "  '<textarea id=\"fbTxt\" class=\"fbtxt\" rows=\"3\" maxlength=\"500\" placeholder=\"Anything else? (optional)\"></textarea>'+\n" +
      "  '<div id=\"fbMsg\" class=\"fbmsg\"></div>'+\n" +
      "  '<button id=\"fbSend\" class=\"chip go fbbtn\" onclick=\"sendFeedback()\" disabled>Send feedback</button>'+\n" +
      "  '<button class=\"chip alt fbbtn\" onclick=\"closeModal()\">Not now</button>';\n" +
      " modal.style.display='flex';fbPaint();odyga('feedback_open',{});}\n" +
      "function sendFeedback(){var b=document.getElementById('fbSend');if(!b||b.disabled)return;\n" +
      " var t=document.getElementById('fbTxt'),msg=document.getElementById('fbMsg');\n" +
      " var txt=t?t.value:'';b.disabled=true;msg.textContent='Sending\\u2026';\n" +
      " fetch('/api/fest/feedback',{method:'POST',headers:{'Content-Type':'application/json'},\n" +
      "  body:JSON.stringify({stall:STALL_KEY,food:FB.food,app:FB.app,comment:txt})})\n" +
      " .then(function(r){return r.json().catch(function(){return {};}).then(function(j){\n" +
      "   if(!r.ok)throw new Error(j.error||'Could not send.');return j;});})\n" +
      " .then(function(){odyga('feedback_submit',{food:FB.food,app:FB.app,has_comment:txt?1:0});\n" +
      "  sheet.innerHTML='<h3 class=\"fbh\">Thank you \\u{1F64F}</h3>'+\n" +
      "   '<p class=\"fbthx\">This goes straight to the team.</p>'+\n" +
      "   '<button class=\"chip go fbbtn\" onclick=\"closeModal()\">Done</button>';})\n" +
      " .catch(function(e){msg.textContent=(e&&e.message)||'Could not send. Try again.';b.disabled=false;});}\n" +
      "function setFilter(v){FILTER=(FILTER===v?\"\":v);odyga('filter_click',{filter:v,active:FILTER===v});refilter();}\n" +
      "function filterLabel(){return FILTER==='veg'?'Veg':FILTER==='nonveg'?'Non-veg'\n" +
      "  :FILTER==='BESTSELLER'?'Bestsellers':FILTER==='NEW'?'New':'Must try';}\n" +
      "function showFiltered(){var ids=Object.keys(MENU).filter(avail);\n" +
      " if(!ids.length){bot('Nothing on the menu matches that.');block('chips',filterChips());return;}\n" +
      " bot('<b>'+filterLabel()+'</b>:');anchorGrid(renderGrid(ids));}\n" +
      // "View full menu" for a guest with no time to browse categories: the whole menu
      // in one grid, veg first then non-veg. sort() is stable, so within each half the
      // dishes stay in printed-menu order.
      "function showAll(){FILTER=\"\";LASTCAT=-1;me('View full menu');\n" +
      " var ids=Object.keys(MENU).filter(avail);\n" +
      " ids.sort(function(a,b){return (MENU[a].nv?1:0)-(MENU[b].nv?1:0);});\n" +
      " odyga('view_full_list',{count:ids.length});\n" +
      " bot('Here is the whole menu \\u{1F447}');anchorGrid(renderGrid(ids));}\n" +
      "function refilter(){if(FILTER){LASTCAT=-1;showFiltered();}else if(LASTCAT>=0)openCat(LASTCAT);else showCats();}\n" +
      "const avail=id=>filterPass(id)&&(!TIME_FILTER||!OPEN||(HOUR>=MENU[id].h[0]&&HOUR<MENU[id].h[1]));"
    );

    // openCat has to remember where we are, so a filter tap re-renders THIS category
    // rather than bouncing the guest back to the category list.
    s = replaceFn(s, "openCat",
      'function openCat(i){if(!CATS[i])return;LASTCAT=i;const c=CATS[i];me(cn(c.name));\n' +
      ' odyga("view_item_list",{item_list_id:c.key||String(i),item_list_name:cn(c.name)});\n' +
      ' var ids=(c.ids||[]).filter(avail);\n' +
      ' if(!ids.length){bot("Nothing in <b>"+cn(c.name)+"</b> matches that filter.");\n' +
      '  block("chips",filterChips()+`<button class="chip alt" onclick="LASTCAT=-1;explore()">${IC.back}${lbl("back")}</button>`);return;}\n' +
      ' bot(`<b>${cn(c.name)}</b>:`);anchorGrid(renderGrid(ids));}');
  }

  // 5a4 ── analytics.
  // These pages are static HTML in an iframe, so they have no gtag of their own and
  // loading a second one would open a second GA session on the same visit. Instead each
  // event is posted up to the parent, which owns the GA4 context and replays it — one
  // property, one session, and the page path stays /bon-bon-stall. Targeted at our own
  // origin, never "*", and it degrades to nothing if the page is opened outside the app.
  s = s.replace("const avail=id=>",
    "function odyga(n,p){try{if(window.parent&&window.parent!==window)" +
      "window.parent.postMessage({__odyga:{name:n,params:Object.assign({stall:STALL_KEY},p||{})}},location.origin);}catch(e){}}\n" +
    `const STALL_KEY=${JSON.stringify(stallKey)};\n` +
    "const avail=id=>");

  // the info button is the one real "tell me about this dish" signal on these pages
  s = replaceFn(s, "explainDish",
    'function explainDish(id){const m=MENU[id];\n' +
    ' odyga("select_item",{item_id:id,item_name:dn(id),price:m.p});\n' +
    ' bot(`<b>${dn(id)}</b> — ${desc(id)} <span style="color:#7a4a24;font-weight:700">\u20b9${m.p}</span>' +
      '<br><span class="meta">${dishMeta(id)}</span>`);\n' +
    ' anchorGrid(block("grid",[dishCard(id)]));}');

  // 5b ── categories exactly as Sree Annapoorna does them: a wrapping row of chips.
  // No photo, which also kills the bug where Bon Bon's ice-cream shot was the fallback
  // image for every Kim Chi and D'VOUR category.
  s = replaceFn(s, "explore",
    'function showCats(){const cs=CATS.filter(c=>(c.ids||(c.subs||[]).flatMap(s=>s.ids)).some(avail));\n' +
    ' if(!cs.length){bot("Nothing veg on this menu just now.");block("chips",filterChips());return;}\n' +
    ' bot(`${T("whatExplore")}`);\n' +
    ' block("chips",cs.map((c)=>`<button class="chip" onclick="openCat(${CATS.indexOf(c)})">${cn(c.name)}</button>`).join("")' +
    '+filterChips()+`<button class="chip alt" onclick="mainChips()">${IC.home}${lbl("home")}</button>`);}\n' +
    'function explore(){FILTER="";me(T("exploreMore"));odyga("view_full_menu");showCats();}');
  extra.push(
    ".chips{gap:9px}",
    ".chip{font-size:15.5px;padding:10px 17px;border-radius:22px}",
    ".catgrid,.catpic{display:none}"
  );

  // 5c ── the ⓘ button is a circle
  extra.push(".infob{width:38px;height:38px;padding:0;border-radius:50%;flex:0 0 auto;align-self:center;" +
    "display:flex;align-items:center;justify-content:center}");

  // 6 ── the waiter "types" first, then the whole line lands at once.
  // The delayed swap only re-scrolls if this bubble is still the newest thing in the
  // chat. Without that check it fired 560ms after a filter had already rendered a grid
  // below it, scrolling straight past the dishes to the bottom of the list.
  // No letter-by-letter reveal (you asked for the full sentence in one go), but the bubble
  // opens as three bouncing dots for a beat so it feels like he's writing it. The SAME node
  // becomes the message, so callers that keep the return value (anchorReply) still work.
  s = replaceFn(s, "bot",
    'function bot(html,onDone){\n' +
    '  var d=document.createElement("div");d.className="msg bot typing";\n' +
    '  d.innerHTML=\'<span class="dot"></span><span class="dot"></span><span class="dot"></span>\';\n' +
    '  chat.appendChild(d);toBottom();\n' +
    '  var s=String(html==null?"":html);\n' +
    '  setTimeout(function(){\n' +
    '    d.classList.remove("typing");\n' +
    '    if(/<[a-z!\\/][\\s\\S]*>/i.test(s))d.innerHTML=s;else d.textContent=s;\n' +
    '    if(d===chat.lastElementChild)toBottom();\n' +
'    if(onDone)onDone();\n' +
    '  },560);\n' +
    '  return d;\n' +
    '}'
  );

  // 7b ── the line the waiter says over the promoted dishes.
  // Two problems with the stock copy: it was Bon Bon's ("our sweet favourites 🍨"), ice-cream
  // emoji and all, on the burger and ramen stalls; and "favourites" doesn't tell a guest that
  // these are the ones the stall is actually pushing today. Both now say specials, in that
  // stall's emoji — the greeting grid and the "Today's specials" chip land on the same idea.
  s = s.replace(/const FRESH=\{[\s\S]*?\};/,
    `const FRESH={en:"These are today's specials ${sk.emoji}\u{1F447}"};`);
  s = replaceFn(s, "showSpecials",
    'function showSpecials(quiet){FILTER="";LASTCAT=-1;const best=topDishes();if(!quiet)me("Today\'s picks");\n' +
    ` odyga("view_promotion",{promotion_name:"Today's specials"});\n bot(\`Here are today's specials ${sk.emoji}\u{1F447}\`);anchorGrid(renderGrid(best),mainChips);}`);

  // 7a ── let the greeting scroll.
  // showGreeting sets window.__bbHold=true and the chatbot only clears it on a real
  // pointer or key event, so toBottom() did nothing for the greeting's own grid — the
  // first set of dishes never scrolled into view, and it only started working after the
  // guest tapped something. Release the hold at the end and anchor to that grid.
  const GREET_TAIL = " if(!instant)await sleep(200);mainChips();}";
  if (!s.includes(GREET_TAIL)) throw new Error("greeting tail not found");
  s = s.replace(GREET_TAIL,
    " if(!instant)await sleep(200);mainChips();window.__bbHold=false;window.__userScroll=false;" +
    "_bigTarget=chat.firstElementChild||g;toBottom();}");

  // 7a0 ── how far the logo header is allowed to collapse.
  // Stock behaviour is binary: the header is either full height or yanked entirely off
  // screen, and it only ever collapses once window.__started is true — i.e. after the
  // guest taps something. So on the greeting it stayed at full height, the chat scrolled
  // underneath it, and the first bubble came out sliced across the middle.
  // Now it is proportional: on the opening response it slides up 45%, so the logo is
  // partly tucked away but still clearly there and nothing is cut; from the guest's first
  // tap onward it collapses the whole way and the chat gets the full screen.
  {
    const OLD = 'wd.style.marginTop = v ? (-wd.offsetHeight)+"px" : "";';
    if (!s.includes(OLD)) throw new Error("header collapse not found");
    // Always "": the logo bar never collapses, slides or half-hides. It is a short
    // strip pinned to the top and the chat scrolls beneath it — no moving black band,
    // and nothing left for the scroll listener to fight with.
    s = s.replace(OLD, 'wd.style.marginTop = "";');
    // Let it start collapsing during the greeting, not only after the first tap — and give
    // it hysteresis. With one threshold the collapse re-triggers its own test: collapsing
    // shifts the content up, that fires a scroll event, scrollTop drops back under the line,
    // it expands, everything shifts down again. That loop is the up-and-down judder you get
    // the moment you scroll by hand. Two thresholds break it.
    const OLD2 = 'var show = (!window.__started) || ce.scrollTop<=6;';
    if (!s.includes(OLD2)) throw new Error("header show test not found");
    s = s.replace(OLD2, 'var show = col ? (ce.scrollTop<=8) : (ce.scrollTop<=44);');

    // And once the guest scrolls for themselves, stop auto-scrolling entirely. Auto-scroll
    // exists to place NEW content after a tap; it has no business moving the view while
    // someone is reading. anchorGrid clears the flag, so the next tap scrolls normally.
    const OLD3 = 'ce.addEventListener("scroll",update,{passive:true});';
    if (!s.includes(OLD3)) throw new Error("chat scroll listener not found");
    s = s.replace(OLD3, OLD3 +
      'ce.addEventListener("touchmove",function(){window.__userScroll=true;},{passive:true});' +
      'ce.addEventListener("wheel",function(){window.__userScroll=true;},{passive:true});');
  }

  // 7a1 ── gentle, boundary-aware auto-scroll.
  // The old target was grid.offsetTop-82, an arbitrary offset that regularly landed
  // half-way through the bot line above the grid. Against a black page a half-cut bubble
  // reads as the logo header covering it. Two changes: anchor on the MESSAGE that
  // introduces the grid, not the grid, so a whole element sits at the top edge; and clamp
  // to the real maximum scroll, so it never scrolls further than there is content — which
  // is what leaves the chips at the bottom on screen.
  s = replaceFn(s, "toBottom",
    'function toBottom(){if(window.__bbHold||window.__userScroll)return;clearTimeout(_bt);_bt=setTimeout(function(){\n' +
    '  var max=Math.max(0,chat.scrollHeight-chat.clientHeight);\n' +
    '  var top=_bigTarget?Math.min(max,Math.max(0,_bigTarget.offsetTop-14)):chat.scrollHeight;\n' +
    '  _bigTarget=null;\n' +
    '  try{bbScrollTo(chat,top,650);}catch(e){chat.scrollTop=top;}\n' +
    '},80);}');

  // `s` here is the generated page, so match the emitted JS, not this file's own source.
  const AG_OLD = "function anchorGrid(g,after){window.__userScroll=false;(after||exploreBar)();_bigTarget=g;toBottom();}";
  if (!s.includes(AG_OLD)) throw new Error("anchorGrid not found in the generated page");
  s = s.replace(AG_OLD,
    "function anchorGrid(g,after){window.__userScroll=false;(after||exploreBar)();" +
      "var p=g.previousElementSibling;" +
      "_bigTarget=(p&&/msg/.test(p.className))?p:g;toBottom();}");

  // 7a2 ── one typing animation per line, and the grid lands whole.
  // showGreeting used to raise its own typingBubble() and then call bot(), which raises a
  // second set of dots — so every line flickered dots, dots, text. bot() is now the only
  // thing that shows typing. The favourites grid was also being built card by card at
  // 260ms a piece, which read as the whole thing typing itself out; it is one insert now.
  {
    const reps = [
      ["if(!instant){let t=pre||typingBubble();await sleep(pre?300:500);t.remove();pre=null;}else if(pre){pre.remove();pre=null;}",
       "if(pre){pre.remove();pre=null;}"],
      ["if(!instant){await sleep(450);let t=typingBubble();await sleep(600);t.remove();}",
       "if(!instant)await sleep(260);"],
      ["if(!instant)await sleep(300);\n const best=topDishes();const g=block(\"grid\",\"\");\n" +
       " for(const id of best){g.insertAdjacentHTML(\"beforeend\",dishCard(id));toBottom();if(!instant)await sleep(260);}",
       "if(!instant)await sleep(300);\n const best=topDishes();const g=block(\"grid\",best.map(dishCard).join(\"\"));"],
      // Wait for the line to actually LAND before the dishes appear. bot() shows dots for
      // 560ms and only then writes the text, so any fixed sleep was racing it — awaiting
      // bot's own onDone makes the order exact: dots, then the bubble, then the grid.
      ['bot(GREET[lang].replace("%t",part()).replace("%o",outlet||""));',
       'await new Promise(function(r){bot(GREET[lang].replace("%t",part()).replace("%o",outlet||""),r);});'],
      ["bot(FRESH[lang]);",
       "await new Promise(function(r){bot(FRESH[lang],r);});"],
    ];
    for (const [from, to] of reps) {
      if (!s.includes(from)) throw new Error("greeting shape changed: " + from.slice(0, 46));
      s = s.replace(from, to);
    }
  }

  // 7 ── the opening line
  s = s.replace(/const GREET=\{[\s\S]*?\};/, `const GREET={en:${JSON.stringify(sk.greet)}};`);

  // 9 ── browse-only chip rows.
  // The stock rows offer "Find what's for me", which runs the AI chat flow and whose
  // "Chat with me" branch calls inp.focus() on the input we removed, and "Give feedback",
  // which opens a form to type in. Both are dead ends on a stall page. These stalls are
  // button-only, so the rows keep just the two that browse: full menu and today's picks.
  s = replaceFn(s, "mainChips",
    'function mainChips(){block("chips",`<button class="chip go" onclick="explore()">${IC.menu}${lbl("exploreFull")}</button>' +
    '<button class="chip alt" onclick="showAll()">${IC.menu}View full menu</button>`+newChip()+`' +
    '<button class="chip alt" onclick="showSpecials()">${IC.star}${lbl("specialsLong")}</button>`+filterChips());}');
  s = replaceFn(s, "exploreBar",
    'function exploreBar(){block("chips",`<button class="chip go" onclick="explore()">${IC.menu}${lbl("exploreMore")}</button>' +
    '<button class="chip alt" onclick="showAll()">${IC.menu}View full menu</button>`+newChip()+`' +
    '<button class="chip alt" onclick="showSpecials()">${IC.star}${lbl("specials")}</button>`+filterChips());}');

  // 7b2 ── the shutter reveal, back by request.
  // showShutter (patched further up) anchors it to the board's bottom edge, so it covers
  // only the chat: the logo is on show from the first frame and the shutter rolls up off
  // it. bbBoot keeps its original timing; the veil it lifts is black now, not white, so
  // there is no flash of white before the stall appears.

  // 7c ── THE DARK LOOK.
  // Everything the shop-front theatre added — board art, awning, page texture, the shutter
  // reveal — is gone. What's left is the intro's own black, the stall logo with a slow
  // breathing glow, and the chat. This block is pushed last so it beats the stock rules
  // without needing !important on every line.
  const ACC = sk.accentDark;
  const RGB = ACC.replace("#","").match(/../g).map((h) => parseInt(h, 16)).join(",");
  extra.push(
    "#phone{background:#000;background-image:none}",
    "#chat{background:transparent;padding-top:12px}",

    // the header is now just the logo, lit from behind
    // The logo bar at its original size, and nailed down: fixed height, no transition,
    // and (with the collapse gone) no margin ever applied to it. It behaves like a
    // picture placed on the page — the chat scrolls underneath, it does not move.
    "header.woodhdr{background:#000;box-shadow:none;border:0;min-height:190px;" +
      "padding:26px 12px 20px;position:relative;overflow:visible;transition:none;flex:none}",
    `header.woodhdr:before{content:"";position:absolute;left:50%;top:52%;width:500px;height:330px;` +
      `transform:translate(-50%,-50%);pointer-events:none;z-index:0;` +
      `background:radial-gradient(circle,${ACC}26,transparent 64%);animation:odyglow 6.4s ease-in-out infinite}`,
    "@keyframes odyglow{0%,100%{opacity:.3;transform:translate(-50%,-50%) scale(.94)}" +
      "50%{opacity:.6;transform:translate(-50%,-50%) scale(1.06)}}",
    // The mark's own breathing light. This is the stock hglow at about half strength —
    // hglow peaks at .75/.45 white, which blew out against pure black.
    "@keyframes odymark{0%,100%{filter:drop-shadow(0 0 5px rgba(255,255,255,.26))" +
      " drop-shadow(0 0 14px rgba(255,255,255,.15)) drop-shadow(0 3px 5px rgba(0,0,0,.45))}" +
      "50%{filter:drop-shadow(0 0 7px rgba(255,255,255,.38))" +
      " drop-shadow(0 0 20px rgba(255,255,255,.22)) drop-shadow(0 3px 5px rgba(0,0,0,.45))}}",
    ".woodhdr .woodlogo{position:relative;z-index:2;width:72%;max-width:300px;" +
      "animation:odymark 4s ease-in-out infinite}",
    "#bootveil{background:#000}",
    "#shutterframe{top:0;z-index:6}",

    // ── feedback sheet ──
    // The stock sheet is cream with a gold circle pattern baked into the background
    // shorthand — on a black stall page it landed as a white slab, and white-on-cream text
    // vanished. Overriding `background` (not background-color) drops the pattern with it.
    ".sheet{background:rgba(18,18,20,.82);background-image:none;" +
      "-webkit-backdrop-filter:blur(22px) saturate(1.2);backdrop-filter:blur(22px) saturate(1.2);" +
      "border:1px solid rgba(255,255,255,.08);border-bottom:0;color:var(--ink)}",
    "#modal{background:rgba(0,0,0,.55)}",
    ".sheet h2{color:var(--ink)}",
    ".fbh{font-size:17px;font-weight:800;color:var(--ink);margin:2px 0 14px}",
    ".fbrow{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 12px;" +
      "font-size:14px;font-weight:600;color:var(--ink)}",
    ".odystars{display:flex;gap:4px}",
    // grey until chosen, brand colour once lit — the tap target stays 34px either way
    ".fbst{width:34px;height:34px;border:0;background:none;font-size:23px;line-height:1;padding:0;" +
      "color:#3a3a3a;cursor:pointer;transition:color .15s ease,transform .15s ease}",
    `.fbst.on{color:${ACC}}`,
    ".fbst:active{transform:scale(.88)}",
    ".fbtxt{width:100%;box-sizing:border-box;background:rgba(0,0,0,.42);border:1px solid rgba(255,255,255,.14);border-radius:12px;" +
      "color:var(--ink);font:inherit;font-size:14px;padding:10px 12px;resize:none;margin:2px 0 8px}",
    `.fbtxt:focus{outline:none;border-color:${ACC}}`,
    ".fbtxt::placeholder{color:#6c6c6c}",
    ".fbmsg{min-height:16px;font-size:12.5px;color:#c98a8a;margin:0 0 8px}",
    ".fbbtn{width:100%;justify-content:center;margin:0 0 8px}",
    ".sheet .chip.alt{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.14)}",
    ".fbbtn:disabled{opacity:.4;cursor:default}",
    ".fbthx{font-size:14px;color:var(--mut);margin:0 0 16px}",

    // dark surfaces
    ".bot{background:#161616;border:1px solid #242424;color:var(--ink)}",
    ".dish.simple{background:#161616;border:1px solid #242424}",
    ".vegdot{background:#161616}",
    ".lbcard{background:#141414}",
    `.lbcard .meta,.lbcard .lbdesc{color:#a6a6a6}`,

    // colour lives only in the bubbles, the toggles and the type
    `.me{background:var(--blue);color:#fff}`,
    `.dish .pr,.pr,.lbpr{color:${ACC}}`,
    `.chip{background:#181818;border:1.3px solid ${ACC};color:${ACC}}`,
    ".chip.alt{background:#151515;border-color:#333;color:#d2d2d2}",
    // The active chip: a muted wash of the accent rather than a solid slab of it. The stock
    // rule fills it with a brandtop->brandbot gradient AND a coloured drop shadow, and
    // .chip.go::after sweeps a white gradient across it every 5.5s — that sweep is the
    // "glow". All three are switched off here; only the tint and a hairline remain.
    `.chip.go{background:rgba(${RGB},.20);color:#fff;border-color:rgba(${RGB},.62);box-shadow:none}`,
    ".chip.go::after{display:none;animation:none}",
    ".chip:hover,.chip.go:hover{box-shadow:none}",
    `.infob{background:#181818;border:1.3px solid #2c2c2c;color:${ACC}}`,
    `.typing .dot{background:${ACC}}`,
    `.tag{color:${ACC}}`,
    // barely-there depth: on black the fill and the hairline do the separating
    ".bot,.dish.simple{box-shadow:0 1px 2px rgba(0,0,0,.45)}",
    ".chip{box-shadow:none}",
    ".lbcard{box-shadow:0 10px 40px rgba(0,0,0,.75)}"
  );

  // 7g ── the logo scrolls WITH the chat, like a picture placed in a page.
  //
  // Stock, header.woodhdr is a flex sibling of #chat, so it is welded to the top of the
  // viewport forever and the messages slide underneath it. Moving it INSIDE #chat makes
  // it the first thing in the scrolling column: it is there when the menu opens, it
  // scrolls up and off as you read, and it comes back when you scroll to the top. Same
  // size, same glow, no collapse, no sticky.
  //
  // It has to be moved at runtime rather than written into the markup, because
  // chooseOutlet does chat.innerHTML="" on the deferred path — a static child would be
  // wiped out right before the greeting. So: a mover defined the moment #chat is parsed,
  // called immediately and again after every clear.
  {
    const CHATDIV = '<div id="chat"></div>';
    if (!s.includes(CHATDIV)) throw new Error("#chat div not found");
    s = s.replace(CHATDIV, CHATDIV +
      // h is captured ONCE, here, while the header is still in the markup. innerHTML=""
      // detaches it but does not destroy it, so the same node goes straight back in —
      // re-querying after the clear would find nothing.
      '<script>(function(){var c=document.getElementById("chat"),' +
      'h=document.querySelector("header.woodhdr");' +
      'window.__mountLogo=function(){if(h&&c&&c.firstChild!==h)c.insertBefore(h,c.firstChild);};' +
      'window.__mountLogo();})();</script>');

    const CLEAR = 'chat.innerHTML="";';
    if (!s.includes(CLEAR)) throw new Error("chat clear not found");
    s = s.split(CLEAR).join(CLEAR + 'window.__mountLogo&&window.__mountLogo();');

    // #chat pads 14px/9px; the logo strip is cancelled out of that so it runs edge to edge
    // exactly as it did when it was its own bar.
    extra.push(
      "#chat{padding-top:0}",
      "#chat>header.woodhdr{flex:none;margin:0 -9px 8px}"
    );
  }

  // 8 ── every per-stall override lands here, at the very end of the stylesheet.
  // #bar needs !important: bbBoot and chooseOutlet both put the bar back by setting
  // element styles (display:"" / visibility:"") as the shutter lifts.
  extra.push("#bar{display:none!important}");
  s = s.replace(/<\/style>/, "\n  /* ---- fest stall overrides ---- */\n  " + extra.join("\n  ") + "\n  </style>");

  const out = path.join(ROOT, "public", "fest", sk.file, "index.html");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, s);
  const items = stall.cats.reduce((n, c) => n + c.items.length, 0);
  console.log(`WROTE public/fest/${sk.file}/index.html — ${items} items, ${stall.cats.length} categories`);
  return s;
}

const stalls = readFestMenu();
for (const k of Object.keys(SKIN)) build(k, stalls);
