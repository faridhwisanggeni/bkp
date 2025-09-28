const OrderModel = require('../../src/models/order.model');
const pool = require('../../src/config/database');

// Mock database pool
jest.mock('../../src/config/database');

describe('OrderModel', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    pool.connect = jest.fn().mockResolvedValue(mockClient);
    pool.query = jest.fn();
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create order with order details successfully', async () => {
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

      const mockOrderHeader = {
        id: 'header-uuid',
        order_id: 'order-uuid',
        username: 'testuser',
        order_status: 'pending',
        total_harga: 999.99,
        order_date: new Date()
      };

      const mockOrderDetail = {
        id: 'detail-uuid',
        id_order_header: 'header-uuid',
        id_product: 1,
        qty: 1,
        original_price: 999.99,
        total_price: 999.99
      };

      // Mock transaction
      mockClient.query
        .mockResolvedValueOnce({ command: 'BEGIN' })
        .mockResolvedValueOnce({ rows: [mockOrderHeader] })
        .mockResolvedValueOnce({ rows: [mockOrderDetail] })
        .mockResolvedValueOnce({ command: 'COMMIT' });

      const result = await OrderModel.createOrder(orderData);

      expect(result).toEqual({
        orderHeader: mockOrderHeader,
        orderDetails: [mockOrderDetail]
      });

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      const orderData = {
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
      };

      mockClient.query
        .mockResolvedValueOnce({ command: 'BEGIN' })
        .mockRejectedValueOnce(new Error('Database error'));

      await expect(OrderModel.createOrder(orderData))
        .rejects.toThrow('Database error');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle multiple order items', async () => {
      const orderData = {
        username: 'testuser',
        total_harga: 1999.98,
        items: [
          {
            id_product: 1,
            qty: 1,
            original_price: 999.99,
            total_price: 999.99
          },
          {
            id_product: 2,
            qty: 1,
            original_price: 999.99,
            total_price: 999.99
          }
        ]
      };

      const mockOrderHeader = {
        id: 'header-uuid',
        order_id: 'order-uuid',
        username: 'testuser',
        total_harga: 1999.98
      };

      const mockOrderDetails = [
        { id: 'detail-1', id_product: 1, qty: 1, total_price: 999.99 },
        { id: 'detail-2', id_product: 2, qty: 1, total_price: 999.99 }
      ];

      mockClient.query
        .mockResolvedValueOnce({ command: 'BEGIN' })
        .mockResolvedValueOnce({ rows: [mockOrderHeader] })
        .mockResolvedValueOnce({ rows: [mockOrderDetails[0]] })
        .mockResolvedValueOnce({ rows: [mockOrderDetails[1]] })
        .mockResolvedValueOnce({ command: 'COMMIT' });

      const result = await OrderModel.createOrder(orderData);

      expect(result.orderDetails).toHaveLength(2);
      expect(mockClient.query).toHaveBeenCalledTimes(5); // BEGIN + INSERT header + 2 INSERT details + COMMIT
    });
  });

  describe('getOrderByOrderId', () => {
    it('should get order with details by order_id', async () => {
      const mockOrder = {
        id: 'header-uuid',
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

      pool.query.mockResolvedValue({ rows: [mockOrder] });

      const result = await OrderModel.getOrderByOrderId('order-123');

      expect(result).toEqual(mockOrder);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE oh.order_id = $1'),
        ['order-123']
      );
    });

    it('should return null if order not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await OrderModel.getOrderByOrderId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getOrdersByUsername', () => {
    it('should get all orders for a username', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          order_id: 'order-123',
          username: 'testuser',
          order_status: 'pending',
          order_details: []
        },
        {
          id: 'order-2',
          order_id: 'order-456',
          username: 'testuser',
          order_status: 'completed',
          order_details: []
        }
      ];

      pool.query.mockResolvedValue({ rows: mockOrders });

      const result = await OrderModel.getOrdersByUsername('testuser');

      expect(result).toEqual(mockOrders);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE oh.username = $1'),
        ['testuser']
      );
    });

    it('should return empty array if no orders found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await OrderModel.getOrdersByUsername('nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('getAllOrders', () => {
    it('should get all orders with pagination', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          order_id: 'order-123',
          username: 'user1',
          order_status: 'pending'
        },
        {
          id: 'order-2',
          order_id: 'order-456',
          username: 'user2',
          order_status: 'completed'
        }
      ];

      pool.query.mockResolvedValue({ rows: mockOrders });

      const result = await OrderModel.getAllOrders({
        page: 1,
        limit: 10
      });

      expect(result).toEqual(mockOrders);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $1 OFFSET $2'),
        [10, 0]
      );
    });

    it('should filter by status', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          order_id: 'order-123',
          username: 'user1',
          order_status: 'pending'
        }
      ];

      pool.query.mockResolvedValue({ rows: mockOrders });

      const result = await OrderModel.getAllOrders({
        page: 1,
        limit: 10,
        status: 'pending'
      });

      expect(result).toEqual(mockOrders);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE oh.order_status = $1'),
        expect.arrayContaining(['pending', 10, 0])
      );
    });

    it('should filter by username', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          order_id: 'order-123',
          username: 'testuser',
          order_status: 'pending'
        }
      ];

      pool.query.mockResolvedValue({ rows: mockOrders });

      const result = await OrderModel.getAllOrders({
        page: 1,
        limit: 10,
        username: 'testuser'
      });

      expect(result).toEqual(mockOrders);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE oh.username ILIKE $1'),
        expect.arrayContaining(['%testuser%', 10, 0])
      );
    });

    it('should filter by both status and username', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          order_id: 'order-123',
          username: 'testuser',
          order_status: 'pending'
        }
      ];

      pool.query.mockResolvedValue({ rows: mockOrders });

      const result = await OrderModel.getAllOrders({
        page: 1,
        limit: 10,
        status: 'pending',
        username: 'testuser'
      });

      expect(result).toEqual(mockOrders);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE oh.order_status = $1 AND oh.username ILIKE $2'),
        expect.arrayContaining(['pending', '%testuser%', 10, 0])
      );
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      const updatedOrder = {
        id: 'order-uuid',
        order_id: 'order-123',
        username: 'testuser',
        order_status: 'completed',
        updated_at: new Date()
      };

      pool.query.mockResolvedValue({ rows: [updatedOrder] });

      const result = await OrderModel.updateOrderStatus('order-123', 'completed');

      expect(result).toEqual(updatedOrder);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE order_header SET order_status = $1'),
        ['completed', 'order-123']
      );
    });

    it('should return null if order not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await OrderModel.updateOrderStatus('nonexistent', 'completed');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));

      await expect(OrderModel.updateOrderStatus('order-123', 'completed'))
        .rejects.toThrow('Database error');
    });
  });
});
