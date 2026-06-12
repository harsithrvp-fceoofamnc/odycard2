# Odysra · Annapoorna AI Waiter — Project Journal

> One place for everything about the chatbot: what it is, the services it uses, every file, how it
> works, how to change things, how to fix problems, and a dated log of changes.
> **Whenever you (or anyone) changes the code, add a line at the bottom of the Changelog with the
> date, the file(s), what changed and why.**

Last updated: **12 June 2026**

---

## 1. What this is
An AI waiter chatbot built by **Odysra** for **Sree Annapoorna** (pure-veg South Indian chain, Coimbatore).
A guest opens the page, picks an outlet and language, then browses the menu by tapping, or **talks / types**
to order and explore. It speaks 6 languages, recommends dishes, takes orders into a cart, and (in production)
will hand the order to Annapoorna's billing system. Right now it runs as a **gated demo on odysra.com**.

---

## 2. Live site & access
- **URL:** https://odysra.com  → shows a **6-digit access code screen** → enter the code → the chatbot.
- **Access code:** `654321` (changeable — see §6).
- The old odycard project is **hidden** behind this gate; only the chatbot is shown after unlocking.
- Direct chatbot file (also gated): `/ody/index.html`.

---

## 3. Services & tools used
| What | Service | Notes |
|------|---------|-------|
| Hosting / domain | **Vercel** | Project = `odycard2`, domain = `odysra.com`. Auto-deploys on every `git push`. |
| Source code | **GitHub** | Repo: `github.com/harsithrvp-fceoofamnc/odycard2`, branch `main`. |
| Framework | **Next.js 16.1.1 + React 19 + TypeScript** | App Router (`app/` folder). |
| AI model | **Google Gemini 2.5 Flash** | Called via REST API from the server. Key from **Google AI Studio** (aistudio.google.com). Free tier = 1,500 requests/day. |
| Voice (speech-to-text) | **Browser Web Speech API** | Free, runs on the phone. Best on **Android Chrome**; weak on iPhone/Safari. |
| (Future) iPhone voice fallback | Sarvam / Bhashini | Not added yet. |
| (Future) Ordering / payment | Annapoorna's own self-order/POS | Not integrated yet — cart + payment are currently mocked. |

### Environment variables (set in Vercel → odycard2 → Settings → Environment Variables)
| Name | Purpose | Required |
|------|---------|----------|
| `GEMINI_API_KEY` | The Gemini API key. Server-side only — never reaches the browser. | **Yes** (AI won't work without it) |
| `GATE_CODE` | The access code. If not set, defaults to `499853`. | Optional |

> After changing any env var in Vercel, **redeploy** so it takes effect.

---

## 4. File map (what each file does)
**The chatbot (front-end):**
- `public/ody/index.html` — **the live chatbot** served on odysra.com. Self-contained (HTML + CSS + JS + base64 logo).
- `annapoorna_chatbot_alltime.html` — standalone bot, **shows all dishes any time** (for local testing). Same code, `TIME_FILTER = false`.
- `annapoorna_chatbot_timed.html` — standalone bot, **time-aware menu** (`TIME_FILTER = true`).
- `annapoorna_chatbot_demo.html` — **the template/source.** All UI logic lives here. The generator copies it and injects the menu to make the 3 files above + the API route.
- `odybot_deploy/index.html` — a copy for quick Netlify-Drop hosting (alternative to Vercel).

**The AI back-end:**
- `app/api/ody/route.ts` — **the AI endpoint** (`/api/ody`). Receives the guest's message + language + cart, sends it to Gemini grounded on the full menu, and returns `{reply, actions}`. The menu and the prompt live here.

**The access gate:**
- `middleware.ts` — runs on every request; blocks everything until the code is entered, then serves only the chatbot.
- `app/gate/page.tsx` — the 6-digit code screen.
- `app/api/gate/route.ts` — checks the code **on the server** and sets a secure cookie (valid 12 h).

**Tooling / docs:**
- `scripts/build_menu.js` — **the menu generator** (single source of truth for the menu — 188 dishes). Run `node scripts/build_menu.js` from the repo root to regenerate `annapoorna_chatbot_timed.html`, `annapoorna_chatbot_alltime.html`, `public/ody/index.html`, and `app/api/ody/route.ts`.
- `DEPLOY_GUIDE.md` — how to deploy + get the Gemini key.
- `dish_photo_checklist.md` — filenames to use when adding real dish photos.
- `PROJECT_JOURNAL.md` — this file.

> Note: the old `odycard2` app (owner/hotel pages, Firebase, etc.) still exists in the repo but is hidden by the gate and unrelated to the chatbot.

---

## 5. How it works (the flow)
1. Guest opens **odysra.com** → `middleware.ts` shows the **code screen** (`app/gate`).
2. Enters `499853` → `app/api/gate` verifies it, sets a cookie → the **chatbot** loads.
3. Guest picks **outlet** and **language**, sees a waiter greeting + time-based specials.
4. **Browsing by tapping** (categories → dishes → add) uses **no AI = free**.
5. **Typing or voice:**
   - Mic is a **toggle** — tap to start; spoken words appear **live in the input bar**; tap again to stop; edit if needed; press **Send**.
   - The message goes to **`/api/ody`** → **Gemini** (grounded on the menu) → returns a reply + actions (add to cart / show dishes / open category) → the chat shows the reply and runs the actions.
   - If the API can't be reached (e.g. opening a local file), it falls back to a simple built-in keyword responder.
6. Cart → choose dine-in/takeaway → table → AC/non-AC → tax → name + number of persons + phone → "pay" (mocked) → WhatsApp bill (mocked).

---

## 6. How to make common changes (runbook)
- **Change a dish, price, timing, or add/remove a dish:** edit the `groups` data near the top of `scripts/build_menu.js`, then run `node scripts/build_menu.js`, then `git push`. (This keeps the chatbot and the AI's menu in sync — they're both generated from this file.)
- **Switch which bot is live (all-day vs time-aware):** `public/ody/index.html` is currently the **all-day** copy. To make it time-aware, in `scripts/build_menu.js` change the `copyFileSync(... "annapoorna_chatbot_alltime.html" ...)` to the `timed` file, regenerate, push.
- **Change the AI's behaviour / personality / rules:** edit `systemPrompt()` in `app/api/ody/route.ts` (or in `scripts/build_menu.js`, which generates it).
- **Add a dish nickname the AI should understand** (e.g. another word for a dosa): add it to the "UNDERSTAND CASUAL & SPOKEN NAMES" lines in the prompt in `scripts/build_menu.js`, regenerate, push.
- **Change the access code:** add/edit `GATE_CODE` in Vercel env vars, then redeploy. (Or change the default in `app/api/gate/route.ts`.)
- **Change the AI model:** in `app/api/ody/route.ts`, change `gemini-2.5-flash` in the fetch URL (e.g. to `gemini-2.5-flash-lite`).
- **Deploy any change:** `cd ~/odycard2 && git add . && git commit -m "..." && git push` → Vercel auto-deploys.

---

## 7. Troubleshooting
| Symptom | Likely cause | Fix |
|--------|--------------|-----|
| AI gives only fixed canned replies (not conversational) | `GEMINI_API_KEY` missing or deploy didn't pick it up | Set it in Vercel env vars → redeploy. |
| AI keeps saying "Let me help… could you tell me again" | Gemini call failing — wrong/expired key, free-tier daily limit (1,500/day) hit, or model name issue | Check the key in AI Studio; wait/upgrade if over limit; confirm model name in `route.ts`. |
| Voice doesn't work / no mic | Not HTTPS, or iPhone/Safari, or mic permission denied | Use the live HTTPS site on **Android Chrome**, allow the mic. iPhone is limited by design. |
| Voice mis-hears dish names | Browser STT limitation | Speak in the selected language; edit the text before Send; the AI also forgives small errors. If a specific dish is always wrong, add its nickname to the prompt (§6). |
| AI orders the wrong dish for a spoken word | Missing alias | Add the alias to the prompt in `scripts/build_menu.js` (e.g. "X means our Y"), regenerate, push. |
| Cart / "View cart" won't open | A bad/old dish id referenced in code | Check the browser console; make sure every id used exists in the menu. |
| Old odycard project shows instead of chatbot | Gate not deployed or cookie present from before | Confirm `middleware.ts` deployed; clear cookies; open odysra.com fresh. |
| Changes not showing live | Deploy didn't run or browser cached | Confirm the Vercel deployment is "Ready"; hard-refresh / clear cache. |

---

## 8. Costs
- **Gemini:** free tier = ₹0 (1,500 requests/day). Paid later ≈ ₹0.06–0.17 per AI message. Tap-browsing uses **no** AI calls.
- **Voice (browser STT):** free.
- **Hosting (Vercel):** free tier is fine for the demo.
- ⚠️ On the **free** Gemini tier, Google may use prompts to improve their models — fine for the demo, but **switch to the paid tier before going live with real customer names/phone numbers.**

---

## 9. Known limitations / TODO (not done yet)
- Cart → **real order/POS** handoff to Annapoorna's billing system — not built (currently mocked).
- **Payment** and **WhatsApp bill** — mocked.
- Dish **names/descriptions in non-English** for the ~188 bulk items — currently English (only core items translated). Production = Gemini translates live.
- **Dish photos** — placeholders (emojis) until real photos are added (see `dish_photo_checklist.md`).
- **iPhone voice fallback** (Sarvam/Bhashini) — not added.
- Move Gemini from **free → paid** tier before real-customer launch.

---

## 10. Changelog (newest first — add an entry for every change)

### 12 Jun 2026
- **Access code changed** from `499853` to `654321` (`app/api/gate/route.ts`).
- **Order confirmation step added**: when the AI adds items from a voice/text order, it now asks "Shall I confirm your order?" with **Yes / No** buttons; **Yes** opens the cart. (`askOdy`/`runActions`/`confirmOrder` in the bot template.)
- **AI ordering fixes** (`app/api/ody/route.ts` via `scripts/build_menu.js`): taught the AI that "dosa" = the menu's "Roast" items and other spoken/casual names; made it always act on an order (add what it understands, never refuse); added a strict JSON response schema + safer parsing; lowered temperature. *Why: voice order "two idli and one dosa" was being refused because "dosa" isn't a literal menu name.*
- **Access-code gate added** (`middleware.ts`, `app/gate/page.tsx`, `app/api/gate/route.ts`): whole site now locked behind code `499853`; old project hidden. *Why: security + hide the old odycard app.*
- **Live AI integration deployed**: `/api/ody` (Gemini 2.5 Flash, free tier) wired to the chat; voice + typed messages now use real AI on odysra.com. Added `GEMINI_API_KEY` env var in Vercel.
- **Voice upgraded to a toggle**: tap mic → words appear live in the input bar → tap to stop → Send. (`recordVoice`/`stopVoice` in the bot.)
- **Cart bug fixed**: "View cart" was crashing because of two old dessert ids (`gulab`, `kesari`) not in the real menu — recommendation/keyword logic now skips any id that isn't on the menu.

### 11 Jun 2026
- **Full Annapoorna menu loaded** (188 dishes, prices, serving times) from the printed menu photos; built two versions — time-aware (`annapoorna_chatbot_timed.html`) and all-day (`annapoorna_chatbot_alltime.html`) — via `scripts/build_menu.js`. Replaced the earlier 21-item sample menu.
- Bill shown in **English** even when the menu is in another language (avoids billing confusion); dish blocks grow for longer translated names; party-size question added at checkout; cart "You might also like" recommendations added; outlet logo moved to bottom; back-to-outlet button added; outlet page localizes on language change; dish descriptions translate per language.

### 10 Jun 2026
- Built the **prototype chatbot** (`annapoorna_chatbot_demo.html`): outlet picker, time-based specials, tap-to-browse categories/sub-categories with photo grid + add, cart-aware drink upsell, dine-in/takeaway → table → AC/non-AC tax, name/phone, mocked pay + WhatsApp bill, restaurant info, banquet enquiry, 6-language UI with transliterated dish names, full-screen mobile layout, one-by-one chat reveal.

---
*Maintained for Odysra. Keep this file updated — it's the first place to look when something goes wrong.*
