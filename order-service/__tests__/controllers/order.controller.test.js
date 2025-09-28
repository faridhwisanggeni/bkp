const request = require('supertest');
const express = require('express');
const OrderController = require('../../src/controllers/order.controller');
const OrderModel = require('../../src/models/order.model');
const rabbitmqService = require('../../src/services/rabbitmq.service');

// Mock dependencies
jest.mock('../../src/models/order.model');
jest.mock('../../src/services/rabbitmq.service');

const app = express();
app.use(express.json());
app.post('/orders', OrderController.createOrder);
app.get('/orders', OrderController.getAllOrders);
app.get('/orders/:orderId', OrderController.getOrderByOrderId);
app.get('/orders/user/:username', OrderController.getOrdersByUsername);
app.put('/orders/:orderId/status', OrderController.updateOrderStatus);

describe('OrderController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /orders', () => {
    it('should create a new order successfully', async () => {
      const orderData = {
        username: 'testuser',
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

      const createdOrder = {
        order_id: 'uuid-123',
        orderHeader: {
          id: 'header-uuid',
          order_id: 'uuid-123',
          username: 'testuser',
          order_status: 'pending',
          total_harga: 999.99,
          order_date: new Date()
        },
        orderDetails: [
          {
            id: 'detail-uuid',
            id_order_header: 'header-uuid',
            id_product: 1,
            qty: 1,
            original_price: 999.99,
            total_price: 999.99
          }
        ]
      };

      OrderModel.createOrder.mockResolvedValue(createdOrder);
      rabbitmqService.publishOrderCreated.mockResolvedValue(true);

      const response = await request(app)
        .post('/orders')
        .send(orderData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(createdOrder);
      expect(OrderModel.createOrder).toHaveBeenCalledWith(orderData);
      expect(rabbitmqService.publishOrderCreated).toHaveBeenCalled();
    });

    it('should return 400 for validation errors', async () => {
      const response = await request(app)
        .post('/orders')
        .send({
          username: 'test'
          // missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid items', async () => {
      const response = await request(app)
        .post('/orders')
        .send({
          username: 'testuser',
          total_harga: 999.99,
          items: [] // empty items array
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should handle creation errors', async () => {
      OrderModel.createOrder.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/orders')
        .send({
          username: 'testuser',
          total_harga: 999.99,
          items: [
            {
              id_product: 1,
              qty: 1,
              original_price: 999.99,
              total_price: 999.99
            }
          ]
        });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Internal server error');
    });
  });

  describe('GET /orders', () => {
    it('should return all orders with pagination', async () => {
      const mockOrders = [
        {
          id: 'uuid-1',
          order_id: 'order-1',
          username: 'user1',
          order_status: 'pending',
          total_harga: 999.99,
          order_details: []
        },
        {
          id: 'uuid-2',
          order_id: 'order-2',
          username: 'user2',
          order_status: 'completed',
          total_harga: 1299.99,
          order_details: []
        }
      ];

      OrderModel.getAllOrders.mockResolvedValue(mockOrders);

      const response = await request(app)
        .get('/orders')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockOrders);
      expect(OrderModel.getAllOrders).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        status: undefined,
        username: undefined
      });
    });

    it('should handle filtering by status and username', async () => {
      const mockOrders = [
        {
          id: 'uuid-1',
          order_id: 'order-1',
          username: 'testuser',
          order_status: 'pending',
          total_harga: 999.99
        }
      ];

      OrderModel.getAllOrders.mockResolvedValue(mockOrders);

      const response = await request(app)
        .get('/orders')
        .query({ status: 'pending', username: 'testuser' });

      expect(response.status).toBe(200);
      expect(OrderModel.getAllOrders).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        status: 'pending',
        username: 'testuser'
      });
    });

    it('should handle server errors', async () => {
      OrderModel.getAllOrders.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/orders');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Internal server error');
    });
  });

  describe('GET /orders/:orderId', () => {
    it('should return order by order_id', async () => {
      const mockOrder = {
        id: 'uuid-1',
        order_id: 'order-123',
        username: 'testuser',
        order_status: 'pending',
        total_harga: 999.99,
        order_details: [
          {
            id: 'detail-uuid',
            id_product: 1,
            qty: 1,
            total_price: 999.99
          }
        ]
      };

      OrderModel.getOrderByOrderId.mockResolvedValue(mockOrder);

      const response = await request(app).get('/orders/order-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        ...mockOrder,
        cancellation_reason: null
      });
      expect(OrderModel.getOrderByOrderId).toHaveBeenCalledWith('order-123');
    });

    it('should return 404 for non-existent order', async () => {
      OrderModel.getOrderByOrderId.mockResolvedValue(null);

      const response = await request(app).get('/orders/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Order not found');
    });

    it('should include cancellation reason for cancelled orders', async () => {
      const mockOrder = {
        id: 'uuid-1',
        order_id: 'order-123',
        username: 'testuser',
        order_status: 'cancelled',
        total_harga: 999.99
      };

      OrderModel.getOrderByOrderId.mockResolvedValue(mockOrder);

      const response = await request(app).get('/orders/order-123');

      expect(response.status).toBe(200);
      expect(response.body.data.cancellation_reason).toBeTruthy();
    });
  });

  describe('GET /orders/user/:username', () => {
    it('should return orders by username', async () => {
      const mockOrders = [
        {
          id: 'uuid-1',
          order_id: 'order-1',
          username: 'testuser',
          order_status: 'pending',
          total_harga: 999.99
        }
      ];

      OrderModel.getOrdersByUsername.mockResolvedValue(mockOrders);

      const response = await request(app).get('/orders/user/testuser');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockOrders);
      expect(OrderModel.getOrdersByUsername).toHaveBeenCalledWith('testuser');
    });

    it('should return 400 for missing username', async () => {
      const response = await request(app).get('/orders/user/');

      expect(response.status).toBe(404); // Route not found
    });
  });

  describe('PUT /orders/:orderId/status', () => {
    it('should update order status successfully', async () => {
      const updatedOrder = {
        id: 'uuid-1',
        order_id: 'order-123',
        username: 'testuser',
        order_status: 'completed',
        total_harga: 999.99
      };

      OrderModel.updateOrderStatus.mockResolvedValue(updatedOrder);

      const response = await request(app)
        .put('/orders/order-123/status')
        .send({ status: 'completed' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(updatedOrder);
      expect(OrderModel.updateOrderStatus).toHaveBeenCalledWith('order-123', 'completed');
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .put('/orders/order-123/status')
        .send({ status: 'invalid_status' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid status');
    });

    it('should return 404 for non-existent order', async () => {
      OrderModel.updateOrderStatus.mockResolvedValue(null);

      const response = await request(app)
        .put('/orders/nonexistent/status')
        .send({ status: 'completed' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Order not found');
    });
  });
});
