import { NextRequest, NextResponse } from "next/server";

// Auto-generated from the Annapoorna menu. Server-side only (the API key never reaches the browser).
const MENU = `idli | Idly (2) | Rs.50 | Tiffin
idli1 | Idly (1) | Rs.30 | Tiffin
sambaridli | Sambar Idly (2) | Rs.65 | Tiffin
sambaridli1 | Sambar Idly (1) | Rs.42 | Tiffin
vada | Vadai (1) | Rs.33 | Tiffin
sambarvadai | Sambar Vadai (1) | Rs.44 | Tiffin
pongal | Pongal | Rs.80 | Tiffin
ravakitchadi | Veg Rava Kitchadi | Rs.75 | Tiffin
poori2 | Poori w/ Potato Masal (2) | Rs.95 | Tiffin
poori1 | Poori w/ Potato Masal (1) | Rs.50 | Tiffin
idiyappam | Idiyappam w/ Coconut Milk & Stew | Rs.95 | Tiffin
lemonsevai | Lemon Sevai | Rs.77 | Tiffin
gheeminiidli | Ghee Mini Idly in Sambar | Rs.105 | Tiffin
wheatuppuma | Wheat Uppuma | Rs.75 | Tiffin
wheatuppumacurd | Wheat Uppuma with Curd | Rs.88 | Tiffin
channabhatura | Channa Bhatura (Chola Poori) | Rs.130 | Tiffin
gheeroast | Ghee Roast | Rs.95 | Roast
paperroast | Paper Roast | Rs.135 | Roast
familyroast | Family Roast | Rs.500 | Roast
masalroast | Masal Roast (Potato Masal) | Rs.135 | Roast
gheemasalroast | Ghee Masal Roast (Potato Masal) | Rs.145 | Roast
buttermasalroast | Butter Masal Roast (Potato Masal) | Rs.140 | Roast
onionroast | Onion Roast | Rs.125 | Roast
gheeonionroast | Ghee Onion Roast | Rs.135 | Roast
podiroast | Podi Roast | Rs.120 | Roast
uthappam | Uthappam | Rs.95 | Uthappam
gheeuthappam | Ghee Uthappam | Rs.130 | Uthappam
onionuthappam | Onion Uthappam | Rs.125 | Uthappam
gheeonionuthappam | Ghee Onion Uthappam | Rs.135 | Uthappam
podiuthappam | Podi Uthappam | Rs.110 | Uthappam
tomatouthappam | Tomato Uthappam | Rs.110 | Uthappam
ravaroast | Rava Roast | Rs.135 | Rava Roast
gheeravaroast | Ghee Rava Roast | Rs.145 | Rava Roast
onionravaroast | Onion Rava Roast | Rs.145 | Rava Roast
ravamasalroast | Rava Masal Roast | Rs.145 | Rava Roast
chocolateroast | Chocolate Roast | Rs.160 | Roast Varieties
cauliflowerroast | Cauliflower Masal Roast | Rs.140 | Roast Varieties
mushroomroast | Mushroom Masal Roast | Rs.140 | Roast Varieties
paneerroast | Paneer Masal Roast | Rs.160 | Roast Varieties
garlicroast | Garlic Masal Roast | Rs.140 | Roast Varieties
tomatoroast | Tomato Masal Roast | Rs.140 | Roast Varieties
vendhayadosa | Vendhaya Dosa w/ Poondu Kolambu | Rs.110 | Special Dosa
adaiaviyal | Adai Aviyal | Rs.105 | Special Dosa
setdosa | Set Dosa with Vada Curry | Rs.105 | Special Dosa
vegomelette | Veg Omelette | Rs.85 | Special Dosa
siparotta | South Indian Parotta (1) | Rs.75 | Chapathi & Parotta
chapathi2 | Chappathi (2) | Rs.70 | Chapathi & Parotta
chapati | Chappathi (1) | Rs.40 | Chapathi & Parotta
chilliparotta | Chilly Parotta | Rs.130 | Kothu/Chilly Parotta
kothuparotta | Kothu Parotta | Rs.130 | Kothu/Chilly Parotta
mushroomkothu | Mushroom Kothu Parotta | Rs.135 | Kothu/Chilly Parotta
paneerkothu | Paneer Kothu Parotta | Rs.165 | Kothu/Chilly Parotta
curdvadai | Curd Vadai (1) | Rs.52 | Snacks
potatobonda | Potato Bonda (2) | Rs.40 | Snacks
mysorebonda | Mysore Bonda (2) | Rs.40 | Snacks
rawbananabajji | Raw Banana Bajji (2) | Rs.35 | Snacks
onionbajji | Onion Bajji (2) | Rs.35 | Snacks
masalvadai | Masal Vadai (2) | Rs.35 | Snacks
frenchfries | French Fries | Rs.80 | Snacks
rajabhojanam | Rajabhojanam (Full Thali) | Rs.278 | Meals
meals | South Indian Meals | Rs.180 | Meals
execlunch | Executive Lunch (Limited) | Rs.158 | Meals
vegbriyani | Veg Briyani | Rs.110 | Lunch Rice
mushroombiriyani | Mushroom Biriyani | Rs.125 | Lunch Rice
hydmushroombriyani | Special Hyderabadi Mushroom Briyani | Rs.190 | Lunch Rice
sambarrice | Sambar Rice | Rs.85 | Lunch Rice
curdrice | Curd Rice | Rs.82 | Lunch Rice
curdsemiya | Curd Semiya | Rs.85 | Lunch Rice
lemonrice | Lemon Rice | Rs.75 | Lunch Rice
tomatorice | Tomato Rice | Rs.75 | Lunch Rice
tomatosoup | Tomato Soup | Rs.100 | Soups
sweetcornsoup | Sweet Corn Soup | Rs.100 | Soups
milagusoup | Milagu Dhania Soup | Rs.100 | Soups
vegclearsoup | Veg Clear Soup | Rs.100 | Soups
creammushroomsoup | Cream of Mushroom / Veg | Rs.105 | Soups
vegnoodles | Veg Noodles | Rs.175 | Rice & Noodles
vegfriedrice | Veg Fried Rice | Rs.175 | Rice & Noodles
mushfriedrice | Mushroom Fried Rice | Rs.180 | Rice & Noodles
mushnoodles | Mushroom Noodles | Rs.180 | Rice & Noodles
szechfriedrice | Veg Szechwan Fried Rice | Rs.180 | Rice & Noodles
szechnoodles | Veg Szechwan Noodles | Rs.180 | Rice & Noodles
paneerfriedrice | Paneer Fried Rice | Rs.225 | Rice & Noodles
paneernoodles | Paneer Noodles | Rs.225 | Rice & Noodles
paneertikka | Paneer Tikka | Rs.245 | Starters (North Indian)
broccolitikka | Broccoli Tikka | Rs.240 | Starters (North Indian)
masalapapad | Masala Papad | Rs.50 | Starters (North Indian)
roastedpapad | Roasted Papad | Rs.30 | Starters (North Indian)
chilligobi | Chilli Gobi | Rs.165 | Starters (Chinese)
chillipaneer | Chilli Paneer | Rs.245 | Starters (Chinese)
chillimushroom | Chilli Mushroom | Rs.200 | Starters (Chinese)
mushpepperfry | Mushroom Pepper Fry | Rs.190 | Starters (Chinese)
paneerpepperfry | Paneer Pepper Fry | Rs.225 | Starters (Chinese)
gobipepperfry | Gobi Pepper Fry | Rs.165 | Starters (Chinese)
chinchilligobi | Chinese Chilli Gobi | Rs.165 | Starters (Chinese)
chinchillimush | Chinese Chilli Mushroom | Rs.190 | Starters (Chinese)
chinchillipaneer | Chinese Chilli Paneer | Rs.225 | Starters (Chinese)
vegspringroll | Veg Spring Rolls (5) | Rs.220 | Starters (Chinese)
paneerspringroll | Paneer Spring Rolls (5) | Rs.245 | Starters (Chinese)
szechpaneer | Szechwan Paneer | Rs.235 | Starters (Chinese)
dragonpaneer | Dragon Paneer | Rs.230 | Starters (Chinese)
gobimanch | Gobi Manchurian | Rs.165 | Starters (Chinese)
paneermanch | Paneer Manchurian | Rs.225 | Starters (Chinese)
mushmanch | Mushroom Manchurian | Rs.190 | Starters (Chinese)
babycornmanch | Babycorn Manchurian | Rs.195 | Starters (Chinese)
vegballmanch | Veg Ball Manchurian | Rs.200 | Starters (Chinese)
paneerbuttermasala | Paneer Butter Masala | Rs.235 | North Indian Gravies
mushroommasala | Mushroom Masala | Rs.190 | North Indian Gravies
vegchettinadu | Veg Chettinadu | Rs.170 | North Indian Gravies
paneerchettinadu | Paneer Chettinadu | Rs.235 | North Indian Gravies
mushchettinadu | Mushroom Chettinadu | Rs.195 | North Indian Gravies
kadaiveg | Kadai Veg | Rs.170 | North Indian Gravies
kadaipaneer | Kadai Paneer | Rs.245 | North Indian Gravies
kadaimushroom | Kadai Mushroom | Rs.195 | North Indian Gravies
malaikofta | Malai Kofta Curry | Rs.245 | North Indian Gravies
mixedvegcurry | Mixed Veg Curry | Rs.165 | North Indian Gravies
greenpeasmasala | Green Peas Masala | Rs.165 | North Indian Gravies
channamasala | Channa Masala | Rs.165 | North Indian Gravies
paneerhyderabadi | Paneer Hyderabadi | Rs.235 | North Indian Gravies
paneermatar | Paneer Matar Curry | Rs.235 | North Indian Gravies
paneertikkamasala | Paneer Tikka Masala | Rs.260 | North Indian Gravies
mushhyderabadi | Mushroom Hyderabadi | Rs.195 | North Indian Gravies
mushvartha | Mushroom Vartha Curry | Rs.200 | North Indian Gravies
dalfry | Dal Fry | Rs.165 | North Indian Gravies
cashewmasala | Cashew Masala | Rs.225 | North Indian Gravies
aloogobimasala | Aloo Gobi Masala | Rs.165 | North Indian Gravies
roti | Roti | Rs.50 | Breads
naan | Naan | Rs.50 | Breads
kulcha | Kulcha | Rs.55 | Breads
butterbread | Butter Roti / Naan / Kulcha | Rs.65 | Breads
rumaliroti | Rumali Roti | Rs.60 | Breads
garlicroti | Garlic Roti | Rs.80 | Breads
garlickulcha | Garlic Kulcha | Rs.80 | Breads
tandooriparatha | Tandoori Paratha | Rs.65 | Breads
garlicbutternaan | Garlic Butter Naan | Rs.80 | Breads
vegpulav | Veg Pulav | Rs.175 | Pulav
paneerpulav | Paneer Pulav | Rs.235 | Pulav
mushpulav | Mushroom Pulav | Rs.180 | Pulav
peaspulav | Peas Pulav | Rs.170 | Pulav
cashewpulav | Cashew Pulav | Rs.245 | Pulav
jeerarice | Jeera Rice | Rs.170 | Pulav
gheerice | Ghee Rice | Rs.220 | Pulav
chillyidly | Chilly Idly | Rs.100 | Evening Specials
pepperidly | Pepper Idly | Rs.100 | Evening Specials
podiidly | Podi Idly | Rs.100 | Evening Specials
specialsevai | Special Sevai of the Day | Rs.95 | Evening Specials
aappam | Aappam w/ Coconut Milk & Stew | Rs.92 | Evening Specials
paniyaram | Paniyaram (6 pcs) | Rs.80 | Evening Specials
kuzhaputtu | Kuzha Puttu w/ Kadala Curry | Rs.105 | Evening Specials
coffee | Annapoorna Spl. Filter Coffee | Rs.43 | Hot Beverages
blackcoffee | Black Coffee | Rs.38 | Hot Beverages
hotmilk | Hot Milk | Rs.35 | Hot Beverages
tea | Tea | Rs.40 | Hot Beverages
blacktea | Black Tea | Rs.30 | Hot Beverages
greentea | Green Tea (dip) | Rs.30 | Hot Beverages
lemontea | Lemon Tea (dip) | Rs.30 | Hot Beverages
bournvita | Bournvita | Rs.60 | Hot Beverages
horlicks | Horlicks | Rs.60 | Hot Beverages
coldcoffee | Cold Coffee | Rs.150 | Cold Beverages
mango | Mango Milk Shake | Rs.90 | Cold Beverages
rosemilk | Rose Milk | Rs.85 | Cold Beverages
saltlassi | Salt Lassi | Rs.80 | Cold Beverages
sweetlassi | Sweet Lassi | Rs.80 | Cold Beverages
applejuice | Apple Juice | Rs.80 | Juices
sweetlimejuice | Sweet Lime (Mozambi) | Rs.75 | Juices
orangejuice | Orange Juice | Rs.80 | Juices
muskmelonjuice | Musk Melon Juice | Rs.75 | Juices
pineapplejuice | Pineapple Juice | Rs.75 | Juices
watermelonjuice | Watermelon Juice | Rs.70 | Juices
limesoda | Fresh Lime Soda | Rs.60 | Juices
limejuice | Fresh Lime Juice | Rs.35 | Juices
mintlime | Mint Lime Juice | Rs.45 | Juices
carrotjuice | Carrot Juice | Rs.70 | Juices
strawberryshake | Strawberry Milkshake | Rs.160 | Milkshakes
butterscotchshake | Butterscotch Milkshake | Rs.160 | Milkshakes
chocolateshake | Chocolate Milkshake | Rs.160 | Milkshakes
vanillashake | Vanilla Milkshake | Rs.160 | Milkshakes
pistashake | Pista Milkshake | Rs.160 | Milkshakes
almondshake | Almond Milkshake | Rs.180 | Milkshakes
icecreamshake | Milkshake with Ice Cream | Rs.220 | Milkshakes
rasamalai | Rasamalai | Rs.60 | Desserts & Ice Cream
rasagulla | Rasagulla | Rs.40 | Desserts & Ice Cream
carrothalwa | Carrot Halwa w/ Ice Cream | Rs.140 | Desserts & Ice Cream
hotjamun | Hot Jamun w/ Ice Cream | Rs.145 | Desserts & Ice Cream
fruitsalad | Fruit Salad w/ Ice Cream | Rs.145 | Desserts & Ice Cream
falooda | Falooda | Rs.225 | Desserts & Ice Cream
chocobrownie | Chocolate Brownie w/ Ice Cream | Rs.180 | Desserts & Ice Cream
icecreamnuts | Ice Cream w/ Choc Sauce & Nuts | Rs.125 | Desserts & Ice Cream
choiceicecream | Choice of Ice Cream | Rs.105 | Desserts & Ice Cream`;
const CATEGORIES = "Tiffin, Roast & Uthappam, Parotta & Chapathi, Meals, Lunch (Rice), Soups, Rice & Noodles, Starters, North Indian, Evening Specials, Beverages, Desserts & Ice Cream";

function systemPrompt(lang: string) {
  return [
    "You are the warm, friendly AI waiter for Sree Annapoorna, a pure-vegetarian South Indian restaurant in Coimbatore.",
    "You ONLY know the menu below. NEVER invent dishes, prices or details. If asked for something not on the menu, say it is unavailable and suggest a close menu alternative.",
    "Stay strictly about Annapoorna food, drinks and dining. Politely decline anything unrelated.",
    "Reply ONLY in this language code: " + lang + ". Be warm and concise (1-2 short sentences).",
    "You can take orders and help guests explore. Respond ONLY with a JSON object:",
    '{"reply":"<short message>","actions":[ ... ]}',
    "Each action is one of:",
    '{"type":"add","id":"<menu id>","qty":<number>}  // add a dish to cart',
    '{"type":"show","ids":["<menu id>",...]}          // show dish cards',
    '{"type":"category","name":"<category>"}          // open a category',
    '{"type":"none"}',
    "Use EXACT ids from the menu (first column). Categories: " + CATEGORIES + ".",
    "UNDERSTAND CASUAL & SPOKEN NAMES (speech-to-text is often imperfect, so match loosely and forgive small errors):",
    "- Our crispy DOSAS are printed as 'Roast': Ghee Roast (gheeroast) = ghee/plain dosa, Paper Roast (paperroast) = paper dosa, Masal Roast (masalroast) = masala dosa, Onion Roast (onionroast) = onion dosa, Podi Roast (podiroast) = podi dosa. Rava Roast (ravaroast) = rava dosa.",
    "- If a guest just says 'dosa' without a type, add Ghee Roast (gheeroast) as a sensible default and tell them they can swap it.",
    "- Map common words: idli/idly -> Idly (idli), vada/vadai -> Vadai (vada), coffee -> Filter Coffee (coffee), tea -> Tea (tea), meals/thali -> South Indian Meals (meals), parotta/porotta -> a parotta item, juice -> a fresh juice.",
    "- Idli and Vadai come in (1) or (2) pieces; for 'two idlis' use the Idly (2) plate, id 'idli'.",
    "ORDERING: When the guest wants to order, ALWAYS act. Add EVERY item you can identify using add actions, handling several dishes and quantities in ONE reply (e.g. 'two idli and one dosa' -> add idli qty 1 AND add gheeroast qty 1). For anything truly unclear, add what you can and ask ONE short follow-up. NEVER say you cannot help — always move the order forward warmly.",
    "To show options the guest asks to see, use a show action with 3-6 relevant ids.",
    "MENU (id | name | price | category):",
    MENU
  ].join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const { message, lang = "en", cart = [] } = await req.json();
    const key = process.env.GEMINI_API_KEY;
    if (!key) return NextResponse.json({ reply: "AI is not configured yet.", actions: [] });
    const body = {
      systemInstruction: { parts: [{ text: systemPrompt(lang) }] },
      contents: [{ role: "user", parts: [{ text: "Current cart (ids): " + (cart.join(", ") || "empty") + "\nGuest says: " + message }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.3, maxOutputTokens: 600,
        responseSchema: { type: "object", properties: { reply: { type: "string" }, actions: { type: "array", items: { type: "object", properties: { type: { type: "string" }, id: { type: "string" }, qty: { type: "number" }, ids: { type: "array", items: { type: "string" } }, name: { type: "string" } }, required: ["type"] } } }, required: ["reply"] } }
    };
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + key, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
    });
    const j = await r.json();
    let out: any = { reply: "Let me help with that — could you tell me again what you'd like?", actions: [] };
    try {
      let txt = (j.candidates?.[0]?.content?.parts?.[0]?.text) || "";
      const s = txt.indexOf("{"), e = txt.lastIndexOf("}");
      if (s >= 0 && e > s) txt = txt.slice(s, e + 1);
      out = JSON.parse(txt);
      if (!Array.isArray(out.actions)) out.actions = [];
    } catch (err) {}
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({ reply: "Something went wrong, please try again.", actions: [] });
  }
}
