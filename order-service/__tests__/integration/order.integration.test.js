const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/config/database');

describe('Order Integration Tests', () => {
  let testOrder;

  beforeAll(async () => {
    // Setup test database connection
  });

  afterAll(async () => {
    // Cleanup test data
    if (testOrder) {
      await pool.query('DELETE FROM order_detail WHERE id_order_header = (SELECT id FROM order_header WHERE order_id = $1)', [testOrder.order_id]);
      await pool.query('DELETE FROM order_header WHERE order_id = $1', [testOrder.order_id]);
    }
    await pool.end();
  });

  beforeEach(async () => {
    // Clean up any existing test data
    await pool.query('DELETE FROM order_detail WHERE id_order_header IN (SELECT id FROM order_header WHERE username LIKE $1)', ['%integration-test%']);
    await pool.query('DELETE FROM order_header WHERE username LIKE $1', ['%integration-test%']);
  });

  describe('Order Creation Flow', () => {
    it('should create order with multiple items successfully', async () => {
      const orderData = {
        username: 'integration-test-user',
        total_harga: 2299.98,
        items: [
          {
            id_product: 1,
            qty: 1,
            original_price: 1299.99,
            id_promo: 1,
            deduct_price: 195.00,
            total_price: 1104.99
          },
          {
            id_product: 2,
            qty: 1,
            original_price: 999.99,
            id_promo: null,
            deduct_price: 0,
            total_price: 999.99
          }
        ]
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('order_id');
      expect(response.body.data.orderHeader.username).toBe(orderData.username);
      expect(response.body.data.orderHeader.order_status).toBe('pending');
      expect(response.body.data.orderDetails).toHaveLength(2);

      testOrder = response.body.data;

      // Verify in database
      const dbOrder = await pool.query(
        'SELECT * FROM order_header WHERE order_id = $1',
        [testOrder.order_id]
      );
      expect(dbOrder.rows).toHaveLength(1);
      expect(dbOrder.rows[0].username).toBe(orderData.username);

      const dbDetails = await pool.query(
        'SELECT * FROM order_detail WHERE id_order_header = $1',
        [dbOrder.rows[0].id]
      );
      expect(dbDetails.rows).toHaveLength(2);
    });

    it('should handle single item order', async () => {
      const orderData = {
        username: 'integration-test-single',
        total_harga: 999.99,
        items: [
          {
            id_product: 1,
            qty: 1,
            original_price: 999.99,
            id_promo: null,
            deduct_price: 0,
            total_price: 999.99
          }
        ]
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.orderDetails).toHaveLength(1);

      // Cleanup
      await pool.query('DELETE FROM order_detail WHERE id_order_header = (SELECT id FROM order_header WHERE order_id = $1)', [response.body.data.order_id]);
      await pool.query('DELETE FROM order_header WHERE order_id = $1', [response.body.data.order_id]);
    });
  });

  describe('Order Retrieval', () => {
    beforeEach(async () => {
      // Create test order for retrieval tests
      const orderData = {
        username: 'integration-test-retrieval',
        total_harga: 1299.99,
        items: [
          {
            id_product: 1,
            qty: 1,
            original_price: 1299.99,
            total_price: 1299.99
          }
        ]
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData);

      testOrder = response.body.data;
    });

    it('should retrieve order by order_id', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrder.order_id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.order_id).toBe(testOrder.order_id);
      expect(response.body.data.username).toBe('integration-test-retrieval');
      expect(response.body.data.order_details).toBeDefined();
    });

    it('should retrieve orders by username', async () => {
      const response = await request(app)
        .get('/api/orders/user/integration-test-retrieval');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].username).toBe('integration-test-retrieval');
    });

    it('should retrieve all orders with pagination', async () => {
      const response = await request(app)
        .get('/api/orders')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter orders by status', async () => {
      const response = await request(app)
        .get('/api/orders')
        .query({ status: 'pending' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      if (response.body.data.length > 0) {
        response.body.data.forEach(order => {
          expect(order.order_status).toBe('pending');
        });
      }
    });
  });

  describe('Order Status Updates', () => {
    beforeEach(async () => {
      // Create test order for status update tests
      const orderData = {
        username: 'integration-test-status',
        total_harga: 999.99,
        items: [
          {
            id_product: 1,
            qty: 1,
            original_price: 999.99,
            total_price: 999.99
          }
        ]
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData);

      testOrder = response.body.data;
    });

    it('should update order status successfully', async () => {
      const statusUpdates = ['ready_for_payment', 'completed'];

      for (const status of statusUpdates) {
        const response = await request(app)
          .put(`/api/orders/${testOrder.order_id}/status`)
          .send({ status });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.order_status).toBe(status);

        // Verify in database
        const dbCheck = await pool.query(
          'SELECT order_status FROM order_header WHERE order_id = $1',
          [testOrder.order_id]
        );
        expect(dbCheck.rows[0].order_status).toBe(status);
      }
    });

    it('should reject invalid status updates', async () => {
      const response = await request(app)
        .put(`/api/orders/${testOrder.order_id}/status`)
        .send({ status: 'invalid_status' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid status');
    });

    it('should handle non-existent order status update', async () => {
      const response = await request(app)
        .put('/api/orders/non-existent-order-id/status')
        .send({ status: 'completed' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Order not found');
    });
  });

  describe('Order Validation', () => {
    it('should validate required fields', async () => {
      const invalidOrder = {
        username: '', // empty username
        total_harga: -100, // negative total
        items: [] // empty items
      };

      const response = await request(app)
        .post('/api/orders')
        .send(invalidOrder);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should validate item fields', async () => {
      const invalidOrder = {
        username: 'test-user',
        total_harga: 100,
        items: [
          {
            id_product: 'invalid', // should be number
            qty: 0, // should be > 0
            original_price: -10, // should be >= 0
            total_price: -5 // should be >= 0
          }
        ]
      };

      const response = await request(app)
        .post('/api/orders')
        .send(invalidOrder);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Order Business Logic', () => {
    it('should handle order with promotions correctly', async () => {
      const orderData = {
        username: 'integration-test-promo',
        total_harga: 1104.99,
        items: [
          {
            id_product: 1,
            qty: 1,
            original_price: 1299.99,
            id_promo: 1,
            deduct_price: 195.00,
            total_price: 1104.99
          }
        ]
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData);

      expect(response.status).toBe(201);
      expect(response.body.data.orderDetails[0].id_promo).toBe(1);
      expect(parseFloat(response.body.data.orderDetails[0].deduct_price)).toBe(195.00);
      expect(parseFloat(response.body.data.orderDetails[0].total_price)).toBe(1104.99);

      // Cleanup
      await pool.query('DELETE FROM order_detail WHERE id_order_header = (SELECT id FROM order_header WHERE order_id = $1)', [response.body.data.order_id]);
      await pool.query('DELETE FROM order_header WHERE order_id = $1', [response.body.data.order_id]);
    });
  });
});
