# Database Setup Documentation

## Overview
This system uses multiple PostgreSQL databases for different services, all coordinated through Docker Compose with centralized initialization scripts.

## Database Architecture

### 1. User Database (`db-user`)
- **Port**: 5432
- **Database Name**: `db-user`
- **User**: `user-service-db`
- **Password**: `user@!4`
- **Tables**:
  - `roles` - User roles (admin, customer, sales)
  - `users` - User accounts with role assignments

### 2. Product Database (`db-product`)
- **Port**: 5433
- **Database Name**: `db-product`
- **User**: `product-service-db`
- **Password**: `product-service-password`
- **Tables**:
  - `products` - Product catalog with stock information
  - `promotions` - Product promotions and discounts

### 3. Order Database (`db-order`)
- **Port**: 5434
- **Database Name**: `order_db`
- **User**: `postgres`
- **Password**: `postgres`
- **Tables**:
  - `order_header` - Order main information
  - `order_detail` - Order line items
- **Views**:
  - `order_summary` - Aggregated order information

## Initialization Process

All databases are initialized using scripts in the `/postgres-init` folder:

1. **`01_init.sql`** - Creates user and product databases only
2. **`user-service-data/01_users.sql`** - User service schema and data
3. **`product-service-data/01_products.sql`** - Product service schema and data  
4. **`order-service-data/01_order_schema.sql`** - Order service schema only (no sample data)

### Folder Structure
```
postgres-init/
├── 01_init.sql                    # Creates db-user and db-product
├── user-service-data/
│   └── 01_users.sql              # Users & roles schema + data
├── product-service-data/
│   └── 01_products.sql           # Products & promotions schema + data
└── order-service-data/
    └── 01_order_schema.sql       # Orders schema only
```

**Note**: Each database container (db-user, db-product, db-order) runs independently with their own initialization scripts. The order database is created automatically by the db-order container using the order-service-data folder.

## Order Status Flow

The order system supports the following statuses:
- `pending` - Order created, waiting for validation
- `ready_for_payment` - Order validated, ready for payment
- `completed` - Payment completed, stock will be reduced
- `cancelled` - Order cancelled (insufficient stock/promo limits)
- `failed` - System error during processing

## Sample Data

### Users
- **Admin**: admin@example.com / ChangeMeAdmin123!
- **Sales**: sales@example.com / ChangeMeSales123!
- **Customer**: customer@example.com / ChangeMeCustomer123!

### Products
- **Laptop Gaming ROG**: $1,299.99 (25 in stock)
- **iPhone 15 Pro**: $999.99 (12 in stock)

### Promotions
- **Flash Sale Weekend**: 15% discount on Laptop Gaming ROG (max 2 items)

### Sample Orders
- No sample orders - database starts clean
- Orders will be created through the application

## Database Connections

### From Services
```javascript
// Order Service
const pool = new Pool({
  host: process.env.DB_HOST || 'db-order',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'order_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
})

// Product Service
const pool = new Pool({
  host: process.env.DB_HOST || 'db-product',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'db-product',
  user: process.env.DB_USER || 'product-service-db',
  password: process.env.DB_PASSWORD || 'product-service-password'
})

// User Service
const pool = new Pool({
  host: process.env.DB_HOST || 'db-user',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'db-user',
  user: process.env.DB_USER || 'user-service-db',
  password: process.env.DB_PASSWORD || 'user@!4'
})
```

### External Connections
```bash
# Connect to user database
psql -h localhost -p 5432 -U user-service-db -d db-user

# Connect to product database
psql -h localhost -p 5433 -U product-service-db -d db-product

# Connect to order database
psql -h localhost -p 5434 -U postgres -d order_db
```

## Troubleshooting

### Database Not Found Error
If you see "relation does not exist" errors:

1. **Check if containers are running**:
   ```bash
   docker ps | grep db-
   ```

2. **Check database initialization logs**:
   ```bash
   docker logs db-order
   docker logs db-product
   docker logs db-user
   ```

3. **Manually connect and verify tables**:
   ```bash
   docker exec -it db-order psql -U postgres -d order_db -c "\dt"
   ```

4. **Restart with fresh data**:
   ```bash
   make restart-full
   ```

### Permission Issues
If you see permission denied errors:
```bash
# Check user permissions
docker exec -it db-order psql -U postgres -d order_db -c "\du"

# Grant permissions manually if needed
docker exec -it db-order psql -U postgres -d order_db -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;"
```

### Data Consistency
To ensure all databases have fresh data:
```bash
# Stop all services
make down

# Verify volumes are removed
docker volume ls | grep bkp

# Start fresh
make up
```

## Backup and Restore

### Backup
```bash
# Backup all databases
docker exec db-user pg_dump -U user-service-db db-user > backup_user.sql
docker exec db-product pg_dump -U product-service-db db-product > backup_product.sql
docker exec db-order pg_dump -U postgres order_db > backup_order.sql
```

### Restore
```bash
# Restore databases
docker exec -i db-user psql -U user-service-db db-user < backup_user.sql
docker exec -i db-product psql -U product-service-db db-product < backup_product.sql
docker exec -i db-order psql -U postgres order_db < backup_order.sql
```
