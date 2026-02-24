# Backend Auth Routes — Quick Reference

## POST /api/owners

Creates an owner after hotel creation (signup flow).

| Item | Detail |
|------|--------|
| **Body** | `hotel_id`, `gmail`, `password` |
| **bcrypt** | `bcrypt.hash(password, 10)` before insert |
| **SQL** | `INSERT INTO owners (hotel_id, gmail, password_hash) VALUES ($1, $2, $3)` |
| **Gmail** | Stored as `gmail.toLowerCase().trim()` |
| **Validation** | Gmail ends with `@gmail.com`, password ≥ 6 chars |
| **Errors** | 400 (missing/invalid), 409 (gmail exists), 500 |

---

## POST /api/auth/login

Logs in owner and returns hotel details.

| Item | Detail |
|------|--------|
| **Body** | `gmail`, `password` |
| **Query 1** | `SELECT id, hotel_id, password_hash FROM owners WHERE gmail = $1` (gmail: `gmail.toLowerCase().trim()`) |
| **bcrypt** | `bcrypt.compare(password, owner.password_hash)` |
| **Query 2** | `SELECT id, name, slug, logo_url, cover_url, cover_original_url FROM hotels WHERE id = $1` |
| **Response** | `{ hotel }` |
| **Errors** | 400 (missing fields), 401 (invalid creds), 404 (hotel not found), 500 |
