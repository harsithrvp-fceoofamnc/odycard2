# OdyCard Frontend – Backend Integration Analysis

This document provides a structured breakdown of all frontend features, data flows, and backend API requirements for OdyCard.

---

## 1. IMPLEMENTED PAGES AND FLOWS

### 1.1 Customer-Facing (Public)

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Splash | Animated splash → auto-redirect to `/owner/start` after 4s |
| `/hotel/[restaurantId]` | Hotel / Customer Menu | Main QR menu page with Ody Menu, Menu, Eat Later, Favorites tabs |

### 1.2 Owner Onboarding & Auth

| Route | Page | Purpose |
|-------|------|---------|
| `/owner/start` | Start | Mobile number input → navigates to OTP (no backend) |
| `/owner/login` | Login | Mobile + password → navigates to OTP (no backend) |
| `/owner/otp` | OTP Verification | 4-digit OTP entry, timer, resend (mock verification) |
| `/owner/details` | Restaurant Details | Multi-field form → saves to localStorage → `/owner/details2` |
| `/owner/details2` | Logo & Cover | Logo (required) + cover (optional) upload with crop → `/owner/success` |
| `/owner/success` | Success | QR code + download, links to dashboard |
| `/owner/payment` | Payment | Plan card (₹399/mo), "Start 14-Day Free Trial" → dashboard |

### 1.3 Owner Dashboard & Management

| Route | Page | Purpose |
|-------|------|---------|
| `/owner/dashboard` | Dashboard | Welcome, Edit Menu, QR, Avg Rating (—), Videos (0), Total Items (0), Leaderboard, Highlights, To Improve |
| `/owner/hotel/[restaurantId]/edit-menu` | Edit Menu | Ody Menu + Menu tabs, dish blocks, Add dish, category management |
| `/owner/hotel/[restaurantId]/add-dish` | Add Dish – Type | Select food_item / dessert / beverage → visuals |
| `/owner/hotel/[restaurantId]/add-dish/visuals` | Add Dish – Visuals | Photo upload + crop, YouTube video link → dish-details |
| `/owner/hotel/[restaurantId]/add-dish/dish-details` | Add Dish – Details | Name, veg/nonveg, price, quantity, description, timing → saves to localStorage |
| `/owner/edit-logo` | Edit Logo | Crop and save logo to localStorage |
| `/owner/edit-cover` | Edit Cover | Crop and save/remove cover to localStorage |
| `/owner/qr` | View QR | Display QR for `{origin}/hotel/{restaurantId}` |

---

## 2. UI FEATURES REQUIRING BACKEND SUPPORT

| Feature | Location | Current State | Backend Need |
|---------|----------|---------------|--------------|
| **Dish CRUD** | Edit Menu, Add Dish flow | localStorage `ody_dishes` | Persist dishes to DB |
| **Hotel/Restaurant Info** | Customer page, Edit Menu | localStorage: `restaurantName`, `restaurantLogo`, `restaurantCover`, `restaurantId` | Hotels table + media storage |
| **Favorites** | Customer – heart icon | localStorage `ody_favorites` | Per-user favorites |
| **Eat Later** | Customer – eat_later icon | localStorage `ody_eat_later` | Per-user eat-later list |
| **Favorite/Eat Later counts** | Dish blocks, Edit Menu | localStorage `ody_dish_favorite_counts`, `ody_dish_eat_later_counts` | Aggregate counts per dish |
| **Customer auth** | Register/Login popup | localStorage `odyUser`, `odyUsers` | User table, OTP, session |
| **Owner auth** | Start, Login, OTP | No persistence | Owner auth, OTP |
| **Owner restaurant setup** | Details, Details2 | localStorage | Hotels + owners |
| **Categories** | Edit Menu – Menu tab | Local state only | Categories table |
| **Search** | Customer – Menu tab | Local `search` state, no API | Search/filter dishes |
| **Filters** | Customer – Menu tab | Local `activeFilters` (Veg Only, Non-Veg Only, etc.) | Filter by dish attributes |
| **Leaderboard / Highlights / To Improve** | Dashboard | Placeholder text | Ratings/analytics |
| **Avg Rating, Videos, Total Items** | Dashboard | Hardcoded "—", "0" | Aggregates from DB |
| **Ratings (with reason)** | Payment page mentions | Not implemented in UI | Ratings table + low-rating reason |

---

## 3. DATA FIELDS CAPTURED IN FORMS

### 3.1 Restaurant Details (`/owner/details`)

| Field | Key | Type | Validation |
|-------|-----|------|------------|
| Restaurant Name | `restaurantName` | string | Required |
| User Name | `userName` | string | Required |
| State | `state` | string | Required |
| City | `city` | string | Required |
| Restaurant ID | `restaurantId` | string | Required |
| Gmail | `gmail` | string | Must end with @gmail.com |
| Password | `password` | string | Required |
| Re-enter Password | `rePassword` | string | Must match password |

**Currently saved to localStorage:** `userName`, `restaurantName`, `restaurantId` only.

### 3.2 Add Dish – Type (`/owner/add-dish`)

| Field | Key | Options |
|-------|-----|---------|
| Dish type | `addDishType` | `food_item` \| `dessert` \| `beverage` |

### 3.3 Add Dish – Visuals (`/owner/add-dish/visuals`)

| Field | Key | Notes |
|-------|-----|-------|
| Cropped photo | `addDishPhoto` | Base64 data URL |
| YouTube video ID | `addDishVideoId` | Extracted from URL |

### 3.4 Add Dish – Details (`/owner/add-dish/dish-details`)

| Field | In StoredDish | Type | Validation |
|-------|---------------|------|------------|
| Dish name | `name` | string | Required |
| Veg / Non-Veg | **Not persisted** | `veg` \| `nonveg` | Required for non-drinks |
| Price | `price` | number | Required |
| Quantity | `quantity` | string \| null | Optional |
| Description | `description` | string \| null | Optional |
| Timing from | `timing.from` | string | Default "09:00" |
| Timing to | `timing.to` | string | Default "22:00" |
| Photo URL | `photoUrl` | string | From visuals step |
| Video URL | `videoUrl` | string \| null | From visuals step |

**Note:** `vegType` is collected for validation but is **not** included in the dish object saved to localStorage. Backend `dishes` table has `is_veg`; frontend needs to map and persist it.

### 3.5 Customer Register/Login (in-page popup)

| Field | Key | Type |
|-------|-----|------|
| Phone | — | 10 digits |
| OTP | — | 4 digits |
| Name | — | string (register only) |

**Stored:** `odyUser` (JSON: `{ phone, name }`), `odyUsers` (array of mock users).

---

## 4. TOGGLES AND LOCALLY MANAGED STATE

### 4.1 Customer Menu Page (`/hotel/[restaurantId]`)

| State | Purpose |
|-------|---------|
| `activeTab` | Ody Menu (0), Menu (1), Eat Later (2), Favorites (3) |
| `activeFilters` | Veg Only, Non-Veg Only, Must Try, etc. |
| `dishes`, `favorites`, `eatLater` | From localStorage |
| `favoriteCounts`, `eatLaterCounts` | Per-dish counts from localStorage |
| `showPopup`, `mode`, `step` | Auth popup (register/login, phone/otp/name) |
| `phone`, `otp`, `name` | Auth form values |
| `user` | Current logged-in user (from localStorage) |
| `showProfile` | Profile sheet visibility |
| `showEatLaterPopup`, `pendingEatLaterDish` | Eat Later confirmation |
| `search` | Search input (Menu tab) |

### 4.2 Edit Menu Page (`/owner/hotel/[restaurantId]/edit-menu`)

| State | Purpose |
|-------|---------|
| `activeTab` | Ody Menu vs Menu |
| `categories` | Local array, e.g. `[{ id, name }]` |
| `dishes` | From localStorage, synced back |
| `showEdit`, `editValue`, `editId` | Category edit modal |
| `showDelete`, `deleteCat` | Category delete confirm |
| `showAddConfirm` | Add category confirm |

### 4.3 Add Dish Flow

| Page | State |
|------|-------|
| Type | `selectedType` |
| Visuals | `youtubeInput`, `uploadedVideoId`, `photoSrc`, `croppedPhoto`, `showCrop`, `crop`, `zoom` |
| Details | `name`, `vegType`, `price`, `quantity`, `description`, `fromTime`, `toTime` |

### 4.4 Dashboard

| State | Purpose |
|-------|---------|
| `showLogoSheet`, `showCoverSheet` | Bottom sheets for edit logo/cover |

---

## 5. MOCK DATA AND LOCAL STORAGE KEYS

### 5.1 localStorage Keys in Use

| Key | Data | Used By |
|-----|------|---------|
| `ody_dishes` | Dish[] | Customer page, Edit Menu, Add Dish |
| `ody_favorites` | Dish[] | Customer page, EditMenuDishBlock |
| `ody_eat_later` | Dish[] | Customer page, EditMenuDishBlock |
| `ody_dish_favorite_counts` | Record<dishId, number> | Customer page |
| `ody_dish_eat_later_counts` | Record<dishId, number> | Customer page |
| `odyUser` | { phone, name } | Customer page auth |
| `odyUsers` | Array of users | Mock user DB for login |
| `restaurantId` | string | Dashboard, Edit Menu, Add Dish, QR |
| `restaurantName` | string | Customer search placeholder |
| `restaurantLogo` | base64 string | Customer, Edit Menu, Dashboard |
| `restaurantCover` | base64 string | Customer, Edit Menu, Dashboard |
| `userName` | string | Dashboard |
| `addDishPhoto` | base64 string | Add Dish flow (temporary) |
| `addDishVideoId` | string | Add Dish flow (temporary) |
| `addDishType` | string | Add Dish flow (temporary) |

### 5.2 Mock / Placeholder Data

| Location | Mock Data |
|----------|-----------|
| OTP verification | In-memory `odyUsers`, no real OTP |
| Owner OTP | No backend; navigates to next step |
| Dashboard Avg Rating | "—" |
| Dashboard Videos | "0" |
| Dashboard Total Items | "0" |
| Leaderboard | "No data yet" |
| Highlights | "Best-performing dishes will appear here" |
| To Improve | "AI suggestions will appear here" |
| Edit Menu – categories | `[{ id: 1, name: "Category - 1" }]` |
| Edit Menu – Menu tab | Tags placeholder, empty category layers |

---

## 6. REQUIRED BACKEND APIs

### 6.1 Hotels / Restaurants

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/hotels` | Create hotel (owner onboarding) |
| GET | `/api/hotels/:id` | Get hotel by ID or slug |
| PATCH | `/api/hotels/:id` | Update name, logo, cover, etc. |
| GET | `/api/hotels?slug=xyz` | Lookup by slug (QR routing) |

**Suggested fields:** `id`, `name`, `slug`, `logo_url`, `cover_url`, `state`, `city`, `owner_id`, `created_at`.

### 6.2 Dishes

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/dishes?hotel_id=X` | ✅ Exists – list active dishes |
| POST | `/api/dishes` | ✅ Exists – create dish |
| PATCH | `/api/dishes/:id` | Update dish |
| DELETE | `/api/dishes/:id` | Soft delete (set `is_active=false`) |

**Frontend → backend mapping:**

| Frontend | Backend |
|----------|---------|
| `id` | `id` (or generate) |
| `name` | `name` |
| `price` | `price` |
| `quantity` | Add column or JSON |
| `description` | Add column |
| `timing.from`, `timing.to` | `timing_from`, `timing_to` or JSON |
| `photoUrl` | `photo_url` (after upload to storage) |
| `videoUrl` | `video_url` or `youtube_id` |
| — | `category` (from dish type) |
| vegType (not yet stored) | `is_veg` |

### 6.3 Categories

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/categories?hotel_id=X` | List categories |
| POST | `/api/categories` | Create category |
| PATCH | `/api/categories/:id` | Update name |
| DELETE | `/api/categories/:id` | Delete category |
| PATCH | `/api/dishes/:id` | Assign dish to category |

### 6.4 Media Upload

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/upload` or Supabase Storage | Upload photo, return URL |
| — | YouTube | Keep video ID only; no upload |

### 6.5 Customer Users & Favorites / Eat Later

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/users/register` | Register (phone + name) |
| POST | `/api/users/login` | Login (phone + OTP) |
| POST | `/api/users/send-otp` | Send OTP |
| GET | `/api/favorites?user_id=X` | List favorites |
| POST | `/api/favorites` | Add favorite |
| DELETE | `/api/favorites/:dish_id` | Remove favorite |
| GET | `/api/eat-later?user_id=X` | List eat later |
| POST | `/api/eat-later` | Add to eat later |
| DELETE | `/api/eat-later/:dish_id` | Remove from eat later |
| GET | `/api/dish-stats?dish_id=X` | Favorite/eat-later counts |

### 6.6 Ratings (Planned – Not in UI Yet)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/ratings` | Submit rating (1–5) + reason (required if low) |
| GET | `/api/ratings?dish_id=X` | Get ratings for dish |
| GET | `/api/hotels/:id/rating-summary` | Avg rating, low-rated items |

### 6.7 Owner Auth (Optional / Future)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/owners/register` | Owner registration |
| POST | `/api/owners/login` | Owner login |
| POST | `/api/owners/send-otp` | OTP for owner |

---

## 7. DATA MODEL GAPS

1. **Veg/Non-Veg**: `vegType` is collected but not stored; backend has `is_veg`. Add `is_veg` to `StoredDish` and persist.
2. **Dish type / category**: `addDishType` (food_item/dessert/beverage) is stored temporarily but not attached to the dish in `ody_dishes`.
3. **Photo storage**: Photos are base64 in localStorage; backend needs file storage (e.g. Supabase Storage) and URL in `photo_url`.
4. **Customer user ID**: Favorites and Eat Later use full dish objects; backend will need `user_id` and `dish_id` relations.

---

## 8. SUMMARY: BACKEND PRIORITY

**Phase 1 – Core menu**

- Extend `dishes` with `photo_url`, `video_url`, `description`, `quantity`, `timing_from`, `timing_to`, `is_veg`
- Media upload API or Supabase Storage integration
- Frontend: Replace `ody_dishes` localStorage with GET/POST `/api/dishes`

**Phase 2 – Hotels**

- `hotels` CRUD
- Frontend: Replace `restaurantId`, `restaurantName`, `restaurantLogo`, `restaurantCover` with hotel API

**Phase 3 – Customer features**

- User registration/login (OTP)
- Favorites and Eat Later APIs
- Frontend: Replace `ody_favorites`, `ody_eat_later` and related counts

**Phase 4 – Categories & ratings**

- Categories CRUD and dish-category linking
- Ratings API with mandatory reason for low ratings
- Dashboard aggregates (avg rating, videos, total items, leaderboard, etc.)
