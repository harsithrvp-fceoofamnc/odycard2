import { NextRequest, NextResponse } from "next/server";

// Auto-generated from the Bon Bon menu. Server-side only (the API key never reaches the browser).
const MENU = `madagascarvanilla | Madagascar Vanilla | Rs.80 | Scoops
cookiencream | Cookie N Cream | Rs.90 | Scoops
blackcurrant_sc | Black Currant | Rs.90 | Scoops
hopscotch | Hop Scotch Butterscotch | Rs.90 | Scoops
alphonsomango_sc | Alphonso Mango | Rs.90 | Scoops
bananacaramel | Banana Caramel | Rs.90 | Scoops
belgianchoc_sc | Belgian Chocolate | Rs.90 | Scoops
tendercoconut | Tender Coconut | Rs.90 | Scoops
honeynutcrunch | Honey Nut Crunch | Rs.90 | Scoops
caramelnutty | Caramel Nutty Crunch | Rs.90 | Scoops
tajmahal | Taj Mahal | Rs.90 | Scoops
strawberry_sc | Strawberry | Rs.80 | Scoops
lotusbiscoff | Lotus Biscoff | Rs.90 | Scoops
saltedcaramel | Salted Caramel | Rs.90 | Scoops
ogjackfruit | The Og Jackfruit | Rs.90 | Scoops
cottoncandy_sc | Cotton Candy | Rs.90 | Scoops
filtercoffee_sc | Filter Coffee | Rs.90 | Scoops
ferreroroucher | Ferrero Roucher | Rs.110 | Scoops
madagascarsofty | Madagascar Vanilla Softy | Rs.60 | Softy
ripple | Ripple | Rs.90 | Softy
hotchocodip | Hot Choco Dip | Rs.90 | Softy
bonbonfruit | Bon Bon Fruit Special | Rs.120 | Softy
apricotalmond | Apricot Almond | Rs.120 | Softy
crackynutty | Cracky Nutty Crunch | Rs.120 | Softy
blackcurrantalmond | Black Currant Almond | Rs.120 | Softy
nutbutterscotch_so | Nut Butterscotch | Rs.120 | Softy
royalkesar_so | Royal Kesar Badam & Pista | Rs.120 | Softy
fruitycrunch | Fruity Crunch | Rs.120 | Softy
belgianwaffle | Belgian Waffle | Rs.160 | Waffle
belgianwafflesizzler | Belgian Waffle Sizzler | Rs.200 | Waffle
belgianwaffleic | Belgian Waffle with Ice Cream | Rs.250 | Waffle
belgianwaffleic2 | Belgian Waffle with Icecream | Rs.230 | Ice Cream Specials
deathbychocolate | Death by Chocolate | Rs.230 | Ice Cream Specials
mississippimud | Mississippi Mud Sundae | Rs.220 | Ice Cream Specials
sizzlinghotbrownie | Sizzling Hot Brownie Sizzler | Rs.210 | Ice Cream Specials
gudbud | Gud Bud Sundae | Rs.210 | Ice Cream Specials
tiramisu | Tiramisu Sundae | Rs.210 | Ice Cream Specials
belgiandarkchoc | Belgian Dark Chocolate Sundae | Rs.210 | Ice Cream Specials
browniebomb | Brownie Bomb | Rs.180 | Ice Cream Specials
specialdryfruits_ic | Special Dry Fruits | Rs.180 | Ice Cream Specials
hotfudge | Hot Fudge Sundae | Rs.180 | Ice Cream Specials
titanicboat | Titanic Boat | Rs.210 | Ice Cream Specials
tallbeauty | Tall Beauty | Rs.200 | Ice Cream Specials
naughtynutella_ic | Naughty Nutella Sundae | Rs.250 | Ice Cream Specials
blackforest_ic | Black Forest Sundae | Rs.170 | Ice Cream Specials
chocomania | Choco Mania | Rs.180 | Ice Cream Specials
blackbeauty | Black Beauty | Rs.195 | Ice Cream Specials
mixedfruitcaramel | Mixed Fruit Caramel | Rs.180 | Ice Cream Specials
butterscotchproline | Butter Scotch Proline Sundae | Rs.170 | Sundae
chocobutterchips | Choco Butter Chips Sundae | Rs.180 | Sundae
lovelichee | Love Lichee Sundae | Rs.180 | Sundae
fruitsalad | Fruit Salad Sundae | Rs.170 | Sundae
proteinblast_su | Protein Blast Sundae | Rs.180 | Sundae
getsmart | Get Smart Sundae | Rs.180 | Sundae
blackcurrant_su | Black Currant Sundae | Rs.170 | Sundae
blackforestdream | Black Forest Dream Sundae | Rs.170 | Sundae
pistachio | Pista Chio Sundae | Rs.180 | Sundae
mixfruitjelly | Mix Fruit Jelly | Rs.170 | Sundae
dryfruitjelly | Dry Fruit Jelly | Rs.180 | Sundae
rainbowcassata | Rainbow Cassata | Rs.200 | Sundae
specialdryfruits_su | Special Dry Fruits Sundae | Rs.180 | Sundae
hotfudgenut | Hot Fudge Nut Sundae | Rs.130 | Mini Sundae
nutbutterscotch_mi | Nut Butterscotch Sundae | Rs.130 | Mini Sundae
chocobutterchips_mi | Choco Butter Chips Bon | Rs.130 | Mini Sundae
strawberrybanana | Strawberry Banana Bon | Rs.130 | Mini Sundae
litchibon | Litchi Bon | Rs.130 | Mini Sundae
proteinblastbon | Protein Blast Bon | Rs.130 | Mini Sundae
chococherrybon | Choco Cherry Bon | Rs.130 | Mini Sundae
blackcurrantbon | Black Currant Bon | Rs.130 | Mini Sundae
blackforestbon | Black Forest Bon | Rs.130 | Mini Sundae
chocolatebon | Chocolate Bon | Rs.130 | Mini Sundae
licheechocostraw | Lichee Choco Strawberry Bon | Rs.130 | Mini Sundae
alphonsomangobon | Alphonso Mango Bon | Rs.130 | Mini Sundae
chocobrownieroll | Chocolate Brownie Roll | Rs.150 | Roll Ice Cream
oreoroll | Oreo Roll | Rs.150 | Roll Ice Cream
blackforestroll | Black Forest Roll | Rs.150 | Roll Ice Cream
hazelnutroll | Hazelnut Roll | Rs.180 | Roll Ice Cream
royaldryfruits | Royal Dry Fruits Falooda | Rs.170 | Falooda
realalphonso | Real Alphonso Mango Falooda | Rs.150 | Falooda
ogrose | Og Rose Falooda | Rs.150 | Falooda
belgianchoc_fa | Belgian Chocolate Falooda | Rs.150 | Falooda
cottoncandy_fa | Cotton Candy Falooda | Rs.170 | Falooda
frenchvanilla | French Vanilla Shake | Rs.120 | Thick Shakes
belgianchoc_ts | Belgian Chocolate Shake | Rs.130 | Thick Shakes
classiccoldcoffee | Classic Cold Coffee | Rs.130 | Thick Shakes
caramelcoldcoffee | Caramel Cold Coffee | Rs.140 | Thick Shakes
royalkesarbadam | Royal Kesar Badam Shake | Rs.150 | Thick Shakes
litchi_ts | Litchi Shake | Rs.180 | Thick Shakes
blackcurrant_ts | Black Currant Shake | Rs.130 | Thick Shakes
ogoreo | Og Oreo Shake | Rs.150 | Thick Shakes
chocolateoreo | Chocolate Oreo Shake | Rs.160 | Thick Shakes
naughtynutella_ts | Naughty Nutella Shake | Rs.200 | Thick Shakes
oghazelnut | Og Hazelnut Shake | Rs.200 | Thick Shakes
coffeehazelnut | Coffee Hazelnut Shake | Rs.250 | Thick Shakes
snickerscaramel | Snickers Caramel Shake | Rs.250 | Thick Shakes
exoticalphonso | Exotic Alphonso Mango Shake | Rs.250 | Thick Shakes
chocobrownie_ts | Choco Brownie Shake | Rs.250 | Thick Shakes
tresleches | Tres Leches Shake | Rs.250 | Thick Shakes
proteinblast_ts | Protein Blast Shake | Rs.250 | Thick Shakes
frenchfriessmall | French Fries Small | Rs.110 | Snacks
frenchfrieslarge | French Fries Large | Rs.130 | Snacks
loadedfries | Loaded Fries | Rs.150 | Snacks
comboplatter | Combo Platter | Rs.200 | Snacks
cheeseball | Cheese Ball | Rs.150 | Snacks
smileyssmall | Smileys (Small) | Rs.100 | Snacks
smileyslarge | Smileys (Large) | Rs.160 | Snacks
vegsandwich | Veg Sandwich | Rs.110 | Snacks
paneersandwich | Paneer Sandwich | Rs.130 | Snacks
cheeseballsandwich | Cheese Ball Sandwich | Rs.180 | Snacks
extraicecream | Extra Ice Cream (add-on) | Rs.30 | Add-ons`;
const CATEGORIES = "Scoops, Softy, Waffle, Ice Cream Specials, Sundae, Mini Sundae, Roll Ice Cream, Falooda, Thick Shakes, Snacks";

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
  ].join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const { message, lang = "en", cart = [], restaurant = "", taste = "" } = await req.json();
    const key = process.env.GEMINI_API_KEY;
    if (!key) return NextResponse.json({ reply: "AI is not configured yet.", actions: [] });
    const body = {
      systemInstruction: { parts: [{ text: systemPrompt(lang, restaurant) }] },
      contents: [{ role: "user", parts: [{ text: (taste ? "Guest taste profile: " + taste + "\n" : "") + "Current cart (ids): " + (cart.join(", ") || "empty") + "\nGuest says: " + message }] }],
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
