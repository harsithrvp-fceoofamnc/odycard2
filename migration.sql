-- ═══════════════════════════════════════════
-- OdyCard Migration SQL — Run on NEW Supabase project
-- ═══════════════════════════════════════════

-- 1. CREATE TABLES
-- ─────────────────────────────────────────

CREATE TABLE hotels (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT now(),
  logo_url TEXT,
  cover_url TEXT,
  cover_original_url TEXT,
  ody_menu_hidden BOOLEAN DEFAULT false
);

CREATE TABLE owners (
  id SERIAL PRIMARY KEY,
  hotel_id INTEGER NOT NULL,
  gmail TEXT,
  password_hash TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  mobile TEXT,
  signup_method TEXT DEFAULT 'mobile'
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  hotel_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dishes (
  id SERIAL PRIMARY KEY,
  hotel_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  category TEXT NOT NULL,
  is_veg BOOLEAN,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  quantity TEXT,
  description TEXT,
  timing_from TEXT,
  timing_to TEXT,
  photo_url TEXT,
  video_url TEXT,
  hidden_at TIMESTAMPTZ,
  favorite_count INTEGER DEFAULT 0,
  eat_later_count INTEGER DEFAULT 0,
  menu_category_id INTEGER,
  tags TEXT[] DEFAULT '{}'
);

CREATE TABLE ratings (
  id SERIAL PRIMARY KEY,
  dish_id INTEGER NOT NULL,
  stars INTEGER NOT NULL,
  low_rating_reason TEXT,
  created_at TIMESTAMP DEFAULT now(),
  hotel_id INTEGER,
  comment TEXT,
  visitor_name TEXT
);

-- 2. INSERT DATA
-- ─────────────────────────────────────────

-- Hotels
INSERT INTO hotels (id, name, slug, created_at, ody_menu_hidden) VALUES
(1, 'u', 'u', '2026-04-01 09:29:42.1023', false),
(2, 'm', 'm', '2026-04-01 09:39:36.206783', false),
(3, 'Annapoorna', 'annapoorna', '2026-04-01 09:51:36.405282', false),
(4, 'Bon Bon Icecreams', 'bon-bon-icecreams', '2026-04-01 10:03:29.2312', false),
(5, 'Bon Bon Icecreams', 'bon-bon-icecreams-1', '2026-04-01 10:13:13.285855', false),
(6, 'Bon Bon Icecreams', 'bon-bon-icecreams-2', '2026-04-02 03:33:51.538859', false),
(7, 'Bon Bon Icecreams', 'bon-bon-icecreams-3', '2026-04-02 03:52:35.335312', false),
(8, 'Bon Bon Icecreams', 'bon-bon-icecreams-4', '2026-04-02 04:48:13.040818', false),
(9, 'Bon Bon Icecreams', 'bon-bon-icecreams-5', '2026-04-02 07:21:12.571905', false),
(10, 'Bon Bon', 'bon-bon', '2026-04-03 18:18:39.468101', false),
(11, 'skldd', 'skldd', '2026-04-09 04:40:48.162098', false),
(12, '123456', '123456', '2026-04-09 04:42:10.690881', false),
(13, 'I', 'i', '2026-04-17 17:37:24.583939', false);

-- Reset sequence
SELECT setval('hotels_id_seq', (SELECT MAX(id) FROM hotels));

-- Owners
INSERT INTO owners (id, hotel_id, gmail, password_hash, created_at, mobile, signup_method) VALUES
(1, 2, 'u@gmail.com', '$2b$10$P3p..MvaJPqKIBmuqkxv/ud.A8YT/Os3xB3tqOHt.q9o2U6BSWsgi', '2026-04-01 09:39:48.778187', null, 'mobile'),
(2, 3, 'harsith@gmail.com', '$2b$10$tg6Ryq730GnyDaXJUJq6nOejys1dLa88hgGeG6jXRbyrShm7K8ls.', '2026-04-01 09:51:50.370796', null, 'mobile'),
(7, 8, null, '$2b$10$ItQayv6LiqZkXLZfT7empeKZpIE8BsesOaT4sXE7z5yt/cJz6IiQq', '2026-04-02 04:48:23.539889', '1234567890', 'mobile'),
(8, 9, null, '$2b$10$lwKUgBBfgifvucqNjr6Ap.cjXMfWCKuIPDpeVPsVZL1DhHehzsVBe', '2026-04-02 07:21:25.777254', '7890123456', 'mobile'),
(9, 10, null, '$2b$10$72/G/veRmlWknSN3kR7Vpuv5gSIsKdeaN/6pUtlmlPKGztab2BwJ2', '2026-04-03 18:19:03.771979', '1234568900', 'mobile'),
(10, 12, null, '$2b$10$2W5N5JNHSqeBR2I/4arZu.ST/X3YUQEl56B8b6r.Hl7dsdW8kpywy', '2026-04-09 04:42:19.763283', '1234567894', 'mobile'),
(11, 13, null, '$2a$10$.Yz4gi92Gi3pviOUPAYqbuh9QMTurR8aThIH.Px9bn.krxj2E46OG', '2026-04-17 17:37:47.556574', '1234566666', 'mobile');

SELECT setval('owners_id_seq', (SELECT MAX(id) FROM owners));

-- Categories
INSERT INTO categories (id, hotel_id, name, display_order, created_at) VALUES
(1, 10, 'Starters', 0, '2026-05-25 18:21:26.526971'),
(2, 10, 'Category - 2', 0, '2026-05-27 19:19:31.38998');

SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));

-- Dishes
INSERT INTO dishes (id, hotel_id, name, price, category, is_veg, is_active, created_at, quantity, description, timing_from, timing_to, video_url, hidden_at, favorite_count, eat_later_count, menu_category_id, tags) VALUES
(1, 9, 'Veg Rice', 200, 'food_item', true, true, '2026-04-03 03:07:14.932427', '250g', 'Thai style Vegetable Fried rice with special Thai sauce.', '09:00', '22:00', 'https://www.youtube.com/watch?v=s2OccJMWwkM', null, 0, 0, null, '{}'),
(3, 10, 'Veg Rice', 200, 'food_item', true, false, '2026-04-05 07:59:34.26616', '250g', 'Thai style Hot and Spicy Veg Fried Rice.', '09:00', '22:00', 'https://www.youtube.com/watch?v=8tnQYBs4ZpY', null, 0, 0, null, '{}'),
(6, 10, 'Chicken Rice', 250, 'food_item', false, true, '2026-04-05 15:38:50.483822', '250g', 'Hot and Spicy, Thai Chicken fried rice', '09:00', '23:30', 'https://www.youtube.com/watch?v=bJa3-9DsE8E', null, 2, 1, null, '{}'),
(7, 10, 'Chicken Noodles', 250, 'food_item', false, true, '2026-04-05 15:55:50.337339', '250g', null, '16:00', '22:00', 'https://www.youtube.com/watch?v=bJa3-9DsE8E', null, 0, 0, null, '{}'),
(8, 10, 'Chicken Biriyani', 300, 'food_item', false, true, '2026-04-06 19:53:40.375847', '250g', 'Ambur style authentic Chicken Biriyani.', '09:00', '09:00', 'https://www.youtube.com/watch?v=bJa3-9DsE8E', null, 3, 1, null, '{}'),
(11, 10, 'mm', 666, 'food_item', true, true, '2026-05-26 19:28:38.304028', '77g', 'jjjjjjjjjjjjjjjjj', '09:00', '03:00', null, null, 1, 1, 1, '{"Must Try","chumma"}');

SELECT setval('dishes_id_seq', (SELECT MAX(id) FROM dishes));

-- Ratings
INSERT INTO ratings (id, dish_id, stars, low_rating_reason, created_at, hotel_id, comment, visitor_name) VALUES
(2, 8, 1, 'Taste', '2026-04-09 18:07:29.16742', 10, null, 'Harsith'),
(3, 8, 5, null, '2026-04-09 18:16:52.473606', 10, null, 'Harsith'),
(4, 8, 5, null, '2026-04-10 03:20:13.330377', 10, null, 'Hh'),
(6, 6, 5, null, '2026-04-10 15:20:14.795093', 10, null, 'Harsith'),
(8, 6, 4, null, '2026-04-13 04:17:34.834665', 10, null, 'Hh'),
(10, 11, 4, null, '2026-05-27 06:34:46.933108', 10, null, 'jojo');

SELECT setval('ratings_id_seq', (SELECT MAX(id) FROM ratings));
