# OdyCard2 - Complete Project Structure Overview

---

## 1. FULL FOLDER STRUCTURE (TREE)

```
odycard2/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── hotel/
│   │   └── [restaurantId]/
│   │       └── page.tsx
│   └── owner/
│       ├── dashboard/page.tsx
│       ├── details/page.tsx
│       ├── details2/page.tsx
│       ├── edit-cover/page.tsx
│       ├── edit-logo/page.tsx
│       ├── login/page.tsx
│       ├── otp/page.tsx
│       ├── payment/page.tsx
│       ├── qr/page.tsx
│       ├── start/page.tsx
│       ├── success/page.tsx
│       └── hotel/
│           └── [restaurantId]/
│               ├── edit-menu/page.tsx
│               ├── add-dish/page.tsx
│               ├── add-dish/dish-details/page.tsx
│               └── add-dish/visuals/page.tsx
├── components/
│   ├── OdyLoader.tsx
│   ├── ProgressBar.jsx
│   └── dish/
│       └── EditMenuDishBlock.tsx
├── context/
│   └── LoaderContext.tsx
├── lib/
│   └── api.ts
├── pages/
│   └── EditMenu/
│       ├── EditMenuDetailsPage.jsx
│       ├── EditMenuTypePage.jsx
│       └── EditMenuUploadPage.jsx
├── public/
├── backend/
│   ├── index.js
│   ├── db.js
│   └── migrations/
│       ├── 001-create-hotels.sql
│       ├── 002-add-cover-original-url.sql
│       └── add-dish-columns.sql
└── docs/
```

---

## 2. ALL FILES IN KEY DIRECTORIES

### app/

| File | Purpose |
|------|---------|
| layout.tsx | Root layout; wraps children with LoaderProvider |
| page.tsx | Home/landing page |
| globals.css | Global CSS styles |
| hotel/[restaurantId]/page.tsx | Customer menu (QR target page) |
| owner/dashboard/page.tsx | Owner dashboard |
| owner/details/page.tsx | Signup step 1 (restaurant details form) |
| owner/details2/page.tsx | Signup step 2 (logo + cover photo) |
| owner/edit-cover/page.tsx | Edit cover photo |
| owner/edit-logo/page.tsx | Edit logo |
| owner/login/page.tsx | Owner login |
| owner/otp/page.tsx | OTP verification |
| owner/payment/page.tsx | Payment |
| owner/qr/page.tsx | View & download QR code |
| owner/start/page.tsx | Owner onboarding start |
| owner/success/page.tsx | Post-signup success + QR |
| owner/hotel/[restaurantId]/edit-menu/page.tsx | Edit menu |
| owner/hotel/[restaurantId]/add-dish/page.tsx | Add dish (category selection) |
| owner/hotel/[restaurantId]/add-dish/dish-details/page.tsx | Add dish (details form) |
| owner/hotel/[restaurantId]/add-dish/visuals/page.tsx | Add dish (photo/video) |

### components/

| File | Purpose |
|------|---------|
| OdyLoader.tsx | Loading overlay/spinner component |
| ProgressBar.jsx | Progress bar component |
| dish/EditMenuDishBlock.tsx | Reusable dish block for edit menu |

### context/

| File | Purpose |
|------|---------|
| LoaderContext.tsx | LoaderProvider, useLoader hook, showLoader/hideLoader |

---

## 3. FRAMEWORK & TECH STACK

| Item | Answer |
|------|--------|
| Next.js Router | **App Router** (primary) - all main routes under `app/` |
| Legacy | `pages/EditMenu/` contains legacy Pages Router files (EditMenuDetailsPage, EditMenuTypePage, EditMenuUploadPage) - likely unused |
| Language | **TypeScript** (`.tsx`) for App Router; some legacy files are `.jsx` |
| Backend | Node.js + Express in `backend/` |
| Database | PostgreSQL via Supabase (`pg` package, connection in `backend/db.js`) |

---

## 4. LOGO UPLOAD LOGIC

### Where it exists:
- **app/owner/details2/page.tsx** — `handleLogoUpload` (line ~81): signup flow logo
- **app/owner/edit-logo/page.tsx** — `handleNewUpload` (line ~86), `handleEditCurrent` (line ~79): edit existing logo

### Flow:
1. User selects file → opens Cropper (react-easy-crop)
2. User crops → clicks "Done" → `saveCrop` stores cropped base64 in state (and localStorage in details2)
3. **Only on final Submit/Save** → PATCH sent to `PATCH /api/hotels/:id` with `logo_url`

### Timing: **Only on final submit** (not immediately on file select)

---

## 5. COVER PHOTO UPLOAD LOGIC

### Where it exists:
- **app/owner/details2/page.tsx** — `handleCoverUpload` (line ~92), `handleEditCover` (line ~109): signup flow cover
- **app/owner/edit-cover/page.tsx** — `handleCoverUpload` (line ~106), `handleEditCurrent` (line ~121): edit existing cover

### Flow:
1. User selects file OR clicks Edit → cropper opens (loads `cover_original_url` if available, else `cover_url`)
2. User crops → clicks "Done" → `saveCrop` stores cropped base64
3. **Only on final Submit/Save** → PATCH sent with `cover_url` (and `cover_original_url` for new file uploads)

### Database fields:
- `cover_url` — cropped image (display)
- `cover_original_url` — full original image (for re-cropping)

### Timing: **Only on final submit** (not immediately on file select)

---

## 6. DETAILS2 PAGE

- **Path:** app/owner/details2/page.tsx
- **Route:** /owner/details2
- **Purpose:** Signup step 2 — restaurant logo (required) + cover photo (optional). Uses Cropper for both. On submit: POST hotel, then PATCH logo + cover (base64). Stores `ody_hotel_id`, `restaurantId` (slug), `restaurantName` in localStorage.

---

## 7. QR GENERATION LOGIC

### Where it exists:
- **app/owner/qr/page.tsx** — Uses `QRCodeCanvas` from `qrcode.react`
- **app/owner/success/page.tsx** — Same QR generation post-signup

### Flow:
- Reads `restaurantId` from localStorage
- QR value = `{window.location.origin}/hotel/{restaurantId}`
- Download via canvas `toDataURL("image/png")` + create & click `<a download>`

### Package: `qrcode.react` (in package.json)

---

## 8. DATABASE SETUP

### Supabase connection:
- **File:** backend/db.js
- Uses `pg` (node-postgres) Pool
- Connection via `process.env.DATABASE_URL` (from .env)
- Connects to Supabase PostgreSQL (AWS)

### API routes (backend/index.js):
- GET /
- POST /api/hotels — create hotel
- GET /api/hotels/:slug — fetch hotel by slug
- PUT /api/hotels/:id — update hotel (name, logo, coverImage)
- PATCH /api/hotels/:id — update hotel (name, logo_url, cover_url, cover_original_url)
- PATCH /api/hotels/slug/:slug — update by slug
- GET /api/dishes?hotel_id= — fetch dishes
- POST /api/dishes — add dish

### API base URL:
- lib/api.ts exports `API_BASE` = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050"

---

## 9. LOADERCONTEXT

### Exists: YES
- **File:** context/LoaderContext.tsx
- **Exports:** LoaderProvider, useLoader
- **Methods:** showLoader(), hideLoader()
- **Renders:** OdyLoader component when loading = true

### Wrapped in layout.tsx: YES
- app/layout.tsx wraps `{children}` with `<LoaderProvider>`
- Properly integrated at root level

---

## 10. RECENT IMPLEMENTATION SUMMARY

1. **Cover photo editing:** Original + cropped stored separately (`cover_original_url`, `cover_url`). Edit cover loads original for re-cropping.
2. **Backend:** cover_original_url column added; POST/PATCH routes accept it.
3. **PUT /api/hotels/:id** added for name, logo, coverImage.
4. **details2** sends both cover_url and cover_original_url on first upload.
5. **edit-cover** loads cover_original_url when available; new crop updates only cover_url; new file updates both.
6. **Database:** PostgreSQL (Supabase), not SQLite. Reset via SQL: `TRUNCATE dishes CASCADE; TRUNCATE hotels CASCADE;`

---

## 11. PACKAGE DEPENDENCIES (package.json)

- next, react, react-dom
- framer-motion, qrcode.react, react-easy-crop
- cloudinary, multer
- TypeScript, Tailwind, ESLint

Backend: express, cors, dotenv, pg
