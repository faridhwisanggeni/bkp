# RabbitMQ Message Flow Documentation

## Overview
This system implements a comprehensive RabbitMQ-based message queue system for order processing with stock validation, promo limit checking, payment processing, and automatic stock reduction.

## Architecture

### Services
1. **Order Service** (Port 3003) - Manages orders, payment processing, and publishes order events
2. **Product Service** (Port 3002) - Validates stock availability, manages promo limits, and handles stock reduction
3. **RabbitMQ** (Port 5672/15672) - Message broker
4. **Redis** (Optional) - Stock caching

## Message Flow

### 1. Complete Order Processing Flow

```
Frontend → Order Service → RabbitMQ → Product Service → RabbitMQ → Order Service → Payment → Stock Reduction
```

#### Step 1: Order Creation
- User creates order via frontend
- Order Service saves order to database with status `pending`
- Order Service publishes `order.created` event to RabbitMQ

#### Step 2: Stock Validation
- Product Service consumes `order.created` event
- Validates each product in the order:
  - Checks if product exists
  - Checks if product is active
  - Checks if sufficient stock is available
  - Gets maximum promo quantity for promo items
- Publishes `stock.validation.response` event with stock info and promo limits

#### Step 3: Order Processing Decision
- Order Service consumes stock validation response
- **If stock insufficient**: Order status → `cancelled`
- **If stock available**:
  - **Has promo items**: Validate daily promo limits
  - **No promo items**: Order status → `ready_for_payment`

#### Step 4: Promo Limit Validation (if applicable)
- Order Service checks user's daily promo usage against maximum limits
- **If within limits**: Order status → `ready_for_payment`
- **If exceeds limits**: Order status → `cancelled`

#### Step 5: Payment Processing
- Frontend redirects user to payment page
- User enters credit card information
- Frontend calls `/orders/{orderId}/complete-payment` endpoint
- Order Service processes payment (always successful for demo)
- Order status → `completed`
- Order Service publishes `order.completed` event

#### Step 6: Stock Reduction
- Product Service consumes `order.completed` event
- Reduces stock for each product in the order
- Updates Redis cache with new stock levels
- Logs stock reduction activities

## RabbitMQ Configuration

### Exchanges
- `order.events` (topic) - For order-related events
- `stock.events` (topic) - For stock validation events

### Queues and Routing Keys

#### Order Service Queues
- `order.created` → `order.events` with routing key `order.created`
- `order.updated` → `order.events` with routing key `order.updated`
- `order.completed` → `order.events` with routing key `order.completed`
- `order.stock.validation.response` → `stock.events` with routing key `stock.validation.response`
- `order.stock.limit.response` → `stock.events` with routing key `stock.limit.response`

#### Product Service Queues
- `product.order.created` → `order.events` with routing key `order.created`
- `product.order.updated` → `order.events` with routing key `order.updated`
- `stock.validation.response` → `stock.events` with routing key `stock.validation.response`
- `stock.limit.response` → `stock.events` with routing key `stock.limit.response`

## Message Formats

### Order Created Event
```json
{
  "eventType": "order_created",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "data": {
    "order_id": "uuid",
    "username": "user123",
    "total_harga": 100000,
    "order_status": "pending",
    "order_date": "2024-01-01T00:00:00.000Z",
    "items": [
      {
        "id_product": 1,
        "qty": 2,
        "original_price": 50000,
        "id_promo": null,
        "deduct_price": 0,
        "total_price": 100000
      }
    ]
  }
}
```

### Stock Validation Response
```json
{
  "eventType": "stock_validation_response",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "data": {
    "order_id": "uuid",
    "username": "user123",
    "validation_result": {
      "order_id": "uuid",
      "is_stock_valid": true,
      "total_requested_qty": 2,
      "validation_details": [
        {
          "id_product": 1,
          "product_name": "Product Name",
          "requested_qty": 2,
          "available_stock": 10,
          "is_valid": true,
          "reason": "Stock available"
        }
      ],
      "validated_at": "2024-01-01T00:00:00.000Z"
    },
    "processed_by": "product-service"
  }
}
```

### Stock Limit Response
```json
{
  "eventType": "stock_limit_response",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "data": {
    "order_id": "uuid",
    "username": "user123",
    "limit_validation": {
      "order_id": "uuid",
      "username": "user123",
      "date": "2024-01-01",
      "current_daily_qty": 3,
      "requested_qty": 2,
      "new_total_qty": 5,
      "daily_limit": 10,
      "is_within_limit": true,
      "reason": "Within daily limit",
      "validated_at": "2024-01-01T00:00:00.000Z"
    },
    "processed_by": "product-service"
  }
}
```

## Order Status Flow

1. `pending` - Initial status when order is created
2. `ready_for_payment` - Order passed all validations and is ready for payment
3. `completed` - Payment completed successfully, stock will be reduced
4. `cancelled` - Order failed validation (insufficient stock or exceeded promo limits)
5. `failed` - Order processing failed due to system error

## Configuration

### Environment Variables

#### Order Service
```env
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=admin123
RABBITMQ_VHOST=/
```

#### Product Service
```env
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=admin123
RABBITMQ_VHOST=/
DAILY_ORDER_LIMIT=10
```

## Testing the Flow

### 1. Start Services
```bash
make restart
```

### 2. Create Test Order (No Promo)
```bash
curl -X POST http://localhost:3003/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "total_harga": 100000,
    "items": [
      {
        "id_product": 1,
        "qty": 2,
        "original_price": 50000,
        "total_price": 100000
      }
    ]
  }'
```

### 3. Create Test Order (With Promo)
```bash
curl -X POST http://localhost:3003/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "total_harga": 80000,
    "items": [
      {
        "id_product": 1,
        "qty": 2,
        "original_price": 50000,
        "id_promo": 1,
        "deduct_price": 20000,
        "total_price": 80000
      }
    ]
  }'
```

### 4. Check Order Status
```bash
curl http://localhost:3003/api/orders/{ORDER_ID}
```

### 5. Complete Payment (when status is ready_for_payment)
```bash
curl -X POST http://localhost:3003/api/orders/{ORDER_ID}/complete-payment \
  -H "Content-Type: application/json" \
  -d '{
    "payment_method": "credit_card",
    "card_number": "1234567890123456"
  }'
```

### 6. Monitor Logs
- Order Service: `docker logs -f order-service`
- Product Service: `docker logs -f product-service`

### 7. Check RabbitMQ Management UI
- URL: http://localhost:15672
- Username: admin
- Password: admin123

## Error Handling

### Retry Logic
- Messages are requeued on processing failure
- Failed orders are marked with `failed` status
- Stale validation results are cleaned up after 5 minutes

### Monitoring
- Health check endpoints available on both services
- RabbitMQ connection status included in health checks
- Comprehensive logging for debugging

## Troubleshooting

### Data Persistence Issue
If you see old data after `make restart-full`, it means Docker volumes weren't properly removed:

**Problem**: `make restart-full` should remove all data but old orders still appear
**Solution**: 
1. Run `make down` to ensure all volumes are removed
2. Verify with `docker volume ls | grep -E "(bkp|user|product|order|rabbitmq)"`
3. If volumes still exist, manually remove them:
   ```bash
   docker volume rm bkp_db_user_data bkp_db_product_data bkp_db_order_data bkp_rabbitmq_data
   ```
4. Then run `make up` to start fresh

### Build Issues
If Docker build fails with npm errors:
1. Run `npm install` in each service directory first
2. Then run `make up`

### Container Not Starting
If containers fail to start:
1. Check logs: `docker compose logs [service-name]`
2. Ensure all required ports are available
3. Try `make clean` for deep cleanup

## Benefits

1. **Decoupled Architecture** - Services communicate asynchronously
2. **Scalability** - Easy to scale individual services
3. **Reliability** - Message persistence and retry mechanisms
4. **Flexibility** - Easy to add new validation rules or services
5. **Monitoring** - Clear message flow and status tracking
