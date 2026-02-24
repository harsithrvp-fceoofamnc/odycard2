# Authentication & Signup Summary

## Overview

Owner authentication is handled through a separate `owners` table. The `hotels` table stores only business data (no passwords). Passwords are hashed with bcrypt before storage.

---

## Database Schema

### `owners` Table
| Column        | Type      | Description                          |
|---------------|-----------|--------------------------------------|
| id            | SERIAL    | Primary key                          |
| hotel_id      | INTEGER   | FK → hotels(id), ON DELETE CASCADE   |
| gmail         | TEXT      | Unique, required                     |
| password_hash | TEXT      | bcrypt-hashed password               |
| created_at    | TIMESTAMP | Default: CURRENT_TIMESTAMP           |

- Index on `gmail` for fast login lookups.

### `hotels` Table
- Business data only: `id`, `name`, `slug`, `logo_url`, `cover_url`, `cover_original_url`
- No password or auth-related columns.

---

## Signup Flow

### Page 1: Details (`/owner/details`)
- Collects: Restaurant Name, User Name, State, City, Restaurant ID, Gmail, Password, Re-enter Password
- Validates slug availability via `GET /api/hotels/:slug`
- Stores `userName`, `restaurantName`, `restaurantSlug` in `localStorage`
- Stores `signup_gmail` and `signup_password` in `sessionStorage` (cleared after signup)
- Navigates to Details2

### Page 2: Logo & Cover (`/owner/details2`)
- Reads `restaurantName`, `restaurantSlug` from `localStorage`
- Reads `signup_gmail`, `signup_password` from `sessionStorage`
- **Step 1:** `POST /api/hotels` → creates hotel
- **Step 2:** `PATCH /api/hotels/:id` → updates logo and cover
- **Step 3:** `POST /api/owners` → creates owner with hashed password
- Clears `sessionStorage` (gmail, password)
- Stores hotel data in `localStorage`, redirects to success

---

## API Endpoints

### `POST /api/hotels`
- **Body:** `name`, `logo_url`, `cover_url`, `cover_original_url` (all optional except `name`)
- **Action:** Inserts hotel, returns created row
- **Errors:** 400 (missing name), 409 (slug exists)

### `POST /api/owners`
- **Body:** `hotel_id`, `gmail`, `password`
- **Action:** Hashes password with `bcrypt.hash(password, 10)`, inserts `hotel_id`, `gmail`, `password_hash`
- **Validation:** Gmail must end with `@gmail.com`, password ≥ 6 characters
- **Errors:** 400 (invalid input), 409 (gmail already exists), 23503 (invalid hotel_id)

### `POST /api/auth/login`
- **Body:** `gmail`, `password`
- **Action:**
  1. Finds owner by `gmail` in `owners`
  2. Verifies password with `bcrypt.compare(password, owner.password_hash)`
  3. Fetches hotel by `owner.hotel_id`
- **Response:** `{ hotel }` on success
- **Errors:** 400 (missing fields), 401 (invalid gmail/password), 404 (hotel not found)

---

## Login Flow

1. User enters Gmail and password on `/owner/login`
2. Frontend calls `POST /api/auth/login` with `{ gmail, password }`
3. On success, stores `ody_hotel_id`, `restaurantId`, `restaurantName`, `userName` in `localStorage`
4. Redirects to `/owner/dashboard`

---

## Security Notes

- Passwords never stored in plain text
- bcrypt rounds: 10
- Gmail stored and queried in lowercase for consistency
- `sessionStorage` used for signup credentials to avoid keeping them in `localStorage`
- Hotels table contains only business data; auth is handled via `owners` table
