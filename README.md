# Odysra

Odysra is an **AI Waiter / smart-menu platform** for restaurants. A customer scans a QR
code, chats with an AI that knows the full menu (in 6 languages, with voice input), and
orders — while the restaurant manages everything from a set of role-based dashboards
(owner, supervisor, kitchen, waiter).

Live: **odysra.com** · Stack: **Next.js 16 / React 19 / TypeScript**, Firebase/Firestore,
Google Gemini (chat AI), Sarvam (speech-to-text), Cloudinary (images), deployed on Vercel.

> This is a **Next.js app**, so the framework folders (`app/`, `lib/`, `public/`) must live
> at the repo root. Use the map below to find your way around.

---

## Where things live (repo map)

### The AI chatbots (what customers see)
The chatbot is one self-contained HTML template that gets "compiled" into a branded copy
per restaurant by the build scripts.

| File / folder | What it is |
|---|---|
| `annapoorna_chatbot_demo.html` | The **master chatbot template** (all UI + logic). Edit this, then rebuild. |
| `scripts/build_bonbon.js` | Builds the **Bon Bon** ice-cream bot → `public/bonbon/index.html` |
| `scripts/build_menu.js` | Builds the **Sree Annapoorna** bot → `public/ody/index.html` |
| `scripts/build_restaurant.js` | Builds the **white-label** demo bot → `public/restaurant/index.html` |
| `scripts/bonbonMenuData.js` | Single source of truth for the Bon Bon menu (used by build + seed) |
| `public/bonbon/` · `public/ody/` · `public/restaurant/` | The built chatbots that get served |
| `app/bon-bon/page.tsx` · `app/annapoorna/page.tsx` · `app/restaurant/page.tsx` | Next.js pages that host each chatbot |

### The AI + APIs (server side)
| Folder | What it is |
|---|---|
| `app/api/bonbon/` | Bon Bon: chat AI, menu, orders, staff, outlets, auth |
| `app/api/ody/` | Sree Annapoorna chat AI |
| `app/api/stt/` · `app/api/stt-key/` | Speech-to-text (Sarvam) |
| `app/api/upload/` | Image upload (Cloudinary) |
| `lib/bonbon.ts` · `lib/bonbonMenu.ts` | Bon Bon auth + data helpers |
| `lib/firebase.ts` · `lib/auth.ts` | Firestore admin + session/auth helpers |

### The dashboards (what staff see)
| Route | Who |
|---|---|
| `app/bon-bon/admin/` | Owner — sales, staff, restaurants & outlets, tables |
| `app/bon-bon/manage/` | Supervisor — menu editor (prices, photos, sold-out, best-seller) |
| `app/bon-bon/kitchen/` | Kitchen — live order board |
| `app/bon-bon/waiter/` | Waiter — ready orders to serve |
| `app/bon-bon/login/` · `app/bon-bon/_ui.tsx` | Staff login + shared dashboard UI |

### Other
| Folder | What it is |
|---|---|
| `prototypes/` | Throwaway design mockups & experiments (not part of the live app) |
| `public/demos/` | Standalone kitchen/waiter operation demos |
| `middleware.ts` | Access-code gate + staff-session routing |
| `PROJECT_JOURNAL.md` | Running dev log of what changed and why |
| `*.pdf`, `*.pptx`, `*.docx` (root) | Pitch decks, reports, formulas (planning docs) |

---

## Run it locally

```bash
npm install
npm run dev          # http://localhost:3000
```

Rebuild a chatbot after editing the template:

```bash
node scripts/build_bonbon.js       # Bon Bon
node scripts/build_menu.js         # Annapoorna
node scripts/build_restaurant.js   # white-label
```

Environment variables (set in `.env.local`, and on Vercel for production): Firebase service
account + public config, `GEMINI_API_KEY`, `SARVAM_API_KEY`, `SESSION_SECRET`, Cloudinary
keys, and the Bon Bon admin login (`BONBON_ADMIN_USER` / `BONBON_ADMIN_PASS`).
