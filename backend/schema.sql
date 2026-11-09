-- ==============================================================================
-- SATYA STORES (VASAVI ENTERPRISES) — SUPABASE 100% FREE DATABASE SCHEMA
-- Free Tier: 500MB PostgreSQL, 50,000 MAU, Zero Credit Card Required
-- ==============================================================================

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image TEXT,
  display_order INT DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Products Table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  brand TEXT NOT NULL,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  category_name TEXT,
  description TEXT,
  images TEXT[] NOT NULL CHECK (cardinality(images) >= 2 AND cardinality(images) <= 10),
  mrp NUMERIC NOT NULL,
  selling_price NUMERIC NOT NULL,
  stock_quantity INT DEFAULT 0,
  reserved_quantity INT DEFAULT 0,
  low_stock_threshold INT DEFAULT 3,
  specifications JSONB DEFAULT '{}'::jsonb,
  warranty TEXT,
  variants JSONB DEFAULT '[]'::jsonb,
  publication_status TEXT DEFAULT 'active',
  rating NUMERIC DEFAULT 5.0,
  review_count INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_best_seller BOOLEAN DEFAULT false,
  is_new_arrival BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Users Table (Customer & Admin Accounts with PBKDF2 Hashed Passwords)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  mobile_number TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- Stored as `<salt>:<pbkdf2_hash>`
  role TEXT DEFAULT 'customer', -- 'customer' | 'owner'
  mobile_verified BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT true,
  account_status TEXT DEFAULT 'active', -- 'active' | 'suspended'
  favorites TEXT[] DEFAULT '{}',
  addresses JSONB DEFAULT '[]'::jsonb,
  profile_image TEXT,
  two_factor_secret TEXT,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_pending_secret TEXT,
  two_factor_pending_expires_at TIMESTAMPTZ,
  admin_passkeys JSONB DEFAULT '[]'::jsonb,
  admin_device_enrollment_hash TEXT,
  admin_device_enrollment_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Admin Profile & 2FA Configuration
CREATE TABLE IF NOT EXISTS admin_profile (
  id TEXT PRIMARY KEY DEFAULT 'admin-master',
  full_name TEXT NOT NULL DEFAULT 'Satya Narayana',
  email TEXT NOT NULL DEFAULT 'admin@sathyastores.com',
  mobile_number TEXT NOT NULL DEFAULT '+91 98480 22338',
  business_entity TEXT NOT NULL DEFAULT 'Vasavi Enterprises',
  role TEXT NOT NULL DEFAULT 'owner',
  two_factor_enabled BOOLEAN DEFAULT true,
  two_factor_method TEXT DEFAULT 'OTP_SMS_EMAIL',
  two_factor_pin TEXT DEFAULT '',
  profile_image TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_pending_secret TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_pending_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_passkeys JSONB DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_device_enrollment_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_device_enrollment_expires_at TIMESTAMPTZ;
ALTER TABLE admin_profile ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- 5. Orders Table (Immutable Snapshot)
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_mobile TEXT NOT NULL,
  customer_email TEXT,
  items_snapshot JSONB NOT NULL,
  shipping_address_snapshot JSONB NOT NULL,
  subtotal NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  shipping_charge NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  order_status TEXT DEFAULT 'Order Created',
  payment_status TEXT DEFAULT 'Awaiting Payment',
  delivery_status TEXT DEFAULT 'Not Arranged',
  payment_method TEXT DEFAULT 'UPI',
  payment_reference TEXT,
  payment_evidence_url TEXT,
  rejection_reason TEXT,
  manual_delivery_reference TEXT,
  delivery_notes TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Inventory Movements (Audit Log)
CREATE TABLE IF NOT EXISTS inventory_movements (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT,
  sku TEXT,
  movement_type TEXT NOT NULL, -- RESERVATION, SALE, MANUAL_ADJUSTMENT, RELEASE
  quantity INT NOT NULL,
  previous_quantity INT NOT NULL,
  new_quantity INT NOT NULL,
  reason TEXT NOT NULL,
  related_order_id TEXT,
  performed_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  rating NUMERIC NOT NULL,
  title TEXT,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Coupons Table
CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL, -- 'percentage' | 'fixed'
  discount_value NUMERIC NOT NULL,
  min_order_value NUMERIC DEFAULT 0,
  max_discount_amount NUMERIC,
  status TEXT DEFAULT 'active',
  expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Marquees Table
CREATE TABLE IF NOT EXISTS marquees (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  link TEXT,
  position TEXT DEFAULT 'header', -- 'header' | 'hero_top' | 'footer'
  background_color TEXT,
  text_color TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Store Settings Table
CREATE TABLE IF NOT EXISTS store_settings (
  id TEXT PRIMARY KEY DEFAULT 'primary_store_settings',
  store_name TEXT DEFAULT 'Satya Stores',
  business_entity TEXT DEFAULT 'Vasavi Enterprises',
  support_phone TEXT DEFAULT '+91 98490 12345',
  support_email TEXT DEFAULT 'support@satyastores.in',
  upi_id TEXT DEFAULT 'vasavienterprises@okaxis',
  upi_recipient_name TEXT DEFAULT 'Satya Stores (Vasavi Enterprises)',
  bank_account_name TEXT DEFAULT 'Vasavi Enterprises',
  bank_account_number TEXT DEFAULT '923020048192837',
  bank_ifsc TEXT DEFAULT 'UTIB0001234',
  bank_name TEXT DEFAULT 'Axis Bank Ltd',
  bank_branch TEXT DEFAULT 'Main Branch, MG Road',
  free_shipping_threshold NUMERIC DEFAULT 999,
  standard_shipping_fee NUMERIC DEFAULT 49,
  reservation_expiry_minutes INT DEFAULT 30,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Homepage Sections Table
CREATE TABLE IF NOT EXISTS homepage_sections (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  type TEXT NOT NULL,
  item_ids TEXT[] DEFAULT '{}',
  display_order INT DEFAULT 0,
  status TEXT DEFAULT 'active'
);

-- Enable RLS and deny direct client access. The API uses a backend-only secret key.
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

REVOKE ALL ON SCHEMA public FROM anon, authenticated;
REVOKE ALL ON TABLE categories, products, users, admin_profile, orders, inventory_movements, reviews, coupons, marquees, store_settings, homepage_sections FROM anon, authenticated;

-- ==============================================================================
-- SEED DATA (INITIAL CATEGORIES, PRODUCTS, STORE SETTINGS & USERS)
-- ==============================================================================

-- 1. Categories
INSERT INTO categories (id, name, slug, description, image, display_order, status) VALUES (
  'cat-mobiles', 'Smartphones & Mobiles', 'mobiles', 'Latest 5G smartphones from Apple, Samsung, OnePlus, and more.', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80', 1, 'active'
) ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, name, slug, description, image, display_order, status) VALUES (
  'cat-laptops', 'Laptops & Computers', 'laptops', 'High-performance personal, business, and gaming laptops.', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80', 2, 'active'
) ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, name, slug, description, image, display_order, status) VALUES (
  'cat-televisions', 'Smart TVs & Audio', 'televisions', '4K UHD Smart OLED, QLED TVs, and home theatre soundbars.', 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=80', 3, 'active'
) ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, name, slug, description, image, display_order, status) VALUES (
  'cat-appliances', 'Home & Kitchen Appliances', 'home-appliances', 'Premium mixer grinders, induction cooktops, and smart electricals.', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80', 4, 'active'
) ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, name, slug, description, image, display_order, status) VALUES (
  'cat-accessories', 'Accessories & Smart Gadgets', 'accessories', '65W GaN fast chargers, braided Type-C cables, and smartwatches.', 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=600&q=80', 5, 'active'
) ON CONFLICT (id) DO NOTHING;

-- 2. Store Settings
INSERT INTO store_settings (id, store_name, business_entity, support_phone, support_email, upi_id, upi_recipient_name, bank_account_name, bank_account_number, bank_ifsc, bank_name, bank_branch, free_shipping_threshold, standard_shipping_fee, reservation_expiry_minutes) VALUES (
  'primary_store_settings', 'Satya Stores', 'Vasavi Enterprises', '+91 98490 12345', 'support@satyastores.in', 'vasavienterprises@okaxis', 'Satya Stores (Vasavi Enterprises)', 'Vasavi Enterprises', '923020048192837', 'UTIB0001234', 'Axis Bank Ltd', 'Main Branch, MG Road', 999, 49, 30
) ON CONFLICT (id) DO NOTHING;

-- 3. Admin Profile
INSERT INTO admin_profile (id, full_name, email, mobile_number, business_entity, role, two_factor_enabled, two_factor_method, two_factor_pin) VALUES (
  'admin-master', 'Satya Narayana', 'admin@sathyastores.com', '+91 98480 22338', 'Vasavi Enterprises', 'owner', true, 'OTP_SMS_EMAIL', ''
) ON CONFLICT (id) DO NOTHING;

-- 4. Products
INSERT INTO products (id, product_name, slug, sku, brand, category_id, category_name, description, images, mrp, selling_price, stock_quantity, reserved_quantity, low_stock_threshold, specifications, warranty, variants, publication_status, rating, review_count, is_featured, is_best_seller, is_new_arrival) VALUES (
  'prod-iphone-16-pro', 'Apple iPhone 16 Pro Max', 'apple-iphone-16-pro-max', 'SAT-APL-IP16PM-256', 'Apple', 'cat-mobiles', 'Smartphones & Mobiles', 'Forged in Grade 5 Titanium with the breakthrough A18 Pro chip, 48MP Fusion camera system, and industry-leading battery life.', ARRAY['https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80']::text[], 144900, 134900, 14, 2, 3, '{"Display":"6.9\" Super Retina XDR OLED ProMotion 120Hz","Processor":"A18 Pro Hexa-Core Bionic","Camera":"48MP Main + 48MP Ultra-Wide + 12MP 5x Telephoto","Battery":"Up to 33 hours video playback","OS":"iOS 18"}'::jsonb, '1 Year Apple India Official Warranty', '[{"sku":"SAT-APL-IP16PM-256-NAT","name":"256GB / Natural Titanium","price":134900,"mrp":144900,"stockQuantity":8,"attributes":{"Storage":"256GB","Color":"Natural Titanium"}},{"sku":"SAT-APL-IP16PM-512-BLK","name":"512GB / Black Titanium","price":154900,"mrp":164900,"stockQuantity":6,"attributes":{"Storage":"512GB","Color":"Black Titanium"}}]'::jsonb, 'active', 4.9, 142, true, true, false
) ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, product_name, slug, sku, brand, category_id, category_name, description, images, mrp, selling_price, stock_quantity, reserved_quantity, low_stock_threshold, specifications, warranty, variants, publication_status, rating, review_count, is_featured, is_best_seller, is_new_arrival) VALUES (
  'prod-samsung-s25-ultra', 'Samsung Galaxy S25 Ultra 5G', 'samsung-galaxy-s25-ultra-5g', 'SAT-SAM-S25U-512', 'Samsung', 'cat-mobiles', 'Smartphones & Mobiles', 'The apex of mobile photography with 200MP Quad Telephoto AI zoom, built-in S-Pen, and Snapdragon 8 Elite Extreme Edition.', ARRAY['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80']::text[], 139999, 128999, 10, 1, 4, '{"Display":"6.8\" Dynamic AMOLED 2X QHD+ 2600 nits","Processor":"Snapdragon 8 Elite (3nm)","Camera":"200MP + 50MP 5x + 10MP 3x + 50MP Ultra-Wide","Battery":"5000 mAh with 45W Fast Charging","Stylus":"Embedded S-Pen with Bluetooth Gestures"}'::jsonb, '1 Year Manufacturer Warranty with Free Screen Replacement Offer', '[{"sku":"SAT-SAM-S25U-512-GRY","name":"12GB RAM / 512GB / Titanium Gray","price":128999,"mrp":139999,"stockQuantity":10,"attributes":{"RAM":"12GB","Storage":"512GB","Color":"Titanium Gray"}}]'::jsonb, 'active', 4.8, 98, true, false, false
) ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, product_name, slug, sku, brand, category_id, category_name, description, images, mrp, selling_price, stock_quantity, reserved_quantity, low_stock_threshold, specifications, warranty, variants, publication_status, rating, review_count, is_featured, is_best_seller, is_new_arrival) VALUES (
  'prod-oneplus-13', 'OnePlus 13 5G Flagship', 'oneplus-13-5g-flagship', 'SAT-OP-13-256', 'OnePlus', 'cat-mobiles', 'Smartphones & Mobiles', 'Speed redefined with 100W SUPERVOOC, 6000mAh Glacier Battery, Hasselblad Master Optics, and ultra-smooth 2K 120Hz display.', ARRAY['https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80']::text[], 69999, 64999, 18, 0, 5, '{"Display":"6.82\" BOE X2 2K Oriental Screen 120Hz","Processor":"Snapdragon 8 Elite","Battery":"6000 mAh with 100W Wired & 50W Wireless","Camera":"50MP Sony LYT-808 + 50MP Periscope + 50MP UW"}'::jsonb, '1 Year Comprehensive Brand Warranty', '[{"sku":"SAT-OP-13-256-BLK","name":"12GB / 256GB / Midnight Black","price":64999,"mrp":69999,"stockQuantity":12,"attributes":{"Storage":"256GB","Color":"Midnight Black"}},{"sku":"SAT-OP-13-512-BLU","name":"16GB / 512GB / Arctic Blue","price":72999,"mrp":77999,"stockQuantity":6,"attributes":{"Storage":"512GB","Color":"Arctic Blue"}}]'::jsonb, 'active', 4.7, 74, false, false, true
) ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, product_name, slug, sku, brand, category_id, category_name, description, images, mrp, selling_price, stock_quantity, reserved_quantity, low_stock_threshold, specifications, warranty, variants, publication_status, rating, review_count, is_featured, is_best_seller, is_new_arrival) VALUES (
  'prod-macbook-air-m3', 'Apple MacBook Air 15" M3 Chip', 'apple-macbook-air-15-m3', 'SAT-APL-MBA15-M3', 'Apple', 'cat-laptops', 'Laptops & Computers', 'Impossibly thin and fast laptop with a stunning 15.3-inch Liquid Retina display, all-day 18-hour battery life, and MagSafe charging.', ARRAY['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80']::text[], 134900, 124900, 8, 1, 2, '{"Display":"15.3\" Liquid Retina 500 nits True Tone","Processor":"Apple M3 8-core CPU / 10-core GPU","Memory":"16GB Unified Memory","Storage":"512GB Ultra-Fast SSD","Battery":"Up to 18 hours wireless web"}'::jsonb, '1 Year Official Apple India Warranty', '[{"sku":"SAT-APL-MBA15-MID","name":"16GB / 512GB / Midnight Blue","price":124900,"mrp":134900,"stockQuantity":8,"attributes":{"Memory":"16GB","Storage":"512GB","Color":"Midnight"}}]'::jsonb, 'active', 4.9, 62, true, false, false
) ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, product_name, slug, sku, brand, category_id, category_name, description, images, mrp, selling_price, stock_quantity, reserved_quantity, low_stock_threshold, specifications, warranty, variants, publication_status, rating, review_count, is_featured, is_best_seller, is_new_arrival) VALUES (
  'prod-dell-xps-14', 'Dell XPS 14 OLED Intel Core Ultra 7', 'dell-xps-14-oled', 'SAT-DEL-XPS14-U7', 'Dell', 'cat-laptops', 'Laptops & Computers', 'Crafted with CNC machined aluminum and Gorilla Glass 3. Includes dedicated Copilot key and NVIDIA GeForce RTX 4050 graphics.', ARRAY['https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80']::text[], 199990, 179990, 4, 0, 2, '{"Display":"14.5\" 3.2K (3200 x 2000) OLED Touch 120Hz","Processor":"Intel Core Ultra 7 155H with NPU AI Engine","RAM":"32GB LPDDR5X","Storage":"1TB PCIe NVMe SSD","Graphics":"NVIDIA GeForce RTX 4050 6GB GDDR6"}'::jsonb, '2 Years Onsite Hardware Service by Dell India', '[{"sku":"SAT-DEL-XPS14-PLAT","name":"32GB / 1TB SSD / Platinum Silver","price":179990,"mrp":199990,"stockQuantity":4,"attributes":{"RAM":"32GB","Storage":"1TB","Color":"Platinum Silver"}}]'::jsonb, 'active', 4.8, 31, false, false, false
) ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, product_name, slug, sku, brand, category_id, category_name, description, images, mrp, selling_price, stock_quantity, reserved_quantity, low_stock_threshold, specifications, warranty, variants, publication_status, rating, review_count, is_featured, is_best_seller, is_new_arrival) VALUES (
  'prod-lg-oled-55-c4', 'LG 55" (139 cm) 4K Ultra HD Smart OLED evo TV', 'lg-55-4k-oled-evo-c4', 'SAT-LG-OLED55-C4', 'LG', 'cat-televisions', 'Smart TVs & Audio', 'Self-lit OLED pixels delivering infinite contrast, 100% color fidelity, α9 AI Processor Gen7 4K, and NVIDIA G-Sync / AMD FreeSync 144Hz support.', ARRAY['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80']::text[], 169990, 129990, 6, 0, 2, '{"Display":"55-inch 4K OLED evo Panel with Brightness Booster","RefreshRate":"144Hz Native Variable Refresh Rate","HDR":"Dolby Vision, HDR10, HLG with FILMMAKER MODE","Sound":"40W 2.2 Channel Dolby Atmos / DTS Virtual:X","OS":"webOS 24 with 5 Years OS Updates Guarantee"}'::jsonb, '3 Years Comprehensive Panel & Motherboard Warranty', '[{"sku":"SAT-LG-OLED55-C4-STD","name":"55\" OLED evo / Table Mount","price":129990,"mrp":169990,"stockQuantity":6,"attributes":{"Size":"55 Inch","Mounting":"Table + Wall Bracket"}}]'::jsonb, 'active', 4.9, 57, false, true, false
) ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, product_name, slug, sku, brand, category_id, category_name, description, images, mrp, selling_price, stock_quantity, reserved_quantity, low_stock_threshold, specifications, warranty, variants, publication_status, rating, review_count, is_featured, is_best_seller, is_new_arrival) VALUES (
  'prod-preethi-zodiac', 'Preethi Zodiac 750W Mixer Grinder with Food Processor Jar', 'preethi-zodiac-750w-mixer-grinder', 'SAT-PRE-ZODIAC-750', 'Preethi', 'cat-appliances', 'Home & Kitchen Appliances', 'India''s trusted mixer grinder featuring the Master Chef+ Jar for chopping, slicing, atta kneading, and 3-in-1 fresh citrus juicing.', ARRAY['https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=800&q=80']::text[], 11499, 8799, 22, 2, 5, '{"Motor":"750 Watt Vega W5 Pure Copper Motor","Jars":"5 Stainless Steel and Tritan Transparent Jars","Blades":"Machine-ground Razor Sharp SS304 Blades","OverloadProtection":"Automated Trip Switch"}'::jsonb, '5 Years Motor Warranty & 2 Years Product Warranty', '[{"sku":"SAT-PRE-ZODIAC-STD","name":"5 Jars Set / Black & Blue Accent","price":8799,"mrp":11499,"stockQuantity":22,"attributes":{"Pack":"5 Jars Full Kit"}}]'::jsonb, 'active', 4.7, 189, false, true, false
) ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, product_name, slug, sku, brand, category_id, category_name, description, images, mrp, selling_price, stock_quantity, reserved_quantity, low_stock_threshold, specifications, warranty, variants, publication_status, rating, review_count, is_featured, is_best_seller, is_new_arrival) VALUES (
  'prod-philips-induction', 'Philips Viva Collection 2100W Induction Cooktop', 'philips-viva-2100w-induction-cooktop', 'SAT-PHI-IND-2100', 'Philips', 'cat-appliances', 'Home & Kitchen Appliances', 'Fast cooking sealing nutrients into the food. Features Indian cooking presets: Roti/Dosa, Gravy, Milk, Deep Fry, and Rice.', ARRAY['https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&w=800&q=80']::text[], 4995, 3499, 15, 0, 4, '{"Power":"2100 Watts Electromagnetic Induction","Surface":"Full Mirrored Toughened Micro-Crystal Glass","Timer":"0 to 3 Hours Auto-off Preset Timer"}'::jsonb, '2 Years Philips India Home Service Warranty', '[{"sku":"SAT-PHI-IND-BLK","name":"2100W Preset Model / Obsidian Glass","price":3499,"mrp":4995,"stockQuantity":15,"attributes":{"Color":"Black Toughened Glass"}}]'::jsonb, 'active', 4.6, 112, false, false, false
) ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, product_name, slug, sku, brand, category_id, category_name, description, images, mrp, selling_price, stock_quantity, reserved_quantity, low_stock_threshold, specifications, warranty, variants, publication_status, rating, review_count, is_featured, is_best_seller, is_new_arrival) VALUES (
  'prod-anker-65w-gan', 'Anker Prime 65W GaN 3-Port Fast Wall Charger', 'anker-prime-65w-gan-fast-charger', 'SAT-ANK-GAN65W', 'Anker', 'cat-accessories', 'Accessories & Smart Gadgets', 'Ultra-compact Gallium Nitride (GaN) fast charger with dual USB-C and USB-A ports to fast-charge your MacBook, iPhone, and Galaxy simultaneously.', ARRAY['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=800&q=80']::text[], 4999, 3699, 30, 1, 6, '{"Power":"65W Max Power Delivery 3.0 & PPS","Ports":"2x USB-C (65W each max) + 1x USB-A (22.5W)","Protection":"ActiveShield 2.0 Real-time Temperature Monitoring"}'::jsonb, '18 Months Anker Replacement Warranty', '[{"sku":"SAT-ANK-GAN65W-BLK","name":"65W / Stealth Black","price":3699,"mrp":4999,"stockQuantity":30,"attributes":{"Color":"Stealth Black"}}]'::jsonb, 'active', 4.9, 230, false, true, false
) ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, product_name, slug, sku, brand, category_id, category_name, description, images, mrp, selling_price, stock_quantity, reserved_quantity, low_stock_threshold, specifications, warranty, variants, publication_status, rating, review_count, is_featured, is_best_seller, is_new_arrival) VALUES (
  'prod-noise-colorfit-ultra', 'Noise ColorFit Ultra 3 1.96" AMOLED Smartwatch', 'noise-colorfit-ultra-3-smartwatch', 'SAT-NOI-CFU3-MET', 'Noise', 'cat-accessories', 'Accessories & Smart Gadgets', 'Premium metallic finish smartwatch with Tru Sync Bluetooth Calling, Functional Crown, and 7-day battery stamina.', ARRAY['https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80']::text[], 7999, 3299, 19, 0, 5, '{"Display":"1.96\" AMOLED 410x502 resolution Always-On","Connectivity":"Single-chip Bluetooth v5.3 Calling","Health":"24/7 Heart Rate, SpO2, Sleep Tracker, 100+ Sports Modes","WaterResistance":"IP68 Dust & Water Proof"}'::jsonb, '1 Year Brand Replacement Warranty', '[{"sku":"SAT-NOI-CFU3-SIL","name":"Silver Metallic / Jet Black Strap","price":3299,"mrp":7999,"stockQuantity":19,"attributes":{"Color":"Silver Metal / Black Strap"}}]'::jsonb, 'active', 4.5, 88, false, false, true
) ON CONFLICT (id) DO NOTHING;

-- User accounts are intentionally not seeded with shared/demo credentials.
-- Create an owner account with a private PBKDF2 hash as documented in README.md.
