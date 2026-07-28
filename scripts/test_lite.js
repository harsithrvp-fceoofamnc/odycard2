// Quick test for Gemini 2.5 Flash-Lite on real Tamil / Tanglish waiter inputs.
// Run:  GEMINI_API_KEY=your_key_here node scripts/test_lite.js
// Compare with Flash:  GEMINI_API_KEY=... GEMINI_MODEL=gemini-2.5-flash node scripts/test_lite.js

const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
if (!KEY) { console.error("Set GEMINI_API_KEY first."); process.exit(1); }

const system = [
  "You are the warm AI server for Bon Bon, an ice cream parlour.",
  "Understand the guest even in Tamil, Tanglish (Tamil in English letters), Hindi or Malayalam.",
  "Reply in the SAME language the guest used. Be warm, 1-2 short sentences.",
  "Respond ONLY as JSON: {\"reply\":\"...\",\"actions\":[{\"type\":\"add|show|none\"}]}",
  "Menu (id | name): coffeescoop | Filter Coffee Scoop; choco | Death by Chocolate; mangokulfi | Mango Kulfi; butterscotch | Butterscotch Scoop; waffle | Belgian Waffle",
].join("\n");

const tests = [
  "Enakku ippo enna venam? Adavathu nalla sooda adha sollu.",   // Tanglish
  "enakku edhachu kaaramma sollu",                               // Tanglish (from your screenshot)
  "oru chocolate scoop kudunga",                                 // Tanglish order
  "I want something cold and chocolatey",                        // English
  "mujhe kuch thanda chahiye",                                   // Hindi
];

async function ask(msg) {
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: msg }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3, maxOutputTokens: 400, thinkingConfig: { thinkingBudget: 0 },
      responseSchema: { type: "object", properties: { reply: { type: "string" }, actions: { type: "array", items: { type: "object", properties: { type: { type: "string" } }, required: ["type"] } } }, required: ["reply"] },
    },
  };
  const t0 = Date.now();
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const ms = Date.now() - t0;
  const j = await r.json();
  if (!r.ok || j.error) return { ok: false, ms, err: (j.error && j.error.message) || r.status };
  const raw = j.candidates?.[0]?.content?.parts?.[0]?.text || "";
  let parsed = null, jsonOk = true;
  try { parsed = JSON.parse(raw); } catch { jsonOk = false; }
  return { ok: true, ms, jsonOk, reply: parsed?.reply || raw };
}

(async () => {
  console.log(`\nModel: ${MODEL}\n${"=".repeat(50)}`);
  for (const msg of tests) {
    const res = await ask(msg);
    console.log(`\n👤  ${msg}`);
    if (!res.ok) { console.log(`   ❌ error (${res.ms}ms): ${res.err}`); continue; }
    console.log(`   🤖  ${res.reply}`);
    console.log(`   ${res.jsonOk ? "✅ valid JSON" : "⚠️  JSON PARSE FAILED"}  ·  ${res.ms}ms`);
  }
  console.log("\n" + "=".repeat(50));
  console.log("If replies stay in the guest's language and JSON is always valid → Lite is fine.");
  console.log("If you see JSON PARSE FAILED or English replies to Tamil → keep the waiter on Flash.\n");
})();
