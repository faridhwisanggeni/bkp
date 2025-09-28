-- Schema and seed for order-service

-- Create order_header table
CREATE TABLE IF NOT EXISTS order_header (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    order_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'ready_for_payment', 'completed', 'cancelled', 'failed')),
    total_harga DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create order_detail table
CREATE TABLE IF NOT EXISTS order_detail (
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
CREATE INDEX IF NOT EXISTS idx_order_header_order_id ON order_header(order_id);
CREATE INDEX IF NOT EXISTS idx_order_header_username ON order_header(username);
CREATE INDEX IF NOT EXISTS idx_order_header_status ON order_header(order_status);
CREATE INDEX IF NOT EXISTS idx_order_header_date ON order_header(order_date);
CREATE INDEX IF NOT EXISTS idx_order_detail_order_header ON order_detail(id_order_header);
CREATE INDEX IF NOT EXISTS idx_order_detail_product ON order_detail(id_product);
CREATE INDEX IF NOT EXISTS idx_order_detail_promo ON order_detail(id_promo);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS update_order_header_updated_at ON order_header;
CREATE TRIGGER update_order_header_updated_at 
    BEFORE UPDATE ON order_header 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create a view for order summary
CREATE OR REPLACE VIEW order_summary AS
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

-- Grant permissions to postgres user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Display success message
SELECT 'Order service schema created successfully!' as message;
