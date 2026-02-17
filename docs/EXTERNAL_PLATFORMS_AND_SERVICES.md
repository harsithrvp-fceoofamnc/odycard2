# External Platforms & Services Analysis

---

## 1. DEPLOYMENT CONFIGURATION

| Config Type | Present? | Location |
|-------------|----------|----------|
| **Vercel** | No | No `vercel.json`, no `.vercel` directory |
| **Render** | No | No `render.yaml` or Render-specific config files |
| **Netlify** | No | No `netlify.toml` or `netlify.json` |
| **Dockerfile** | No | No Docker configuration |
| **Procfile** | No | No Procfile found |

**Conclusion:** No formal deployment configuration files were found in the project.

---

## 2. WHERE FRONTEND AND BACKEND ARE DEPLOYED

### Frontend

- **Config:** None — no `vercel.json`, Netlify config, or other deployment files found.
- **Evidence:** `app/owner/success/page.tsx` hardcodes `https://odysra.com` as the public hotel page URL for QR codes.
- **Conclusion:** Frontend is likely deployed at **odysra.com**, but the hosting platform (Vercel, Netlify, custom, etc.) is not specified in the repo.

### Backend

- **Config:** None — no `render.yaml`, Procfile, Dockerfile, or similar.
- **Evidence:** `backend/` has its own `.git` directory (separate repo), suggesting it may be deployed as a standalone service.
- **Conclusion:** Backend deployment target is unknown. It could run on Render, Railway, Fly.io, or a custom server. Backend uses `PORT` (5050) and connects to Supabase for the database.

---

## 3. THIRD-PARTY SERVICES INTEGRATED

### Active integrations

| Service | Purpose | Where Used |
|---------|---------|------------|
| **Supabase** | PostgreSQL database | `backend/db.js` — connects via `DATABASE_URL` to Supabase PostgreSQL (pooler at `*.supabase.com`). Console log confirms "Connected to Supabase PostgreSQL". |
| **odysra.com** | Production base URL | Hardcoded in `app/owner/success/page.tsx` for the public hotel page URL in QR codes. |

### Dependencies present but not used in code

| Package | Location | Status |
|---------|----------|--------|
| **cloudinary** | Root `package.json` | Listed as dependency but **never imported or used** in any file. Likely intended for future image/media hosting. |
| **multer** | Root `package.json` | Listed as dependency but **never imported or used** in backend or frontend. Likely intended for future file upload handling. |

### Backend dependencies

- **pg** — PostgreSQL client, used to connect to Supabase
- **express**, **cors**, **dotenv** — core server stack

---

## 4. ENVIRONMENT VARIABLES

| Variable | Used In | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | Frontend (`lib/api.ts`, `app/hotel/[restaurantId]/page.tsx`) | Base URL for backend API. Default fallback: `http://localhost:5050`. |
| `DATABASE_URL` | Backend (`backend/db.js`) | Supabase PostgreSQL connection string. |
| `PORT` | Backend (`backend/index.js`) | Server port; default 5050. |

---

## 5. SUMMARY

| Category | Finding |
|---------|---------|
| **Deployment config** | None found — no Vercel, Render, Netlify, Docker, or Procfile configuration. |
| **Frontend deployment** | Likely **odysra.com** (hardcoded in success page); hosting platform unspecified. |
| **Backend deployment** | Unknown; backend may be deployed separately. |
| **Database** | **Supabase** (PostgreSQL). |
| **Used external services** | Supabase (database), odysra.com (production URL). |
| **Unused packages** | Cloudinary, multer — in dependencies but not referenced in code. |
| **QR code URLs** | Success page: `https://odysra.com/hotel/{id}`. QR page uses `window.location.origin` (dynamic). |
