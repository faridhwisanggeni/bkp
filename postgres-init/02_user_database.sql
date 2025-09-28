-- User database schema and data
-- This runs after 01_init.sql

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
   TRUE, '$2b$10$vI8aWY8I3fNVmGOqMQjKQeEjKJXllVCoqjB05Jcw/BPyT6shoFhye', 'init'),
  ('Sales Manager', 'sales@example.com', 
   (SELECT id FROM roles WHERE role_name = 'sales'), 
   TRUE, '$2b$10$vI8aWY8I3fNVmGOqMQjKQeEjKJXllVCoqjB05Jcw/BPyT6shoFhye', 'init'),
  ('Customer', 'customer@example.com', 
   (SELECT id FROM roles WHERE role_name = 'customer'), 
   TRUE, '$2b$10$vI8aWY8I3fNVmGOqMQjKQeEjKJXllVCoqjB05Jcw/BPyT6shoFhye', 'init')
ON CONFLICT (email) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);

-- Case-insensitive uniqueness to prevent duplicates that differ only by case
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_ci ON users (LOWER(email));
CREATE UNIQUE INDEX IF NOT EXISTS uq_roles_role_name_ci ON roles (LOWER(role_name));

SELECT 'User database schema and data created successfully!' as message;
