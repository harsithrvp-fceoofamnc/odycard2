# Deploy the Annapoorna AI Waiter on odysra.com (with free Gemini)

I've already added two things to your project:
- **`app/api/ody/route.ts`** — a secure serverless endpoint that calls Gemini. Your API key stays on the server; the browser never sees it.
- **`public/ody/index.html`** — the chatbot page. It will be live at **odysra.com/ody/**.

The chat's free-text **and voice** both send to this endpoint, grounded on the full Annapoorna menu. No new npm packages are needed (it uses Gemini's REST API).

---

## Step 1 — Get a FREE Gemini API key (2 min, no credit card)
1. Go to **https://aistudio.google.com**
2. Sign in with a Google account
3. Click **Get API key → Create API key**
4. **Copy** the key (looks like `AIza...`)

Free tier = 1,500 requests/day, plenty for the demo.
*(Note: on the free tier Google may use prompts to improve their models — fine for a demo with test data; switch to the paid tier before going live with real customer info.)*

## Step 2 — Add the key to Vercel
1. Go to **vercel.com** → open your **odycard2** project
2. **Settings → Environment Variables**
3. Add a new variable:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** *(paste your key)*
   - **Environments:** tick Production, Preview, Development
4. **Save**

## Step 3 — Deploy
Pick whichever you use:
- **Git:** commit and push your `odycard2` repo → Vercel auto-deploys.
  ```
  git add .
  git commit -m "Add Ody AI waiter (chatbot + /api/ody)"
  git push
  ```
- **Vercel CLI:** from the `odycard2` folder, run `vercel --prod`
- **Dashboard:** open the project → **Deployments → Redeploy**

*(If you changed env vars, trigger a fresh deploy so they take effect.)*

## Step 4 — Test the voice ordering
1. On an **Android phone in Chrome**, open **https://odysra.com/ody/**
   *(if that 404s, try `https://odysra.com/ody/index.html`)*
2. Pick a **language** (top bar) and an **outlet**
3. Tap the **🎙️ mic** → **speak** → your words appear live in the "Ask me anything" bar
4. Tap the **🎙️ again to stop**, read/edit the text, then tap **➤ Send**
5. The AI replies and acts — e.g. *"add two idli and a filter coffee"* adds them to the cart; *"show me the dosa varieties"* displays them; *"what's good for breakfast?"* recommends.

---

## Good to know
- **Voice works best on Android + Chrome.** On iPhone/Safari the browser's speech-to-text is limited — that's the case the paid Sarvam fallback would handle in production. Don't judge voice quality from an iPhone test.
- **If the AI doesn't respond** (only keyword answers): the key isn't set or the deploy didn't pick it up. Re-check Step 2 and redeploy.
- **Cost:** ₹0 on the free tier. When you move to paid, it's the same code — just enable billing on the key.
- **Local demo files** (`annapoorna_chatbot_timed.html`, `annapoorna_chatbot_alltime.html`) still work offline with the simple keyword AI (no key needed) — handy for showing the UI without internet.
