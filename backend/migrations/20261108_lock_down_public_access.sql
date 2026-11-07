-- Remove the permissive policies previously used by the public anon key.
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE marquees ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read-write for categories" ON categories;
DROP POLICY IF EXISTS "Allow public read-write for products" ON products;
DROP POLICY IF EXISTS "Allow public read-write for users" ON users;
DROP POLICY IF EXISTS "Allow public read-write for admin_profile" ON admin_profile;
DROP POLICY IF EXISTS "Allow public read-write for orders" ON orders;
DROP POLICY IF EXISTS "Allow public read-write for inventory_movements" ON inventory_movements;
DROP POLICY IF EXISTS "Allow public read-write for reviews" ON reviews;
DROP POLICY IF EXISTS "Allow public read-write for coupons" ON coupons;
DROP POLICY IF EXISTS "Allow public read-write for marquees" ON marquees;
DROP POLICY IF EXISTS "Allow public read-write for store_settings" ON store_settings;
DROP POLICY IF EXISTS "Allow public read-write for homepage_sections" ON homepage_sections;

REVOKE ALL ON SCHEMA public FROM anon, authenticated;
REVOKE ALL ON TABLE categories, products, users, admin_profile, orders, inventory_movements, reviews, coupons, marquees, store_settings, homepage_sections FROM anon, authenticated;
