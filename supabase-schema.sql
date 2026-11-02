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
  images TEXT[] NOT NULL,
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

-- 3. Orders Table (Immutable Snapshot)
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

-- 4. Inventory Movements (Audit Log)
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

-- 5. Store Settings Table
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

-- Enable Row Level Security (RLS) with open read/write for free anon key
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-write for categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for inventory_movements" ON inventory_movements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for store_settings" ON store_settings FOR ALL USING (true) WITH CHECK (true);
