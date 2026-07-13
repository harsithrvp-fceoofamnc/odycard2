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
      MENU[it.key]={n:it.name,p:it.price,e:"\\uD83C\\uDF68",h:[[8,23]],q:it.q||"",pt:it.pt||0,ph:it.ph||"",d:it.desc||"",veg:1};
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

// ---- NEW wooden-shopfront header (Bon Bon only) : wood bg + centred logo (neon glow) +
//      glass globe language dropdown + scalloped awning. Everything BELOW the awning is untouched.
h = h.replace(
  '<header><button id="back" class="hback" onclick="goOutlets()" title="Change outlet">←</button><div class="logo">A</div><div><h1 id="hname">Sree Annapoorna</h1><div class="sub" id="hsub">Choose your outlet — AI Waiter by Odysra</div></div></header>',
  '<header class="woodhdr"><button id="back"></button><h1 id="hname"></h1><div id="hsub"></div><img class="woodlogo" src="/logo_web.png" alt="Bon Bon"><button class="langtoggle" onclick="toggleLang()" aria-label="Language"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.3"/><path d="M2.7 12h18.6"/><path d="M12 2.7a14 14 0 0 1 3.7 9.3 14 14 0 0 1-3.7 9.3 14 14 0 0 1-3.7-9.3A14 14 0 0 1 12 2.7Z"/></svg></button></header>\n  <div class="awnbar"><img src="/awning_web.png?v=3" alt=""></div>'
);
// header styles (appended so they override the base header/langbar rules)
h = h.replace('</style>', `
  header.woodhdr{background:linear-gradient(rgba(0,0,0,.30),rgba(0,0,0,.30)),url('/wood_web.jpg') center/cover;padding:12px 12px 20px;min-height:118px;display:flex;align-items:center;justify-content:center;gap:0;border-bottom:0;box-shadow:inset 0 -10px 20px rgba(0,0,0,.38);overflow:visible}
  .woodhdr #back,.woodhdr #hname,.woodhdr #hsub{display:none}
  .woodhdr .woodlogo{width:60%;max-width:258px;display:block;filter:drop-shadow(0 2px 4px rgba(0,0,0,.4))}
  header.woodhdr::after{display:none!important;content:none!important}
  @keyframes hglow{0%,100%{filter:drop-shadow(0 0 3px rgba(255,255,255,.28)) drop-shadow(0 0 9px rgba(255,225,235,.12)) drop-shadow(0 3px 5px rgba(0,0,0,.45))}50%{filter:drop-shadow(0 0 6px rgba(255,255,255,.45)) drop-shadow(0 0 15px rgba(255,205,225,.22)) drop-shadow(0 3px 5px rgba(0,0,0,.45))}}
  .woodhdr .langtoggle{position:absolute;right:12px;top:12px;width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.15);-webkit-backdrop-filter:blur(10px) saturate(1.3);backdrop-filter:blur(10px) saturate(1.3);color:#fff;border:1px solid rgba(255,255,255,.42);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.3)}
  .woodhdr .langtoggle svg{width:20px;height:20px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
  .awnbar{position:relative;z-index:3;width:130%;margin:-3px 0 -42px -15%;line-height:0;pointer-events:none}
  .awnbar img{width:100%;display:block}
  /* pull the chat up behind the awning so dish cards show through the see-through scallop gaps */
  #chat{padding-top:52px}
  #wm{top:54%}
  #wm img{width:440px;max-width:94%}
  #langbar{position:absolute;top:54px;right:10px;z-index:30;display:none;flex-direction:column;gap:3px;padding:6px;background:#fff;border-radius:12px;box-shadow:0 10px 26px rgba(0,0,0,.28);min-width:134px;border:1px solid var(--line)}
  #langbar.open{display:flex}
  #langbar .lang{flex:0 0 auto;font-size:14px;color:var(--ink);background:transparent;border:0;padding:8px 12px;border-radius:8px;cursor:pointer;text-align:left;width:100%}
  #langbar .lang:hover{background:#f3e7e6}
  #langbar .lang.on{background:var(--blue);color:#fff;font-weight:700}
  /* boot screen: plain white; the Bon Bon logo fades in, then fades out just before the screen lifts (Apple-style) */
  #bootveil{position:absolute;inset:0;z-index:50;background:#fff;transition:opacity 1.1s ease;opacity:1}
  #bootveil.gone{opacity:0;pointer-events:none}
  #bootveil .bootlogo{position:absolute;left:50%;top:48%;width:360px;max-width:88%;height:auto;transform:translate(-50%,-50%);animation:bootlogoin 1.4s ease both}
  @keyframes bootlogoin{from{opacity:0;transform:translate(-50%,-50%) scale(.94)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
</style>`);
// header interactions: globe toggles the language dropdown; picking a language closes it.
// Defined inside the main script (via the /* init */ anchor) so we never inject a stray
// </script>/</body> that could collide with the receipt-HTML string elsewhere in the file.
h = h.replace('/* init */', `function toggleLang(){var e=document.getElementById("langbar");if(e)e.classList.toggle("open");}
function closeLang(){var e=document.getElementById("langbar");if(e)e.classList.remove("open");}
document.addEventListener("click",function(ev){var lb=document.getElementById("langbar"),tg=document.querySelector(".langtoggle");if(lb&&lb.classList.contains("open")&&!lb.contains(ev.target)&&(!tg||!tg.contains(ev.target)))lb.classList.remove("open");});
// boot: the white screen + logo fade-in happen instantly via CSS (see #bootveil .bootlogo).
// Here we just wait for the header assets, then fade the whole white screen out (logo fades
// with it = fade-out at exit), and only THEN play the welcome greeting.
function bbBoot(){
  var veil=document.getElementById("bootveil");
  var frame=document.getElementById("shutterframe");
  var sh=document.getElementById("shutter");
  var start=Date.now(),MIN=1900,done=false;   // hold long enough for the slow fade-in + a beat
  var imgs=["/wood_web.jpg","/logo_web.png","/awning_web.png?v=3","/shutter_web.jpg"],left=imgs.length;
  function showShutter(){ if(!frame)return;
    var aw=document.querySelector(".awnbar"),ph=document.getElementById("phone");
    if(aw&&ph)frame.style.top=Math.max(0,(aw.getBoundingClientRect().bottom-ph.getBoundingClientRect().top)-1)+"px";
    frame.classList.add("on");                                                // closed shutter over the chat
  }
  function finish(){ if(done)return; done=true;
    showShutter();                                                            // put the shutter up (still hidden behind the white veil)
    if(veil)veil.classList.add("gone");                                       // lift the white boot screen -> shutter revealed
    setTimeout(function(){ if(veil&&veil.parentNode)veil.parentNode.removeChild(veil); }, 1160);
    setTimeout(function(){ if(sh)sh.classList.add("up"); }, 1520);            // roll the shutter straight up
    setTimeout(function(){ if(frame&&frame.parentNode)frame.parentNode.removeChild(frame); showGreeting(); }, 2780); // chat revealed -> welcome
  }
  function ready(){ setTimeout(finish, Math.max(0, MIN-(Date.now()-start))); }
  imgs.forEach(function(src){ var im=new Image(); im.onload=im.onerror=function(){ if(--left<=0)ready(); }; im.src=src; });
  setTimeout(function(){ if(!done)ready(); }, 3600);
}
/* init */`);
// boot veil markup: first child of the phone so it covers everything while loading
h = h.replace('<div id="phone">', '<div id="phone"><div id="bootveil"><img class="bootlogo" src="/logo_web.png" alt="Bon Bon"></div>');
// shutter over the chat area (rolls up after the boot screen lifts)
h = h.replace('<div id="wm"></div>', '<div id="shutterframe"><div id="shutter"></div></div><div id="wm"></div>');
// shutter styles
h = h.replace('</style>', `
  #shutterframe{position:absolute;left:0;right:0;bottom:0;top:150px;z-index:6;overflow:hidden;display:none}
  #shutterframe.on{display:block}
  #shutter{position:absolute;left:0;right:0;top:0;height:100%;background:#5a0c1a url('/shutter_web.jpg') center/cover no-repeat;box-shadow:0 7px 16px rgba(0,0,0,.30);transform:translateY(0);transition:transform 1.15s cubic-bezier(.5,.05,.2,1);will-change:transform}
  #shutter.up{transform:translateY(-100%)}
</style>`);
// watermark uses the SAME logo as the boot screen, so the boot logo appears to settle
// into the watermark when the white screen lifts.
h = h.replace(`document.getElementById("wm").innerHTML='<img src="'+LOGO+'">';`, `document.getElementById("wm").innerHTML='<img src="/logo_web.png">';`);
// defer the welcome greeting until the veil fades (bbBoot handles it)
h = h.replace(".catch(function(){}).then(function(){showGreeting();});", ".catch(function(){}).then(function(){bbBoot();});");
h = h.split("onclick=\"setLang('${l[0]}',this)\"").join("onclick=\"setLang('${l[0]}',this);closeLang()\"");

// ---- branding ----
h = h.replace(/const LOGO="data:image\/png;base64,[^"]*";/, 'const LOGO="/bon_bon_logo.png";');
h = h.replace('<div class="logo">A</div>', '<div class="logo"><img src="/bon_bon_logo.png" alt="Bon Bon" style="width:100%;height:100%;object-fit:cover;border-radius:9px;display:block"></div>');
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
// page frame behind the phone -> black (matches the staff dashboards' look on desktop)
h = h.replace("background:#0e1116;", "background:#000;");
// widen the phone a touch and make it FILL the screen height on desktop (no floating rounded card),
// so the chatbot looks like the mobile-column dashboards
h = h.replace("max-width:440px", "max-width:520px");
h = h.replace("body{padding:16px;box-sizing:border-box}", "body{padding:0}");
h = h.replace(
  "#phone{height:calc(100dvh - 32px);max-height:820px;border-radius:24px;box-shadow:0 18px 50px rgba(0,0,0,.45)}",
  "#phone{height:100dvh;box-shadow:0 0 44px rgba(0,0,0,.5)}"
);
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
// dark icon/text (#3a2a05) sits on gold in Annapoorna, but on MAROON in Bon Bon -> make it white
// (cart icon, "Checkout" button, primary .btn.g, taste-quiz buttons, etc.)
h = h.split("#3a2a05").join("#fff");

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

// ---- category picker as Swiggy-style image tiles (Bon Bon only) ----
h = h.replace('</style>', `
  .catgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:4px 0 2px}
  .catcard{display:flex;flex-direction:column;align-items:center;gap:7px;background:transparent;border:0;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
  .catpic{width:100%;height:165px;border-radius:14px;overflow:hidden;background:linear-gradient(135deg,#f7e8e7,#eed7d6);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(122,17,33,.16);transition:transform .15s ease}
  .catcard:active .catpic{transform:scale(.96)}
  .catpic img.ph{width:100%;height:100%;object-fit:cover;display:block}
  .catpic img.lg{width:56%;height:56%;object-fit:contain;opacity:.5}
  .catpic.lg2{font-size:40px}
  .catlabel{font-size:14px;font-weight:700;color:var(--ink);text-align:center;line-height:1.15}
</style>`);
// representative image for a category: first available dish photo, else the logo
h = h.replace('function explore(){', 'function catImg(c){var ids=(c.ids||(c.subs||[]).flatMap(function(s){return s.ids;})).filter(avail);for(var k=0;k<ids.length;k++){if(MENU[ids[k]]&&MENU[ids[k]].ph)return MENU[ids[k]].ph;}return "/cat_default.jpg";}\nfunction explore(){');
// swap the category text chips for Swiggy-style image tiles
h = h.replace(
  'block("chips",cs.map((c)=>`<button class="chip" onclick="openCat(${CATS.indexOf(c)})">${cn(c.name)}</button>`).join("")+`<button class="chip alt" onclick="mainChips()">${IC.home}${lbl("home")}</button>`);',
  'block("catgrid",cs.map((c)=>`<button class="catcard" onclick="openCat(${CATS.indexOf(c)})"><span class="catpic"><img class="${catImg(c)===LOGO?"lg":"ph"}" src="${catImg(c)}" loading="lazy" onerror="this.style.opacity=0"></span><span class="catlabel">${cn(c.name)}</span></button>`).join("")+`<button class="catcard" onclick="mainChips()"><span class="catpic lg2">🏠</span><span class="catlabel">${lbl("home")}</span></button>`);'
);

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
