-- Create databases (with error handling)
SELECT 'CREATE DATABASE "db-user"' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'db-user')\gexec
SELECT 'CREATE DATABASE "db-product"' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'db-product')\gexec
SELECT 'CREATE DATABASE "order_db"' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'order_db')\gexec

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
GRANT ALL PRIVILEGES ON DATABASE "order_db" TO "postgres";

-- Database initialization completed
-- Subsequent files will create schemas and data for each database
SELECT 'Database creation completed. Schema creation will follow in subsequent files.' as message;
