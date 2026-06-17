const fs=require("fs");
const path=require("path");
const ROOT=path.resolve(__dirname,"..");
const TPL=path.join(ROOT,"annapoorna_chatbot_demo.html");
const OUTDIR=ROOT+path.sep;

// serving-time windows (24h, decimals ok). Arrays of [start,end].
const W={
 bfast:[[6,10.5],[18,22]], bonly:[[6,10.5]], dinner:[[18,22]],
 roast:[[6.5,22.5]], rava:[[6.75,22.5]], chap:[[11,22.5]], kothu:[[12,22.5]],
 snacks:[[11,12.5],[16,17.5]], lunch:[[10.5,15.5]], mealsR:[[12,15]], mealsS:[[12,15.5]], mealsE:[[11,15]],
 noonEve:[[12,15.5],[19,22.5]], specHyd:[[12,15.5]], roastVar:[[15,22]], specDosa:[[16,19]],
 hot:[[6,22.75]], juice:[[8,22.5]], shake:[[10,22.5]], dessert:[[10,22.5]]
};

// [id, name, price, winKey, emoji, flags]
const groups = {
 tiffin:[
  ["idli","Idly (2)",50,"bfast","🍥","best"],["idli1","Idly (1)",30,"bfast","🍥",""],
  ["sambaridli","Sambar Idly (2)",65,"bfast","🍥",""],["sambaridli1","Sambar Idly (1)",42,"bfast","🍥",""],
  ["vada","Vadai (1)",33,"bfast","🍩",""],["sambarvadai","Sambar Vadai (1)",44,"bfast","🍩",""],
  ["pongal","Pongal",80,"bfast","🥣","best"],["ravakitchadi","Veg Rava Kitchadi",75,"bfast","🥣",""],
  ["poori2","Poori w/ Potato Masal (2)",95,"bfast","🫓",""],["poori1","Poori w/ Potato Masal (1)",50,"bfast","🫓",""],
  ["idiyappam","Idiyappam w/ Coconut Milk & Stew",95,"bfast","🍝",""],["lemonsevai","Lemon Sevai",77,"bfast","🍝",""],
  ["gheeminiidli","Ghee Mini Idly in Sambar",105,"bfast","🍥",""],["wheatuppuma","Wheat Uppuma",75,"bonly","🥣",""],
  ["wheatuppumacurd","Wheat Uppuma with Curd",88,"bonly","🥣",""],["channabhatura","Channa Bhatura (Chola Poori)",130,"dinner","🫓",""]
 ],
 roast:[
  ["gheeroast","Ghee Roast",95,"roast","🫓","best"],["paperroast","Paper Roast",135,"roast","🫓",""],
  ["familyroast","Family Roast",500,"roast","🫓",""],["masalroast","Masal Roast (Potato Masal)",135,"roast","🫓","best"],
  ["gheemasalroast","Ghee Masal Roast (Potato Masal)",145,"roast","🫓",""],["buttermasalroast","Butter Masal Roast (Potato Masal)",140,"roast","🫓",""],
  ["onionroast","Onion Roast",125,"roast","🫓",""],["gheeonionroast","Ghee Onion Roast",135,"roast","🫓",""],["podiroast","Podi Roast",120,"roast","🫓",""]
 ],
 uthappam:[
  ["uthappam","Uthappam",95,"roast","🥞","best"],["gheeuthappam","Ghee Uthappam",130,"roast","🥞",""],
  ["onionuthappam","Onion Uthappam",125,"roast","🥞",""],["gheeonionuthappam","Ghee Onion Uthappam",135,"roast","🥞",""],
  ["podiuthappam","Podi Uthappam",110,"roast","🥞",""],["tomatouthappam","Tomato Uthappam",110,"roast","🥞",""]
 ],
 ravaroast:[
  ["ravaroast","Rava Roast",135,"rava","🫓",""],["gheeravaroast","Ghee Rava Roast",145,"rava","🫓",""],
  ["onionravaroast","Onion Rava Roast",145,"rava","🫓",""],["ravamasalroast","Rava Masal Roast",145,"rava","🫓",""]
 ],
 roastvar:[
  ["chocolateroast","Chocolate Roast",160,"roastVar","🍫",""],["cauliflowerroast","Cauliflower Masal Roast",140,"roastVar","🫓",""],
  ["mushroomroast","Mushroom Masal Roast",140,"roastVar","🫓",""],["paneerroast","Paneer Masal Roast",160,"roastVar","🫓",""],
  ["garlicroast","Garlic Masal Roast",140,"roastVar","🫓",""],["tomatoroast","Tomato Masal Roast",140,"roastVar","🫓",""]
 ],
 specdosa:[
  ["vendhayadosa","Vendhaya Dosa w/ Poondu Kolambu",110,"specDosa","🫓",""],["adaiaviyal","Adai Aviyal",105,"specDosa","🫓",""],
  ["setdosa","Set Dosa with Vada Curry",105,"specDosa","🫓",""],["vegomelette","Veg Omelette",85,"specDosa","🍳",""]
 ],
 chapathi:[
  ["siparotta","South Indian Parotta (1)",75,"chap","🫓",""],["chapathi2","Chappathi (2)",70,"chap","🫓",""],["chapati","Chappathi (1)",40,"chap","🫓",""]
 ],
 kothu:[
  ["chilliparotta","Chilly Parotta",130,"kothu","🌶️","best"],["kothuparotta","Kothu Parotta",130,"kothu","🍳",""],
  ["mushroomkothu","Mushroom Kothu Parotta",135,"kothu","🍳",""],["paneerkothu","Paneer Kothu Parotta",165,"kothu","🍳",""]
 ],
 snacks:[
  ["curdvadai","Curd Vadai (1)",52,"snacks","🍩",""],["potatobonda","Potato Bonda (2)",40,"snacks","🧆",""],
  ["mysorebonda","Mysore Bonda (2)",40,"snacks","🧆",""],["rawbananabajji","Raw Banana Bajji (2)",35,"snacks","🧆",""],
  ["onionbajji","Onion Bajji (2)",35,"snacks","🧆",""],["masalvadai","Masal Vadai (2)",35,"snacks","🧆",""],["frenchfries","French Fries",80,"snacks","🍟",""]
 ],
 meals:[
  ["rajabhojanam","Rajabhojanam (Full Thali)",278,"mealsR","🍛","best"],["meals","South Indian Meals",180,"mealsS","🍛","best"],
  ["execlunch","Executive Lunch (Limited)",158,"mealsE","🍛",""]
 ],
 lunch:[
  ["vegbriyani","Veg Briyani",110,"lunch","🍚","best"],["mushroombiriyani","Mushroom Biriyani",125,"lunch","🍚",""],
  ["hydmushroombriyani","Special Hyderabadi Mushroom Briyani",190,"specHyd","🍚","best"],["sambarrice","Sambar Rice",85,"lunch","🍚",""],
  ["curdrice","Curd Rice",82,"lunch","🍚",""],["curdsemiya","Curd Semiya",85,"lunch","🍚",""],
  ["lemonrice","Lemon Rice",75,"lunch","🍚",""],["tomatorice","Tomato Rice",75,"lunch","🍚",""]
 ],
 soups:[
  ["tomatosoup","Tomato Soup",100,"noonEve","🥣",""],["sweetcornsoup","Sweet Corn Soup",100,"noonEve","🥣",""],
  ["milagusoup","Milagu Dhania Soup",100,"noonEve","🥣",""],["vegclearsoup","Veg Clear Soup",100,"noonEve","🥣",""],
  ["creammushroomsoup","Cream of Mushroom / Veg",105,"noonEve","🥣",""]
 ],
 ricenoodles:[
  ["vegnoodles","Veg Noodles",175,"noonEve","🍜",""],["vegfriedrice","Veg Fried Rice",175,"noonEve","🍚",""],
  ["mushfriedrice","Mushroom Fried Rice",180,"noonEve","🍚",""],["mushnoodles","Mushroom Noodles",180,"noonEve","🍜",""],
  ["szechfriedrice","Veg Szechwan Fried Rice",180,"noonEve","🍚",""],["szechnoodles","Veg Szechwan Noodles",180,"noonEve","🍜",""],
  ["paneerfriedrice","Paneer Fried Rice",225,"noonEve","🍚",""],["paneernoodles","Paneer Noodles",225,"noonEve","🍜",""]
 ],
 starters_ni:[
  ["paneertikka","Paneer Tikka",245,"noonEve","🍢","best"],["broccolitikka","Broccoli Tikka",240,"noonEve","🍢",""],
  ["masalapapad","Masala Papad",50,"noonEve","🫓",""],["roastedpapad","Roasted Papad",30,"noonEve","🫓",""]
 ],
 starters_ch:[
  ["chilligobi","Chilli Gobi",165,"noonEve","🍢","best"],["chillipaneer","Chilli Paneer",245,"noonEve","🍢",""],
  ["chillimushroom","Chilli Mushroom",200,"noonEve","🍢",""],["mushpepperfry","Mushroom Pepper Fry",190,"noonEve","🍢",""],
  ["paneerpepperfry","Paneer Pepper Fry",225,"noonEve","🍢",""],["gobipepperfry","Gobi Pepper Fry",165,"noonEve","🍢",""],
  ["chinchilligobi","Chinese Chilli Gobi",165,"noonEve","🍢",""],["chinchillimush","Chinese Chilli Mushroom",190,"noonEve","🍢",""],
  ["chinchillipaneer","Chinese Chilli Paneer",225,"noonEve","🍢",""],["vegspringroll","Veg Spring Rolls (5)",220,"noonEve","🥢",""],
  ["paneerspringroll","Paneer Spring Rolls (5)",245,"noonEve","🥢",""],["szechpaneer","Szechwan Paneer",235,"noonEve","🍢",""],
  ["dragonpaneer","Dragon Paneer",230,"noonEve","🍢",""],["gobimanch","Gobi Manchurian",165,"noonEve","🍢","best"],
  ["paneermanch","Paneer Manchurian",225,"noonEve","🍢",""],["mushmanch","Mushroom Manchurian",190,"noonEve","🍢",""],
  ["babycornmanch","Babycorn Manchurian",195,"noonEve","🍢",""],["vegballmanch","Veg Ball Manchurian",200,"noonEve","🍢",""]
 ],
 gravies:[
  ["paneerbuttermasala","Paneer Butter Masala",235,"noonEve","🍲","best"],["mushroommasala","Mushroom Masala",190,"noonEve","🍲",""],
  ["vegchettinadu","Veg Chettinadu",170,"noonEve","🍲",""],["paneerchettinadu","Paneer Chettinadu",235,"noonEve","🍲",""],
  ["mushchettinadu","Mushroom Chettinadu",195,"noonEve","🍲",""],["kadaiveg","Kadai Veg",170,"noonEve","🍲",""],
  ["kadaipaneer","Kadai Paneer",245,"noonEve","🍲",""],["kadaimushroom","Kadai Mushroom",195,"noonEve","🍲",""],
  ["malaikofta","Malai Kofta Curry",245,"noonEve","🍲",""],["mixedvegcurry","Mixed Veg Curry",165,"noonEve","🍲",""],
  ["greenpeasmasala","Green Peas Masala",165,"noonEve","🍲",""],["channamasala","Channa Masala",165,"noonEve","🍲",""],
  ["paneerhyderabadi","Paneer Hyderabadi",235,"noonEve","🍲",""],["paneermatar","Paneer Matar Curry",235,"noonEve","🍲",""],
  ["paneertikkamasala","Paneer Tikka Masala",260,"noonEve","🍲",""],["mushhyderabadi","Mushroom Hyderabadi",195,"noonEve","🍲",""],
  ["mushvartha","Mushroom Vartha Curry",200,"noonEve","🍲",""],["dalfry","Dal Fry",165,"noonEve","🍲",""],
  ["cashewmasala","Cashew Masala",225,"noonEve","🍲",""],["aloogobimasala","Aloo Gobi Masala",165,"noonEve","🍲",""]
 ],
 breads:[
  ["roti","Roti",50,"noonEve","🫓",""],["naan","Naan",50,"noonEve","🫓",""],["kulcha","Kulcha",55,"noonEve","🫓",""],
  ["butterbread","Butter Roti / Naan / Kulcha",65,"noonEve","🫓",""],["rumaliroti","Rumali Roti",60,"noonEve","🫓",""],
  ["garlicroti","Garlic Roti",80,"noonEve","🫓",""],["garlickulcha","Garlic Kulcha",80,"noonEve","🫓",""],
  ["tandooriparatha","Tandoori Paratha",65,"noonEve","🫓",""],["garlicbutternaan","Garlic Butter Naan",80,"noonEve","🫓",""]
 ],
 pulav:[
  ["vegpulav","Veg Pulav",175,"noonEve","🍚",""],["paneerpulav","Paneer Pulav",235,"noonEve","🍚",""],
  ["mushpulav","Mushroom Pulav",180,"noonEve","🍚",""],["peaspulav","Peas Pulav",170,"noonEve","🍚",""],
  ["cashewpulav","Cashew Pulav",245,"noonEve","🍚",""],["jeerarice","Jeera Rice",170,"noonEve","🍚",""],["gheerice","Ghee Rice",220,"noonEve","🍚",""]
 ],
 evespecials:[
  ["chillyidly","Chilly Idly",100,"dinner","🌶️",""],["pepperidly","Pepper Idly",100,"dinner","🍥",""],
  ["podiidly","Podi Idly",100,"dinner","🍥",""],["specialsevai","Special Sevai of the Day",95,"dinner","🍝",""],
  ["aappam","Aappam w/ Coconut Milk & Stew",92,"dinner","🥞",""],["paniyaram","Paniyaram (6 pcs)",80,"dinner","🟤",""],
  ["kuzhaputtu","Kuzha Puttu w/ Kadala Curry",105,"dinner","🍚",""]
 ],
 hot:[
  ["coffee","Annapoorna Spl. Filter Coffee",43,"hot","☕","best,bev"],["blackcoffee","Black Coffee",38,"hot","☕","bev"],
  ["hotmilk","Hot Milk",35,"hot","🥛","bev"],["tea","Tea",40,"hot","🍵","bev"],["blacktea","Black Tea",30,"hot","🍵","bev"],
  ["greentea","Green Tea (dip)",30,"hot","🍵","bev"],["lemontea","Lemon Tea (dip)",30,"hot","🍵","bev"],
  ["bournvita","Bournvita",60,"hot","🥛","bev"],["horlicks","Horlicks",60,"hot","🥛","bev"]
 ],
 cold:[
  ["coldcoffee","Cold Coffee",150,"hot","🧋","bev"],["mango","Mango Milk Shake",90,"hot","🥤","bev"],
  ["rosemilk","Rose Milk",85,"hot","🥛","bev"],["saltlassi","Salt Lassi",80,"hot","🥛","bev"],["sweetlassi","Sweet Lassi",80,"hot","🥛","bev"]
 ],
 juices:[
  ["applejuice","Apple Juice",80,"juice","🧃","bev"],["sweetlimejuice","Sweet Lime (Mozambi)",75,"juice","🧃","bev"],
  ["orangejuice","Orange Juice",80,"juice","🧃","bev"],["muskmelonjuice","Musk Melon Juice",75,"juice","🧃","bev"],
  ["pineapplejuice","Pineapple Juice",75,"juice","🧃","bev"],["watermelonjuice","Watermelon Juice",70,"juice","🧃","bev"],
  ["limesoda","Fresh Lime Soda",60,"juice","🥤","bev"],["limejuice","Fresh Lime Juice",35,"juice","🥤","bev"],
  ["mintlime","Mint Lime Juice",45,"juice","🥤","bev"],["carrotjuice","Carrot Juice",70,"juice","🧃","bev"]
 ],
 shakes:[
  ["strawberryshake","Strawberry Milkshake",160,"shake","🥤","bev"],["butterscotchshake","Butterscotch Milkshake",160,"shake","🥤","bev"],
  ["chocolateshake","Chocolate Milkshake",160,"shake","🥤","bev"],["vanillashake","Vanilla Milkshake",160,"shake","🥤","bev"],
  ["pistashake","Pista Milkshake",160,"shake","🥤","bev"],["almondshake","Almond Milkshake",180,"shake","🥤","bev"],
  ["icecreamshake","Milkshake with Ice Cream",220,"shake","🥤","bev"]
 ],
 desserts:[
  ["rasamalai","Rasamalai",60,"dessert","🍮",""],["rasagulla","Rasagulla",40,"dessert","🍮",""],
  ["carrothalwa","Carrot Halwa w/ Ice Cream",140,"dessert","🍨",""],["hotjamun","Hot Jamun w/ Ice Cream",145,"dessert","🍮","best"],
  ["fruitsalad","Fruit Salad w/ Ice Cream",145,"dessert","🍨",""],["falooda","Falooda",225,"dessert","🍧",""],
  ["chocobrownie","Chocolate Brownie w/ Ice Cream",180,"dessert","🍨",""],["icecreamnuts","Ice Cream w/ Choc Sauce & Nuts",125,"dessert","🍨",""],
  ["choiceicecream","Choice of Ice Cream",105,"dessert","🍨",""]
 ]
};

// build MENU
let menuEntries=[];
for(const g in groups){
 for(const it of groups[g]){
  const [id,n,p,wk,e,flags]=it;
  let o=`{n:${JSON.stringify(n)},p:${p},e:"${e}",h:${JSON.stringify(W[wk])}`;
  if(/best/.test(flags))o+=",best:1";
  if(/bev/.test(flags))o+=",bev:1";
  o+="}";
  menuEntries.push(` ${id}:${o}`);
 }
}
const MENU=`const MENU={\n${menuEntries.join(",\n")}};`;

// helper to list ids of a group
const ids=g=>groups[g].map(x=>x[0]);
const CATS=`const CATS=[
 {name:"Tiffin",ids:${JSON.stringify(ids("tiffin"))}},
 {name:"Roast & Uthappam",subs:[{name:"Roast",ids:${JSON.stringify(ids("roast"))}},{name:"Uthappam",ids:${JSON.stringify(ids("uthappam"))}},{name:"Rava Roast",ids:${JSON.stringify(ids("ravaroast"))}},{name:"Roast Varieties",ids:${JSON.stringify(ids("roastvar"))}},{name:"Special Dosa",ids:${JSON.stringify(ids("specdosa"))}}]},
 {name:"Parotta & Chapathi",subs:[{name:"Chapathi & Parotta",ids:${JSON.stringify(ids("chapathi"))}},{name:"Kothu & Chilly",ids:${JSON.stringify(ids("kothu"))}}]},
 {name:"Meals",ids:${JSON.stringify(ids("meals"))}},
 {name:"Lunch (Rice)",ids:${JSON.stringify(ids("lunch"))}},
 {name:"Soups",ids:${JSON.stringify(ids("soups"))}},
 {name:"Rice & Noodles",ids:${JSON.stringify(ids("ricenoodles"))}},
 {name:"Starters",subs:[{name:"North Indian",ids:${JSON.stringify(ids("starters_ni"))}},{name:"Chinese",ids:${JSON.stringify(ids("starters_ch"))}}]},
 {name:"North Indian",subs:[{name:"Gravies",ids:${JSON.stringify(ids("gravies"))}},{name:"Breads",ids:${JSON.stringify(ids("breads"))}},{name:"Pulav",ids:${JSON.stringify(ids("pulav"))}}]},
 {name:"Evening Specials",ids:${JSON.stringify(ids("evespecials"))}},
 {name:"Beverages",subs:[{name:"Hot",ids:${JSON.stringify(ids("hot"))}},{name:"Cold",ids:${JSON.stringify(ids("cold"))}},{name:"Fresh Juices",ids:${JSON.stringify(ids("juices"))}},{name:"Milkshakes",ids:${JSON.stringify(ids("shakes"))}}]},
 {name:"Desserts & Ice Cream",ids:${JSON.stringify(ids("desserts"))}}
];`;

let tpl=fs.readFileSync(TPL,"utf8");
const i1=tpl.indexOf("const MENU={");
const i2=tpl.indexOf("const OUTLETS=");
let base=tpl.slice(0,i1)+MENU+"\n"+CATS+"\n"+tpl.slice(i2);

// replace avail block to support multi-window timings + TIME_FILTER placeholder
const oldAvail=`const TIME_FILTER=false; // DEMO: false = show ALL dishes/categories. Set to true for the real time-based menu.
const OPEN=Object.keys(MENU).some(id=>HOUR>=MENU[id].h[0]&&HOUR<MENU[id].h[1]);
const avail=id=>!TIME_FILTER||!OPEN||(HOUR>=MENU[id].h[0]&&HOUR<MENU[id].h[1]);`;
const newAvail=tf=>`const TIME_FILTER=${tf};
const inWin=id=>MENU[id].h.some(w=>HOUR>=w[0]&&HOUR<w[1]);
const OPEN=Object.keys(MENU).some(inWin);
const avail=id=>!TIME_FILTER||!OPEN||inWin(id);`;

if(!base.includes(oldAvail)){console.log("WARN: avail block not found");}
const timed=base.replace(oldAvail,newAvail("true"));
const allt=base.replace(oldAvail,newAvail("false"));

fs.writeFileSync(OUTDIR+"annapoorna_chatbot_timed.html",timed);
fs.writeFileSync(OUTDIR+"annapoorna_chatbot_alltime.html",allt);
console.log("WROTE 2 files. total dishes:",menuEntries.length);

// ---- server menu text for the Gemini API route ----
const catLabel={tiffin:"Tiffin",roast:"Roast",uthappam:"Uthappam",ravaroast:"Rava Roast",roastvar:"Roast Varieties",specdosa:"Special Dosa",chapathi:"Chapathi & Parotta",kothu:"Kothu/Chilly Parotta",snacks:"Snacks",meals:"Meals",lunch:"Lunch Rice",soups:"Soups",ricenoodles:"Rice & Noodles",starters_ni:"Starters (North Indian)",starters_ch:"Starters (Chinese)",gravies:"North Indian Gravies",breads:"Breads",pulav:"Pulav",evespecials:"Evening Specials",hot:"Hot Beverages",cold:"Cold Beverages",juices:"Juices",shakes:"Milkshakes",desserts:"Desserts & Ice Cream"};
let lines=[];
for(const g in groups){for(const it of groups[g]){lines.push(`${it[0]} | ${it[1]} | Rs.${it[2]} | ${catLabel[g]||g}`);}}
const menuTxt=lines.join("\n");

// ---- flat menu data for the admin menu manager ----
const flatMenu=[];
for(const g in groups){for(const it of groups[g]){flatMenu.push({id:it[0],name:it[1],price:it[2],cat:catLabel[g]||g,best:it[5]==="best"});}}
const menuDataTs="// AUTO-GENERATED by scripts/build_menu.js — do not edit by hand.\n"+
  "export type Dish = { id: string; name: string; price: number; cat: string; best: boolean };\n"+
  "export const MENU_DATA: Dish[] = "+JSON.stringify(flatMenu)+";\n"+
  "export const CATEGORIES: string[] = "+JSON.stringify([...new Set(flatMenu.map(d=>d.cat))])+";\n";
fs.mkdirSync(OUTDIR+"app/annapoorna/admin",{recursive:true});
fs.writeFileSync(OUTDIR+"app/annapoorna/admin/menuData.ts",menuDataTs);
console.log("WROTE app/annapoorna/admin/menuData.ts ("+flatMenu.length+" dishes)");

const route=`import { NextRequest, NextResponse } from "next/server";

// Auto-generated from the Annapoorna menu. Server-side only (the API key never reaches the browser).
const MENU = \`${menuTxt}\`;
const CATEGORIES = "Tiffin, Roast & Uthappam, Parotta & Chapathi, Meals, Lunch (Rice), Soups, Rice & Noodles, Starters, North Indian, Evening Specials, Beverages, Desserts & Ice Cream";

function systemPrompt(lang: string) {
  return [
    "You are the warm, friendly AI waiter for Sree Annapoorna, a pure-vegetarian South Indian restaurant in Coimbatore.",
    "You ONLY know the menu below. NEVER invent dishes, prices or details. If asked for something not on the menu, say it is unavailable and suggest a close menu alternative.",
    "Stay strictly about Annapoorna food, drinks and dining. Politely decline anything unrelated.",
    "Reply ONLY in this language code: " + lang + ". Be warm and concise (1-2 short sentences).",
    "Feel free to use a few friendly, relevant emojis in your reply to convey a warm, welcoming tone (e.g. 😊🙏🍽️☕) — but don't overdo it.",
    "You can take orders and help guests explore. Respond ONLY with a JSON object:",
    '{"reply":"<short message>","actions":[ ... ]}',
    "Each action is one of:",
    '{"type":"add","id":"<menu id>","qty":<number>}  // add a dish to cart',
    '{"type":"show","ids":["<menu id>",...]}          // show dish cards',
    '{"type":"none"}',
    "Use EXACT ids from the menu (first column). Categories: " + CATEGORIES + ".",
    "UNDERSTAND CASUAL & SPOKEN NAMES (speech-to-text is often imperfect, so match loosely and forgive small errors):",
    "- Our crispy DOSAS are printed as 'Roast': Ghee Roast (gheeroast) = ghee/plain dosa, Paper Roast (paperroast) = paper dosa, Masal Roast (masalroast) = masala dosa, Onion Roast (onionroast) = onion dosa, Podi Roast (podiroast) = podi dosa. Rava Roast (ravaroast) = rava dosa.",
    "- If a guest just says 'dosa' without a type, add Ghee Roast (gheeroast) as a sensible default and tell them they can swap it.",
    "- Map common words: vada/vadai -> Vadai (vada), coffee -> Filter Coffee (coffee), tea -> Tea (tea), meals/thali -> South Indian Meals (meals), parotta/porotta -> a parotta item, juice -> a fresh juice.",
    "PORTIONS — some dishes are sold as 2 pieces or 1 piece. If the guest names one of these WITHOUT saying how many, do NOT add it yet. In your reply, say the 2-piece price (mention it is 2 pieces), give the single-piece price, and ask whether they want 2 or 1. Add ONLY after they choose. If they already gave a number (e.g. 'two idli', 'rendu idli', 'one idli', 'single idli'), pick the matching plate and add it directly with no question:",
    "  - Idly: 2 pcs = id 'idli' Rs.50 ; 1 pc = id 'idli1' Rs.30.",
    "  - Sambar Idly: 2 pcs = id 'sambaridli' Rs.65 ; 1 pc = id 'sambaridli1' Rs.42.",
    "  - Poori (with Potato Masal): 2 pcs = id 'poori2' Rs.95 ; 1 pc = id 'poori1' Rs.50.",
    "  - Chappathi: 2 pcs = id 'chapathi2' Rs.70 ; 1 pc = id 'chapati' Rs.40.",
    "  - Single-only items such as Vadai (id 'vada', 1 pc Rs.33) and Sambar Vadai (id 'sambarvadai', 1 pc Rs.44): just add and mention it is 1 piece — no 2-or-1 question.",
    "  - Quantity vs portion: 'two idli' means the 2-piece Idly plate (id 'idli'); to give two single plates only if they clearly want 2 separate single servings.",
    "ORDERING: When the guest wants to order, ALWAYS act. Add EVERY item you can identify using add actions, handling several dishes and quantities in ONE reply (e.g. 'two idli and one dosa' -> add idli qty 1 AND add gheeroast qty 1). EXCEPTION: for the PORTIONS dishes above named without a quantity, ask the 2-or-1 question first instead of adding. For anything else that is truly unclear, add what you can and ask ONE short follow-up. NEVER say you cannot help — always move the order forward warmly.",
    "To recommend or show dishes, ALWAYS use a show action with 3-6 specific dish ids (dish cards). NEVER open or switch a menu category/tab yourself.",
    "MENU (id | name | price | category):",
    MENU
  ].join("\\n");
}

export async function POST(req: NextRequest) {
  try {
    const { message, lang = "en", cart = [] } = await req.json();
    const key = process.env.GEMINI_API_KEY;
    if (!key) return NextResponse.json({ reply: "AI is not configured yet.", actions: [] });
    const body = {
      systemInstruction: { parts: [{ text: systemPrompt(lang) }] },
      contents: [{ role: "user", parts: [{ text: "Current cart (ids): " + (cart.join(", ") || "empty") + "\\nGuest says: " + message }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.3, maxOutputTokens: 1200, thinkingConfig: { thinkingBudget: 0 },
        responseSchema: { type: "object", properties: { reply: { type: "string" }, actions: { type: "array", items: { type: "object", properties: { type: { type: "string" }, id: { type: "string" }, qty: { type: "number" }, ids: { type: "array", items: { type: "string" } }, name: { type: "string" } }, required: ["type"] } } }, required: ["reply"] } }
    };
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + key, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
    });
    const j = await r.json();
    // Upstream API error (quota / rate limit / auth / outage) — tell the guest clearly instead of "didn't understand".
    if (!r.ok || (j && j.error)) {
      const st = r.status, ec = String((j && j.error && (j.error.status || j.error.code)) || "");
      const rate = st === 429 || ec.includes("429") || ec.includes("RESOURCE_EXHAUSTED") || st === 503;
      const BUSY: any = {
        en: "We're getting a lot of requests right now — please try again in a few seconds. 🙏",
        ta: "இப்போது அதிக கோரிக்கைகள் வருகின்றன — சில நொடிகளில் மீண்டும் முயற்சிக்கவும். 🙏",
        hi: "अभी बहुत सारे अनुरोध आ रहे हैं — कृपया कुछ सेकंड बाद फिर कोशिश करें। 🙏",
        ml: "ഇപ്പോള് ധാരാളം അഭ്യർത്ഥനകള് വരുന്നു — കുറച്ച് സെക്കൻഡിനു ശേഷം വീണ്ടും ശ്രമിക്കൂ. 🙏",
        te: "ప్రస్తుతం చాలా అభ్యర్థనలు వస్తున్నాయి — కొన్ని సెకన్లలో మళ్లీ ప్రయత్నించండి. 🙏",
        kn: "ಈಗ ಸಾಕಷ್ಟು ವಿನಂತಿಗಳು ಬರುತ್ತಿವೆ — ಕೆಲವು ಸೆಕೆಂಡುಗಳಲ್ಲಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ. 🙏"
      };
      const DOWN: any = {
        en: "The assistant is briefly unavailable — please try again in a moment.",
        ta: "உதவியாளர் சற்று நேரம் கிடைக்கவில்லை — சிறிது நேரத்தில் மீண்டும் முயற்சிக்கவும்.",
        hi: "सहायक थोड़ी देर के लिए अनुपलब्ध है — कृपया थोड़ी देर में फिर कोशिश करें।",
        ml: "സഹായി കുറച്ച് നേരത്തേക്ക് ലഭ്യമല്ല — അൽപസമയത്തിനു ശേഷം വീണ്ടും ശ്രമിക്കൂ.",
        te: "సహాయకుడు కొద్దిసేపు అందుబాటులో లేడు — కొద్దిసేపటి తర్వాత మళ్లీ ప్రయత్నించండి.",
        kn: "ಸಹಾಯಕ ಸ್ವಲ್ಪ ಸಮಯ ಲಭ್ಯವಿಲ್ಲ — ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ."
      };
      const m = rate ? BUSY : DOWN;
      return NextResponse.json({ reply: m[lang] || m.en, actions: [] });
    }
    const FB: any = {
      en: "Sorry, I didn't quite catch that — could you say it once more?",
      ta: "மன்னிக்கவும், சரியாகப் புரியவில்லை — மீண்டும் ஒருமுறை சொல்ல முடியுமா?",
      hi: "माफ़ कीजिए, मैं ठीक से समझ नहीं पाया — कृपया एक बार फिर बताइए?",
      ml: "ക്ഷമിക്കണം, എനിക്ക് ശരിക്ക് മനസ്സിലായില്ല — ഒന്നുകൂടി പറയാമോ?",
      te: "క్షమించండి, సరిగ్గా అర్థం కాలేదు — మరోసారి చెప్పగలరా?",
      kn: "ಕ್ಷಮಿಸಿ, ಸರಿಯಾಗಿ ಅರ್ಥವಾಗಲಿಲ್ಲ — ಇನ್ನೊಮ್ಮೆ ಹೇಳಬಹುದೇ?"
    };
    let out: any = { reply: FB[lang] || FB.en, actions: [] };
    try {
      let txt = (j.candidates?.[0]?.content?.parts?.[0]?.text) || "";
      const s = txt.indexOf("{"), e = txt.lastIndexOf("}");
      if (s >= 0 && e > s) txt = txt.slice(s, e + 1);
      const parsed = JSON.parse(txt);
      if (parsed && typeof parsed.reply === "string" && parsed.reply.trim()) {
        out = parsed;
        if (!Array.isArray(out.actions)) out.actions = [];
      }
    } catch (err) {}
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({ reply: "Something went wrong, please try again.", actions: [] });
  }
}
`;
fs.mkdirSync(OUTDIR+"app/api/ody",{recursive:true});
fs.writeFileSync(OUTDIR+"app/api/ody/route.ts",route);
fs.mkdirSync(OUTDIR+"public/ody",{recursive:true});
fs.copyFileSync(OUTDIR+"annapoorna_chatbot_alltime.html",OUTDIR+"public/ody/index.html");
console.log("WROTE app/api/ody/route.ts + public/ody/index.html");
