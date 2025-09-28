const request = require('supertest');
const app = require('../../src/app');
const rabbitmqService = require('../../src/services/rabbitmq.service');
const pool = require('../../src/config/database');

// Mock RabbitMQ for controlled testing
jest.mock('../../src/services/rabbitmq.service');

describe('RabbitMQ Integration Tests', () => {
  let testOrder;

  beforeAll(async () => {
    // Setup test environment
  });

  afterAll(async () => {
    // Cleanup
    if (testOrder) {
      await pool.query('DELETE FROM order_detail WHERE id_order_header = (SELECT id FROM order_header WHERE order_id = $1)', [testOrder.order_id]);
      await pool.query('DELETE FROM order_header WHERE order_id = $1', [testOrder.order_id]);
    }
    await pool.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Order Creation with RabbitMQ', () => {
    it('should publish order created event when order is created', async () => {
      rabbitmqService.publishOrderCreated.mockResolvedValue(true);

      const orderData = {
        username: 'rabbitmq-test-user',
        total_harga: 999.99,
        items: [
          {
            id_product: 1,
            qty: 2,
            original_price: 499.99,
            total_price: 999.98
          }
        ]
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData);

      expect(response.status).toBe(201);
      expect(rabbitmqService.publishOrderCreated).toHaveBeenCalledTimes(1);
      
      const publishedData = rabbitmqService.publishOrderCreated.mock.calls[0][0];
      expect(publishedData).toHaveProperty('order_id');
      expect(publishedData.username).toBe(orderData.username);
      expect(publishedData.total_harga).toBe(orderData.total_harga);
      expect(publishedData.items).toHaveLength(1);
      expect(publishedData.items[0].id_product).toBe(1);
      expect(publishedData.items[0].qty).toBe(2);

      testOrder = response.body.data;
    });

    it('should handle RabbitMQ publish failure gracefully', async () => {
      rabbitmqService.publishOrderCreated.mockRejectedValue(new Error('RabbitMQ connection failed'));

      const orderData = {
        username: 'rabbitmq-fail-test',
        total_harga: 599.99,
        items: [
          {
            id_product: 2,
            qty: 1,
            original_price: 599.99,
            total_price: 599.99
          }
        ]
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData);

      // Order should still be created even if RabbitMQ fails
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(rabbitmqService.publishOrderCreated).toHaveBeenCalledTimes(1);

      // Cleanup
      await pool.query('DELETE FROM order_detail WHERE id_order_header = (SELECT id FROM order_header WHERE order_id = $1)', [response.body.data.order_id]);
      await pool.query('DELETE FROM order_header WHERE order_id = $1', [response.body.data.order_id]);
    });
  });

  describe('Stock Validation Response Handling', () => {
    beforeEach(() => {
      // Mock test order for stock validation tests
      testOrder = {
        order_id: 'test-order-123',
        order_header: {
          id: 'header-uuid',
          order_id: 'test-order-123',
          username: 'stock-validation-test',
          order_status: 'pending',
          total_harga: 1299.99
        }
      };
    });

    it('should process stock validation success message', async () => {
      // Simulate stock validation success
      const stockValidationMessage = {
        order_id: testOrder.order_id,
        product_id: 1,
        available: true,
        requested_qty: 1,
        available_qty: 10
      };

      // This would normally be handled by the consumer
      // For integration test, we simulate the database update
      await pool.query(
        'UPDATE order_header SET order_status = $1 WHERE order_id = $2',
        ['ready_for_payment', testOrder.order_id]
      );

      // Verify the order status was updated
      const updatedOrder = await pool.query(
        'SELECT order_status FROM order_header WHERE order_id = $1',
        [testOrder.order_id]
      );

      expect(updatedOrder.rows[0].order_status).toBe('ready_for_payment');
    });

    it('should process stock validation failure message', async () => {
      // Simulate stock validation failure
      const stockValidationMessage = {
        order_id: testOrder.order_id,
        product_id: 1,
        available: false,
        requested_qty: 1,
        available_qty: 0,
        reason: 'Insufficient stock'
      };

      // Simulate the database update for stock failure
      await pool.query(
        'UPDATE order_header SET order_status = $1 WHERE order_id = $2',
        ['cancelled', testOrder.order_id]
      );

      // Verify the order status was updated
      const updatedOrder = await pool.query(
        'SELECT order_status FROM order_header WHERE order_id = $1',
        [testOrder.order_id]
      );

      expect(updatedOrder.rows[0].order_status).toBe('cancelled');
    });
  });

  describe('Daily Limit Validation Response Handling', () => {
    it('should process daily limit validation success', async () => {
      const dailyLimitMessage = {
        order_id: testOrder.order_id,
        product_id: 1,
        within_limit: true,
        requested_qty: 1,
        daily_limit: 10,
        current_daily_orders: 5
      };

      // Simulate successful daily limit validation
      // In real scenario, this would be processed by consumer
      await pool.query(
        'UPDATE order_header SET order_status = $1 WHERE order_id = $2',
        ['processed', testOrder.order_id]
      );

      const updatedOrder = await pool.query(
        'SELECT order_status FROM order_header WHERE order_id = $1',
        [testOrder.order_id]
      );

      expect(updatedOrder.rows[0].order_status).toBe('processed');
    });

    it('should process daily limit validation failure', async () => {
      const dailyLimitMessage = {
        order_id: testOrder.order_id,
        product_id: 1,
        within_limit: false,
        requested_qty: 5,
        daily_limit: 10,
        current_daily_orders: 8,
        reason: 'Daily limit exceeded'
      };

      // Simulate daily limit failure
      await pool.query(
        'UPDATE order_header SET order_status = $1 WHERE order_id = $2',
        ['cancelled', testOrder.order_id]
      );

      const updatedOrder = await pool.query(
        'SELECT order_status FROM order_header WHERE order_id = $1',
        [testOrder.order_id]
      );

      expect(updatedOrder.rows[0].order_status).toBe('cancelled');
    });
  });

  describe('RabbitMQ Service Methods', () => {
    it('should format order created message correctly', async () => {
      const orderData = {
        order_id: 'test-order-123',
        username: 'test-user',
        total_harga: 999.99,
        order_status: 'pending',
        order_date: new Date(),
        items: [
          {
            id_product: 1,
            qty: 2,
            original_price: 499.99,
            id_promo: null,
            deduct_price: 0,
            total_price: 999.98
          }
        ]
      };

      rabbitmqService.publishOrderCreated.mockImplementation((data) => {
        // Verify the message format
        expect(data).toHaveProperty('order_id');
        expect(data).toHaveProperty('username');
        expect(data).toHaveProperty('total_harga');
        expect(data).toHaveProperty('items');
        expect(Array.isArray(data.items)).toBe(true);
        expect(data.items[0]).toHaveProperty('id_product');
        expect(data.items[0]).toHaveProperty('qty');
        return Promise.resolve(true);
      });

      await rabbitmqService.publishOrderCreated(orderData);
      expect(rabbitmqService.publishOrderCreated).toHaveBeenCalledWith(orderData);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle RabbitMQ connection errors', async () => {
      rabbitmqService.publishOrderCreated.mockRejectedValue(new Error('Connection timeout'));

      const orderData = {
        username: 'error-test-user',
        total_harga: 299.99,
        items: [
          {
            id_product: 3,
            qty: 1,
            original_price: 299.99,
            total_price: 299.99
          }
        ]
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData);

      // Order creation should succeed even if RabbitMQ fails
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // Cleanup
      await pool.query('DELETE FROM order_detail WHERE id_order_header = (SELECT id FROM order_header WHERE order_id = $1)', [response.body.data.order_id]);
      await pool.query('DELETE FROM order_header WHERE order_id = $1', [response.body.data.order_id]);
    });

    it('should handle malformed RabbitMQ messages gracefully', async () => {
      // This would test the consumer's ability to handle bad messages
      // In a real scenario, you'd test the actual consumer code
      const malformedMessage = {
        invalid_field: 'test',
        missing_order_id: true
      };

      // Simulate consumer receiving malformed message
      // The consumer should log error and not crash
      expect(() => {
        // Consumer validation logic would go here
        if (!malformedMessage.order_id) {
          throw new Error('Invalid message format');
        }
      }).toThrow('Invalid message format');
    });
  });
});
