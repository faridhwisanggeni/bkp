-- Create databases (with error handling)
SELECT 'CREATE DATABASE "db-user"' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'db-user')\gexec
SELECT 'CREATE DATABASE "db-product"' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'db-product')\gexec

-- Create users
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'user-service-db') THEN
        CREATE USER "user-service-db" WITH ENCRYPTED PASSWORD 'user@!4';
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'product-service-db') THEN
        CREATE USER "product-service-db" WITH ENCRYPTED PASSWORD 'product@!4';
    END IF;
END
$$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE "db-user" TO "user-service-db";
GRANT ALL PRIVILEGES ON DATABASE "db-product" TO "product-service-db";

-- Connect to db-user and create schema
\c "db-user";

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) UNIQUE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(100),
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100)
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  password VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(100),
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100)
);

-- Seed roles
INSERT INTO roles (role_name, is_active, created_by)
VALUES 
  ('admin', TRUE, 'init'), 
  ('customer', TRUE, 'init'),
  ('sales', TRUE, 'init')
ON CONFLICT (role_name) DO NOTHING;

-- Seed users
-- Note: Passwords are hashed versions using bcrypt
-- admin@example.com: ChangeMeAdmin123!
-- sales@example.com: ChangeMeSales123!
-- customer@example.com: ChangeMeCustomer123!
INSERT INTO users (name, email, role_id, is_active, password, created_by)
VALUES 
  ('Admin', 'admin@example.com', 
   (SELECT id FROM roles WHERE role_name = 'admin'), 
   TRUE, '$2b$10$F0t4cm5ru0qRcNjBgtCTwe70epGkwaX7.EnZBX4B26lBu7XeRISL6', 'init'),
  ('Sales Manager', 'sales@example.com', 
   (SELECT id FROM roles WHERE role_name = 'sales'), 
   TRUE, '$2b$10$w8FU3jiiun2mDN9eSc.lvul4sc8L44eVIQsIRTUDCYi4oLxvGo46O', 'init'),
  ('Customer', 'customer@example.com', 
   (SELECT id FROM roles WHERE role_name = 'customer'), 
   TRUE, '$2b$10$hYzNoOGc9CQJxETEA/X72O3bbvfwhd..liiZbvtyURPt8iVepTMkC', 'init')
ON CONFLICT (email) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);

-- Case-insensitive uniqueness to prevent duplicates that differ only by case
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_ci ON users (LOWER(email));
CREATE UNIQUE INDEX IF NOT EXISTS uq_roles_role_name_ci ON roles (LOWER(role_name));

-- Connect to db-product and create schema
\c "db-product";

-- Products table
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

-- Promotions table
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
  CONSTRAINT check_promotion_dates CHECK (ended_at >= started_at),
  CONSTRAINT check_discount_range CHECK (discount >= 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_product_name ON products(product_name);
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at);
CREATE INDEX IF NOT EXISTS idx_promotions_product_id ON promotions(product_id);
CREATE INDEX IF NOT EXISTS idx_promotions_is_active ON promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(started_at, ended_at);
CREATE INDEX IF NOT EXISTS idx_promotions_deleted_at ON promotions(deleted_at);

-- Seed products
INSERT INTO products (product_name, price, qty, is_active, created_by)
VALUES 
  ('Laptop Gaming ROG', 1299.99, 25, TRUE, 'seed'),
  ('iPhone 15 Pro', 999.99, 12, TRUE, 'seed')
ON CONFLICT DO NOTHING;

-- Seed promotions
INSERT INTO promotions (product_id, promotion_name, promotion_type, discount, qty_max, is_active, started_at, ended_at, created_by)
VALUES 
  (1, 'Flash Sale Weekend - Laptop Gaming', 'discount', 15, 2, TRUE, '2024-01-20 00:00:00+07', '2024-01-22 23:59:59+07', 'seed')
ON CONFLICT DO NOTHING;
