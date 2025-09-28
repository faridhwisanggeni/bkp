-- Create database
CREATE DATABASE order_db;

-- Connect to the database
\c order_db;

-- Create order_header table
CREATE TABLE order_header (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    order_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'processed', 'done')),
    total_harga DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create order_detail table
CREATE TABLE order_detail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_order_header UUID NOT NULL REFERENCES order_header(id) ON DELETE CASCADE,
    id_product INTEGER NOT NULL,
    qty INTEGER NOT NULL DEFAULT 1 CHECK (qty > 0),
    original_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    id_promo INTEGER NULL,
    deduct_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_order_header_order_id ON order_header(order_id);
CREATE INDEX idx_order_header_username ON order_header(username);
CREATE INDEX idx_order_header_status ON order_header(order_status);
CREATE INDEX idx_order_header_date ON order_header(order_date);
CREATE INDEX idx_order_detail_order_header ON order_detail(id_order_header);
CREATE INDEX idx_order_detail_product ON order_detail(id_product);
CREATE INDEX idx_order_detail_promo ON order_detail(id_promo);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_order_header_updated_at 
    BEFORE UPDATE ON order_header 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO order_header (order_id, username, order_status, total_harga) VALUES
    (gen_random_uuid(), 'testuser', 'pending', 1299.99),
    (gen_random_uuid(), 'testuser', 'processed', 899.99),
    (gen_random_uuid(), 'admin', 'done', 1599.99);

-- Get the order IDs for sample order details
DO $$
DECLARE
    order1_id UUID;
    order2_id UUID;
    order3_id UUID;
BEGIN
    SELECT id INTO order1_id FROM order_header WHERE username = 'testuser' AND total_harga = 1299.99 LIMIT 1;
    SELECT id INTO order2_id FROM order_header WHERE username = 'testuser' AND total_harga = 899.99 LIMIT 1;
    SELECT id INTO order3_id FROM order_header WHERE username = 'admin' AND total_harga = 1599.99 LIMIT 1;
    
    -- Insert sample order details
    INSERT INTO order_detail (id_order_header, id_product, qty, original_price, id_promo, deduct_price, total_price) VALUES
        (order1_id, 1, 1, 1299.99, 1, 195.00, 1104.99),
        (order2_id, 2, 1, 899.99, NULL, 0, 899.99),
        (order3_id, 3, 2, 799.99, 2, 160.00, 1439.98);
END $$;

-- Create a view for order summary
CREATE VIEW order_summary AS
SELECT 
    oh.order_id,
    oh.username,
    oh.order_date,
    oh.order_status,
    oh.total_harga,
    COUNT(od.id) as total_items,
    SUM(od.qty) as total_quantity
FROM order_header oh
LEFT JOIN order_detail od ON oh.id = od.id_order_header
GROUP BY oh.id, oh.order_id, oh.username, oh.order_date, oh.order_status, oh.total_harga;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE order_db TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Display success message
SELECT 'Order database initialized successfully!' as message;
