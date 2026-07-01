// Emits lib/bonbonMenuSeed.json — the real Bon Bon menu the dashboards seed into Firestore
// on first run. Regenerate after any menu change:  node scripts/gen_bonbon_seed.js
const fs = require("fs");
const path = require("path");
const { seedDocs } = require("./bonbonMenuData.js");
const ROOT = path.resolve(__dirname, "..");
const docs = seedDocs();
fs.writeFileSync(path.join(ROOT, "lib", "bonbonMenuSeed.json"), JSON.stringify(docs, null, 2) + "\n");
console.log("WROTE lib/bonbonMenuSeed.json — items:", docs.length);
