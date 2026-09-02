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
    greet: "Hi! 🍦 Welcome to Bon Bon Ice Creams — what are you craving today?",
    hasAwning: true,
  },
  kimchi: {
    file: "kimchi", title: "Kim Chi & Ramen — Menu",
    vars: { blue: "#c8141e", ink: "#1a1412", mut: "#8e8285", line: "#f4dcde", cream: "#fdeff0",
            gold: "#c8141e", card: "#ffffff", brandtop: "#d8323c", brandbot: "#96101c" },
    wood: "/fest/kimchi_board.png", awning: "/fest/kimchi_awning.png",
    shutter: "/fest/kimchi_shutter.png", logo: "/fest/logo_kimchi.png",
    greet: "Hi! 🍜 Welcome to Kim Chi & Ramen — what are you craving today?",
    hasAwning: true, lanterns: "/fest/kimchi_lanterns.png",
  },
  dvour: {
    file: "dvour", title: "D'VOUR — Menu",
    vars: { blue: "#a87c00", ink: "#16151a", mut: "#8b8a92", line: "#e8e8ec", cream: "#f6f6f7",
            gold: "#ffc400", card: "#ffffff", brandtop: "#1d1d1f", brandbot: "#050505" },
    wood: "", awning: "", shutter: "/fest/dvour_shutter.png", logo: "/fest/logo_dvour.png",
    greet: "Hi! 🍔 Welcome to D'VOUR — what are you craving today?",
    hasAwning: false, blackBoard: true,
  },
};

/* ── turn a stall into the chatbot's MENU / CATS shapes ── */
function menuJs(stall) {
  const entries = [];
  for (const c of stall.cats) {
    const emoji = (c.label.match(/^\S+/) || ["🍽️"])[0];
    for (const it of c.items) {
      let o = `{n:${JSON.stringify(it.n)},p:${it.p},e:${JSON.stringify(emoji)},h:[[8,23]],q:"",pt:8,ph:"",d:${JSON.stringify(it.d)},veg:${it.veg ? 1 : 0}`;
      if (!it.veg) o += ",nv:1";
      if (it.tag) o += `,tagtxt:${JSON.stringify(it.tag)}`;
      if (it.off) o += ",off:1";
      o += "}";
      entries.push(` ${it.id}:${o}`);
    }
  }
  const cats = stall.cats.map((c) => ` {name:${JSON.stringify(c.label)},ids:${JSON.stringify(c.items.map((i) => i.id))}}`);
  return { menu: "const MENU={\n" + entries.join(",\n") + "\n};", cats: "const CATS=[\n" + cats.join(",\n") + "\n];" };
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
  const { menu, cats } = menuJs(stall);

  // 1 ── swap MENU and CATS
  let [a, b] = replaceBlock(s, "const MENU=", "{", "}");
  s = a + menu + b;
  [a, b] = replaceBlock(s, "const CATS=", "[", "]");
  s = a + cats + b;

  // 2 ── remove the ask bar entirely (textarea, mic, send, cart button)
  [a, b] = replaceBlock(s, '<div class="barwrap" id="bar">', "<", ">") // guard
    ? (() => {
        const st = s.indexOf('<div class="barwrap" id="bar">');
        // walk div nesting to find the matching close
        let depth = 0, i = st;
        const re = /<div\b|<\/div>/g;
        re.lastIndex = st;
        let m, end = -1;
        while ((m = re.exec(s))) {
          if (m[0] === "</div>") { depth--; if (depth === 0) { end = m.index + 6; break; } }
          else depth++;
        }
        return [s.slice(0, st), s.slice(end)];
      })()
    : [s, ""];
  s = a + b;

  // 3 ── no + Add anywhere: dish cards keep only the info button, pairings show the price
  s = s.replace(
    /function dishFooter\(id\)\{[\s\S]*?return `<button class="add"[\s\S]*?\}/,
    'function dishFooter(id){return `<button class="infob" onclick="explainDish(\'${id}\')" title="Tell me about this">${IC.info}</button>`;}'
  );
  s = s.replace(
    /function pairFoot\(id\)\{[\s\S]*?\}\n/,
    'function pairFoot(id){return `<span class="pr">₹${MENU[id].p}</span>`;}\n'
  );
  // and make sure nothing else can add to a cart
  s = s.replace(/function addDish\(id\)\{[\s\S]*?\n\}/, "function addDish(){}");

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

  // D'VOUR: flat black board with a yellow rule, and no awning hanging under it
  if (sk.blackBoard) {
    s = s.replace(/#board\{[^}]*\}/, "#board{background:#0e0e0e;border-bottom:3px solid #ffc400}");
    s = s.replace(/#awning\{[^}]*\}/, "#awning{display:none}");
  }
  if (sk.lanterns) {
    s = s.replace(/#board\{/, `#lanterns{position:absolute;top:0;left:0;width:100%;z-index:3;pointer-events:none}\n  #board{`);
    s = s.replace(/(<div id="board")/, `<img id="lanterns" src="${sk.lanterns}" alt="">$1`);
  }

  // 5 ── mascot face beside every waiter bubble
  s = s.replace(
    /\.bot\{align-self:flex-start;/,
    `.bot{align-self:flex-start;position:relative;margin-left:42px;`
  );
  s = s.replace(
    /(\.bot\{align-self:flex-start;[^}]*\})/,
    `$1\n  .bot:before{content:"";position:absolute;left:-42px;bottom:0;width:34px;height:34px;border-radius:50%;` +
      `background:#fff url('/fest/mascot_face.png') center 12% / 150% no-repeat;` +
      `border:1.5px solid var(--line);box-shadow:0 1px 4px rgba(0,0,0,.12)}`
  );

  // 6 ── no letter-by-letter typing: the whole line lands at once
  s = s.replace(
    /function bot\(html,onDone\)\{[\s\S]*?\n\}/,
    'function bot(html,onDone){\n' +
    '  var d=document.createElement("div");d.className="msg bot";chat.appendChild(d);\n' +
    '  var s=String(html==null?"":html);\n' +
    '  if(/<[a-z!\\/][\\s\\S]*>/i.test(s))d.innerHTML=s;else d.textContent=s;\n' +
    '  toBottom();if(onDone)onDone();return d;\n' +
    '}'
  );

  // 7 ── the opening line
  s = s.replace(/const GREET=\{[\s\S]*?\};/, `const GREET={en:${JSON.stringify(sk.greet)}};`);

  const out = path.join(ROOT, "public", "fest", sk.file, "index.html");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, s);
  const items = stall.cats.reduce((n, c) => n + c.items.length, 0);
  console.log(`WROTE public/fest/${sk.file}/index.html — ${items} items, ${stall.cats.length} categories`);
  return s;
}

const stalls = readFestMenu();
for (const k of Object.keys(SKIN)) build(k, stalls);
