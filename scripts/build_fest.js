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
    vars: { blue: "#811226", ink: "#2a1212", mut: "#9a8585", line: "#ecdcdc", cream: "#f2e0de",
            gold: "#811226", card: "#fffdfc", brandtop: "#811226", brandbot: "#5a0c1a" },
    wood: "/wood_web.jpg", awning: "/awning_web.png", shutter: "/shutter_web.jpg", logo: "/logo_web.png",
    greet: "Hi! 🍦 Welcome to Bon Bon Ice Creams — what are you craving today?", emoji: "🍨",
    // The dishes the stall pushes: they fill the opening "our favourites" grid and
    // "Today's picks". topDishes() prefers anything flagged promoted over its own guess.
    promote: ["bb_lotus", "bb_caramel", "bb_bub_cookie", "bb_spanish"],
    filters: ["best", "must"],   // every Bon Bon item is veg, so no diet filter
    hasAwning: true,
  },
  kimchi: {
    file: "kimchi", title: "Kim Chi & Ramen — Menu",
    vars: { blue: "#c8141e", ink: "#1a1412", mut: "#8e8285", line: "#e8b4b4", cream: "#2b2427",
            gold: "#c8141e", card: "#ffffff", brandtop: "#d8323c", brandbot: "#96101c" },
    wood: "/fest/kimchi_board.png", awning: "/fest/kimchi_awning.png",
    shutter: "/kimchi_new_shutter.png", logo: "/fest/logo_kimchi.png",
    greet: "Hi! 🍜 Welcome to Kim Chi & Ramen — what are you craving today?", emoji: "🍜",
    promote: ["kr_s_kwingst", "kr_mc_cramen", "kr_m_cmongol", "kr_mc_svramen"],
    // Kim Chi is the only stall with new dishes on it — the whole Mongolian line.
    filters: ["veg", "nonveg", "best", "must", "neu"],
    // Wooden planks behind the chat, running VERTICALLY — /fest/wood_vertical.jpg is
    // wood_web.jpg rotated 90°, since the stock texture's planks lie flat. Sized to cover
    // the phone so it never tiles, which would put a seam straight across the grain.
    // --cream stays as the colour behind it, and the glows invert to white to suit it.
    pageBg: "linear-gradient(rgba(0,0,0,.34),rgba(0,0,0,.34)),url('/fest/wood_vertical.jpg')",
    accentRgb: "255,255,255",
    // its own board art is white — the stock dark scrim is what was turning it grey.
    // No awning here either, so the board needs its own height, as D'VOUR's does.
    board: "header.woodhdr{background:#fff url('/fest/kimchi_board.png') center/cover;" +
           "box-shadow:inset 0 -8px 16px rgba(0,0,0,.10);min-height:196px;padding:16px 12px 22px;position:relative}",
    hasAwning: false, lanterns: true,
  },
  dvour: {
    file: "dvour", title: "D'VOUR — Menu",
    vars: { blue: "#a87c00", ink: "#16151a", mut: "#8b8a92", line: "#e8e8ec", cream: "#eeeef0",
            gold: "#ffc400", card: "#ffffff", brandtop: "#1d1d1f", brandbot: "#050505" },
    wood: "", awning: "", shutter: "/fest/dvour_shutter.png", logo: "/fest/logo_dvour.png",
    greet: "Hi! 🍔 Welcome to D'VOUR — what are you craving today?", emoji: "🍔",
    // Chicken versions where the dish comes both ways: Signature ₹290, Mexican Rice ₹220,
    // Seoul Street Wrap ₹230. Green Flag Burger only exists the one way.
    promote: ["dv_b_green", "dv_b_csig", "dv_x_ricec", "dv_w_seoc"],
    filters: ["veg", "nonveg", "best", "must"],
    accentRgb: "0,0,0",
    // Flat black board, yellow rule along the bottom, no image and no awning at all.
    // The other two stalls read as a tall header because the board (~145px) has an awning
    // hanging under it — 105-125px of art less its -42px pull, so ~63-83px more. With no
    // awning D'VOUR looked half the height, so the board itself carries it: 210px.
    board: "header.woodhdr{background:#0b0b0c;border-bottom:3px solid #ffc400;box-shadow:none;" +
           "min-height:210px;padding:20px 12px 26px}" +
           "\n  .woodhdr .woodlogo{width:68%;max-width:296px}",
    // The boot splash is white by default, and the D'VOUR logo is white — invisible.
    bootveil: "#0b0b0c",
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

  // 4j ── the shutter must reveal the CHAT only, leaving the board on show.
  // showShutter anchors the shutter's top to the awning — but Kim Chi and D'VOUR have no
  // awning, and a display:none element reports top 0, so the shutter covered the whole
  // screen and the board was hidden until it rolled up. Fall back to the board's bottom.
  s = replaceFn(s, "showShutter",
    'function showShutter(){ if(!frame)return;\n' +
    '    var aw=document.querySelector(".awnbar"),hd=document.querySelector("header.woodhdr"),ph=document.getElementById("phone");\n' +
    '    var ref=(aw&&aw.offsetParent!==null)?aw.getBoundingClientRect().top:(hd?hd.getBoundingClientRect().bottom:0);\n' +
    '    if(ph)frame.style.top=Math.max(0,ref-ph.getBoundingClientRect().top)+"px";\n' +
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
    const chips = (sk.filters || []).map((f) => {
      const [kind, val, icon, label] = {
        veg:    ["diet", 1, "", "Veg only"],
        nonveg: ["diet", 2, "", "Non-veg only"],
        best:   ["tag", "BESTSELLER", "\\u2605", "Bestsellers"],
        must:   ["tag", "MUST TRY", "\\u2726", "Must try"],
        neu:    ["tag", "NEW", "\\u2726", "New"],
      }[f];
      const on = kind === "diet" ? `FDIET===${val}` : `FTAG===${JSON.stringify(val)}`;
      const arg = kind === "diet" ? val : `&quot;${val}&quot;`;
      const fn = kind === "diet" ? `setDiet(${val})` : `setTag(${arg})`;
      return `'<button class="chip '+(${on}?'go':'alt')+'" onclick="${fn}">${(icon+" "+label).trim()}</button>'`;
    });
    if (!chips.length) chips.push("''");

    s = s.replace(
      "const avail=id=>!TIME_FILTER||!OPEN||(HOUR>=MENU[id].h[0]&&HOUR<MENU[id].h[1]);",
      "var FDIET=0,FTAG=\"\",LASTCAT=-1;\n" +
      "function hasTag(id,t){return (MENU[id].tagtxt||\"\").split(\",\").indexOf(t)>=0;}\n" +
      "function anchorGrid(g){exploreBar();_bigTarget=g;toBottom();}\n" +
      "function filterChips(){return " + chips.join("+") + ";}\n" +
      "function setDiet(v){FDIET=(FDIET===v?0:v);odyga('filter_click',{filter:v===1?'veg':'non-veg',active:FDIET===v});refilter();}\n" +
      "function setTag(t){FTAG=(FTAG===t?\"\":t);odyga('filter_click',{filter:t,active:FTAG===t});refilter();}\n" +
      "function filterLabel(){var p=[];if(FDIET===1)p.push('Veg');if(FDIET===2)p.push('Non-veg');\n" +
      " if(FTAG)p.push(FTAG==='BESTSELLER'?'Bestsellers':FTAG==='NEW'?'New':'Must try');\n" +
      " return p.join(' \\u00b7 ');}\n" +
      "function showFiltered(){var ids=Object.keys(MENU).filter(avail);\n" +
      " if(!ids.length){bot('Nothing on the menu matches that.');block('chips',filterChips());return;}\n" +
      " bot('<b>'+filterLabel()+'</b>:');anchorGrid(renderGrid(ids));}\n" +
      "function refilter(){if(FDIET||FTAG){LASTCAT=-1;showFiltered();}else if(LASTCAT>=0)openCat(LASTCAT);else showCats();}\n" +
      "const avail=id=>(FDIET!==1||!MENU[id].nv)&&(FDIET!==2||!!MENU[id].nv)" +
        "&&(!FTAG||hasTag(id,FTAG))" +
        "&&(!TIME_FILTER||!OPEN||(HOUR>=MENU[id].h[0]&&HOUR<MENU[id].h[1]));"
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
    ' block("grid",[dishCard(id)]);exploreBar();}');

  // 5b ── categories exactly as Sree Annapoorna does them: a wrapping row of chips.
  // No photo, which also kills the bug where Bon Bon's ice-cream shot was the fallback
  // image for every Kim Chi and D'VOUR category.
  s = replaceFn(s, "explore",
    'function showCats(){const cs=CATS.filter(c=>(c.ids||(c.subs||[]).flatMap(s=>s.ids)).some(avail));\n' +
    ' if(!cs.length){bot("Nothing veg on this menu just now.");block("chips",filterChips());return;}\n' +
    ' bot(`${T("whatExplore")}`);\n' +
    ' block("chips",cs.map((c)=>`<button class="chip" onclick="openCat(${CATS.indexOf(c)})">${cn(c.name)}</button>`).join("")' +
    '+filterChips()+`<button class="chip alt" onclick="mainChips()">${IC.home}${lbl("home")}</button>`);}\n' +
    'function explore(){me(T("exploreMore"));odyga("view_full_menu");showCats();}');
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
    'function showSpecials(quiet){const best=topDishes();if(!quiet)me("Today\'s picks");\n' +
    ` odyga("view_promotion",{promotion_name:"Today's specials"});\n bot(\`Here are today's specials ${sk.emoji}\u{1F447}\`);renderGrid(best);mainChips();}`);

  // 7 ── the opening line
  s = s.replace(/const GREET=\{[\s\S]*?\};/, `const GREET={en:${JSON.stringify(sk.greet)}};`);

  // 9 ── browse-only chip rows.
  // The stock rows offer "Find what's for me", which runs the AI chat flow and whose
  // "Chat with me" branch calls inp.focus() on the input we removed, and "Give feedback",
  // which opens a form to type in. Both are dead ends on a stall page. These stalls are
  // button-only, so the rows keep just the two that browse: full menu and today's picks.
  s = replaceFn(s, "mainChips",
    'function mainChips(){block("chips",`<button class="chip go" onclick="explore()">${IC.menu}${lbl("exploreFull")}</button>' +
    '<button class="chip alt" onclick="showSpecials()">${IC.star}${lbl("specialsLong")}</button>`+filterChips());}');
  s = replaceFn(s, "exploreBar",
    'function exploreBar(){block("chips",`<button class="chip go" onclick="explore()">${IC.menu}${lbl("exploreMore")}</button>' +
    '<button class="chip alt" onclick="showSpecials()">${IC.star}${lbl("specials")}</button>`+filterChips());}');

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
