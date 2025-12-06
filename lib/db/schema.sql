-- PricingRadar Database Schema for Supabase
-- Run this in your Supabase SQL editor to create the tables
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Competitors table
CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  marketplace TEXT NOT NULL UNIQUE,
  -- 'medsgo', 'watsons', 'custom'
  base_url TEXT NOT NULL,
  category_url TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Products table (competitor products)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  dosage TEXT,
  url TEXT NOT NULL UNIQUE,
  external_id TEXT,
  -- ID from the scraped data
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Price history table
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  discount_percent DECIMAL(5, 2),
  currency TEXT DEFAULT 'PHP',
  in_stock BOOLEAN DEFAULT true,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  scraped_date DATE -- For day-based deduplication (one entry per product per day)
);
-- Unique constraint for one price entry per product per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_price_history_product_date ON price_history(product_id, scraped_date);
-- Internal products table (GoRocky's products)
CREATE TABLE IF NOT EXISTS internal_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  current_price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'PHP',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Product mappings (competitor product <-> internal product)
CREATE TABLE IF NOT EXISTS product_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  internal_product_id UUID NOT NULL REFERENCES internal_products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(competitor_product_id, internal_product_id)
);
-- Alert thresholds table
CREATE TABLE IF NOT EXISTS alert_thresholds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  condition TEXT NOT NULL,
  -- 'price_drop', 'price_increase', 'discount_detected', etc.
  value DECIMAL(10, 2) NOT NULL,
  -- percentage or absolute value
  enabled BOOLEAN DEFAULT true,
  product_ids UUID [],
  -- if null, applies to all products
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Alerts table (triggered alerts)
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  threshold_id UUID REFERENCES alert_thresholds(id) ON DELETE
  SET NULL,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    old_value DECIMAL(10, 2),
    new_value DECIMAL(10, 2) NOT NULL,
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged BOOLEAN DEFAULT false
);
-- Scrape logs table
CREATE TABLE IF NOT EXISTS scrape_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE,
  marketplace TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  products_scraped INTEGER DEFAULT 0,
  duration_ms INTEGER,
  errors TEXT [],
  scraped_at TIMESTAMPTZ DEFAULT NOW()
);
-- Disable RLS for all tables (for development/server-side access)
-- In production, you may want to enable RLS with proper policies
ALTER TABLE competitors DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE price_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE internal_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_mappings DISABLE ROW LEVEL SECURITY;
ALTER TABLE alert_thresholds DISABLE ROW LEVEL SECURITY;
ALTER TABLE alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_logs DISABLE ROW LEVEL SECURITY;
-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_competitor ON products(competitor_id);
CREATE INDEX IF NOT EXISTS idx_products_url ON products(url);
CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_scraped_at ON price_history(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_alerts_triggered_at ON alerts(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_scrape_logs_marketplace ON scrape_logs(marketplace);
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ language 'plpgsql';
-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_competitors_updated_at ON competitors;
CREATE TRIGGER update_competitors_updated_at BEFORE
UPDATE ON competitors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE
UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_internal_products_updated_at ON internal_products;
CREATE TRIGGER update_internal_products_updated_at BEFORE
UPDATE ON internal_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_product_mappings_updated_at ON product_mappings;
CREATE TRIGGER update_product_mappings_updated_at BEFORE
UPDATE ON product_mappings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_alert_thresholds_updated_at ON alert_thresholds;
CREATE TRIGGER update_alert_thresholds_updated_at BEFORE
UPDATE ON alert_thresholds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Insert default competitors
INSERT INTO competitors (
    name,
    marketplace,
    base_url,
    category_url,
    enabled
  )
VALUES (
    'MedsGo Pharmacy',
    'medsgo',
    'https://medsgo.ph',
    'https://medsgo.ph/prescription-medicines/erectile-dysfunction/',
    true
  ),
  (
    'Watsons Philippines',
    'watsons',
    'https://www.watsons.com.ph',
    'https://www.watsons.com.ph/health-and-rx/erectile-dysfunction-ed-/c/060410',
    true
  ) ON CONFLICT (marketplace) DO NOTHING;
-- Insert default alert thresholds
INSERT INTO alert_thresholds (name, condition, value, enabled)
VALUES ('Price Drop > 10%', 'price_drop', 10, true),
  ('Price Drop > 20%', 'price_drop', 20, false),
  (
    'Price Increase > 10%',
    'price_increase',
    10,
    true
  ),
  (
    'Discount Detected',
    'discount_detected',
    0,
    true
  ),
  ('Out of Stock', 'out_of_stock', 0, true) ON CONFLICT DO NOTHING;
-- Migration: Add scraped_date column if it doesn't exist (for existing databases)
-- Run these commands manually in Supabase SQL Editor if upgrading:
-- ALTER TABLE price_history ADD COLUMN IF NOT EXISTS scraped_date DATE;
-- UPDATE price_history SET scraped_date = DATE(scraped_at) WHERE scraped_date IS NULL;
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_price_history_product_date ON price_history(product_id, scraped_date);