-- Product Service Database Initialization
-- This file runs ONLY in db-product container

-- Create database if not exists
SELECT 'CREATE DATABASE "db-product"' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'db-product')\gexec

-- Create user for product-service if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'product-service-db') THEN
        CREATE USER "product-service-db" WITH ENCRYPTED PASSWORD 'product@!4';
    END IF;
END $$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE "db-product" TO "product-service-db";

-- Connect to the product database
\c "db-product";

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  product_name VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  qty INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(100),
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100)
);

-- Create promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  promotion_name VARCHAR(200) NOT NULL,
  promotion_type VARCHAR(50) NOT NULL DEFAULT 'discount',
  discount INTEGER NOT NULL DEFAULT 0,
  qty_max INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  deleted_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(100),
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100),
  CONSTRAINT check_promotion_dates CHECK (ended_at > started_at),
  CONSTRAINT check_discount_range CHECK (discount >= 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_product_name ON products(product_name);
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at);
CREATE INDEX IF NOT EXISTS idx_promotions_product_id ON promotions(product_id);
CREATE INDEX IF NOT EXISTS idx_promotions_is_active ON promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(started_at, ended_at);
CREATE INDEX IF NOT EXISTS idx_promotions_deleted_at ON promotions(deleted_at);

-- Insert sample products
INSERT INTO products (product_name, price, qty, is_active, created_by)
VALUES 
  ('Laptop Gaming ROG', 1299.99, 25, TRUE, 'system'),
  ('iPhone 15 Pro', 999.99, 12, TRUE, 'system'),
  ('Samsung Galaxy S24', 899.99, 15, TRUE, 'system'),
  ('MacBook Pro M3', 1999.99, 8, TRUE, 'system')
ON CONFLICT DO NOTHING;

-- Insert sample promotions
INSERT INTO promotions (product_id, promotion_name, promotion_type, discount, qty_max, is_active, started_at, ended_at, created_by)
VALUES 
  (1, 'Flash Sale Weekend - Laptop Gaming', 'discount', 15, 2, TRUE, '2024-01-20 00:00:00+07', '2024-12-31 23:59:59+07', 'system'),
  (2, 'iPhone Holiday Special', 'discount', 10, 1, TRUE, '2024-01-20 00:00:00+07', '2024-12-31 23:59:59+07', 'system')
ON CONFLICT DO NOTHING;

-- Grant permissions to product-service-db user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "product-service-db";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "product-service-db";

SELECT 'Product database initialized successfully!' as message;
