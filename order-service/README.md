# Order Service

Order Service untuk BKP Commerce yang mengelola pembuatan dan pengelolaan order.

## Features

- ✅ Create Order dengan order details
- ✅ Get Order by Order ID
- ✅ Get Orders by Username
- ✅ Update Order Status
- ✅ PostgreSQL Database dengan relasi
- ✅ Input validation dengan Joi
- ✅ Error handling yang comprehensive
- ✅ Transaction support untuk data consistency

## Database Schema

### order_header
```sql
- id (UUID, Primary Key)
- order_id (UUID, Unique)
- username (VARCHAR(50))
- order_date (TIMESTAMP)
- order_status (ENUM: 'pending', 'processed', 'done')
- total_harga (DECIMAL(12,2))
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### order_detail
```sql
- id (UUID, Primary Key)
- id_order_header (UUID, Foreign Key)
- id_product (INTEGER)
- qty (INTEGER)
- original_price (DECIMAL(10,2))
- id_promo (INTEGER, Nullable)
- deduct_price (DECIMAL(10,2))
- total_price (DECIMAL(10,2))
- created_at (TIMESTAMP)
```

## API Endpoints

### 1. Create Order
```
POST /api/orders
```

**Request Body:**
```json
{
  "username": "testuser",
  "total_harga": 1299.99,
  "items": [
    {
      "id_product": 1,
      "qty": 1,
      "original_price": 1299.99,
      "id_promo": 1,
      "deduct_price": 195.00,
      "total_price": 1104.99
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order_id": "uuid-here",
    "order_header": {...},
    "order_details": [...]
  }
}
```

### 2. Get Order by Order ID
```
GET /api/orders/:orderId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "order_id": "uuid",
    "username": "testuser",
    "order_date": "2024-01-01T00:00:00Z",
    "order_status": "pending",
    "total_harga": "1299.99",
    "order_details": [...]
  }
}
```

### 3. Get Orders by Username
```
GET /api/orders/user/:username
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "order_id": "uuid",
      "username": "testuser",
      "order_date": "2024-01-01T00:00:00Z",
      "order_status": "pending",
      "total_harga": "1299.99",
      "order_details": [...]
    }
  ]
}
```

### 4. Update Order Status
```
PUT /api/orders/:orderId/status
```

**Request Body:**
```json
{
  "status": "processed"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "id": "uuid",
    "order_id": "uuid",
    "order_status": "processed",
    ...
  }
}
```

## Environment Variables

```env
NODE_ENV=development
PORT=3003
DB_HOST=db-order
DB_PORT=5432
DB_NAME=order_db
DB_USER=postgres
DB_PASSWORD=postgres
CORS_ORIGIN=http://localhost:5173
```

## Running the Service

### With Docker Compose
```bash
# Start all services
make up

# Restart only order service
make restart
```

### Standalone Development
```bash
cd order-service
npm install
npm run dev
```

## Health Check

```
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "Order Service is running",
  "timestamp": "2024-01-01T00:00:00Z",
  "service": "order-service",
  "version": "1.0.0"
}
```

## Database Ports

- **User DB**: localhost:5432
- **Product DB**: localhost:5433
- **Order DB**: localhost:5434

## Service Ports

- **User Service**: localhost:3000
- **Product Service**: localhost:3002
- **Order Service**: localhost:3003
- **Frontend**: localhost:5173
