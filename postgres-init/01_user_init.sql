-- User Service Database Initialization
-- This file runs ONLY in db-user container

-- Create database if not exists
SELECT 'CREATE DATABASE "db-user"' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'db-user')\gexec

-- Create user for user-service if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'user-service-db') THEN
        CREATE USER "user-service-db" WITH ENCRYPTED PASSWORD 'user@!4';
    END IF;
END $$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE "db-user" TO "user-service-db";

-- Connect to the user database
\c "db-user";

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) UNIQUE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(100),
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100)
);

-- Create users table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);

-- Case-insensitive uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_ci ON users (LOWER(email));
CREATE UNIQUE INDEX IF NOT EXISTS uq_roles_role_name_ci ON roles (LOWER(role_name));

-- Insert default roles
INSERT INTO roles (role_name, is_active, created_by)
VALUES 
  ('admin', TRUE, 'system'), 
  ('customer', TRUE, 'system'),
  ('sales', TRUE, 'system')
ON CONFLICT (role_name) DO NOTHING;

-- Insert default users
-- Passwords: ChangeMeAdmin123!, ChangeMeSales123!, ChangeMeCustomer123!
INSERT INTO users (name, email, role_id, is_active, password, created_by)
VALUES 
  ('Admin User', 'admin@example.com', 
   (SELECT id FROM roles WHERE role_name = 'admin'), 
   TRUE, '$2b$10$F0t4cm5ru0qRcNjBgtCTwe70epGkwaX7.EnZBX4B26lBu7XeRISL6', 'system'),
  ('Sales Manager', 'sales@example.com', 
   (SELECT id FROM roles WHERE role_name = 'sales'), 
   TRUE, '$2b$10$w8FU3jiiun2mDN9eSc.lvul4sc8L44eVIQsIRTUDCYi4oLxvGo46O', 'system'),
  ('Customer User', 'customer@example.com', 
   (SELECT id FROM roles WHERE role_name = 'customer'), 
   TRUE, '$2b$10$hYzNoOGc9CQJxETEA/X72O3bbvfwhd..liiZbvtyURPt8iVepTMkC', 'system')
ON CONFLICT (email) DO NOTHING;

-- Grant permissions to user-service-db user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "user-service-db";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "user-service-db";

SELECT 'User database initialized successfully!' as message;
