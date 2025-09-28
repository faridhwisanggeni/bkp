const ProductModel = require('../../src/models/product.model');
const pool = require('../../src/config/database');

// Mock database pool
jest.mock('../../src/config/database');

describe('ProductModel', () => {
  beforeEach(() => {
    pool.query = jest.fn();
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should find all products with pagination', async () => {
      const mockProducts = [
        {
          id: 1,
          product_name: 'Laptop Gaming',
          price: 1299.99,
          qty: 10,
          is_active: true
        },
        {
          id: 2,
          product_name: 'iPhone 15',
          price: 999.99,
          qty: 5,
          is_active: true
        }
      ];

      pool.query.mockResolvedValue({ rows: mockProducts });

      const result = await ProductModel.findAll({
        page: 1,
        limit: 10
      });

      expect(result).toEqual(mockProducts);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM products'),
        [10, 0]
      );
    });

    it('should handle search parameter', async () => {
      const mockProducts = [
        {
          id: 1,
          product_name: 'Laptop Gaming',
          price: 1299.99,
          qty: 10,
          is_active: true
        }
      ];

      pool.query.mockResolvedValue({ rows: mockProducts });

      const result = await ProductModel.findAll({
        page: 1,
        limit: 10,
        search: 'laptop'
      });

      expect(result).toEqual(mockProducts);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE'),
        expect.arrayContaining(['%laptop%', 10, 0])
      );
    });

    it('should handle database errors', async () => {
      pool.query.mockRejectedValue(new Error('Database connection failed'));

      await expect(ProductModel.findAll({ page: 1, limit: 10 }))
        .rejects.toThrow('Database connection failed');
    });
  });

  describe('findById', () => {
    it('should find product by id', async () => {
      const mockProduct = {
        id: 1,
        product_name: 'Laptop Gaming',
        price: 1299.99,
        qty: 10,
        is_active: true
      };

      pool.query.mockResolvedValue({ rows: [mockProduct] });

      const result = await ProductModel.findById(1);

      expect(result).toEqual(mockProduct);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM products WHERE id = $1 AND deleted_at IS NULL',
        [1]
      );
    });

    it('should return null if product not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await ProductModel.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const productData = {
        product_name: 'New Laptop',
        price: 1599.99,
        qty: 15,
        is_active: true
      };

      const createdProduct = {
        id: 3,
        ...productData,
        created_at: new Date(),
        updated_at: new Date()
      };

      pool.query.mockResolvedValue({ rows: [createdProduct] });

      const result = await ProductModel.create(productData);

      expect(result).toEqual(createdProduct);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO products'),
        expect.arrayContaining([
          productData.product_name,
          productData.price,
          productData.qty,
          productData.is_active
        ])
      );
    });

    it('should handle creation errors', async () => {
      const productData = {
        product_name: 'New Product',
        price: 99.99,
        qty: 10,
        is_active: true
      };

      pool.query.mockRejectedValue(new Error('Unique constraint violation'));

      await expect(ProductModel.create(productData))
        .rejects.toThrow('Unique constraint violation');
    });
  });

  describe('update', () => {
    it('should update product successfully', async () => {
      const updateData = {
        product_name: 'Updated Laptop',
        price: 1399.99,
        qty: 8,
        is_active: true
      };

      const updatedProduct = {
        id: 1,
        ...updateData,
        updated_at: new Date()
      };

      pool.query.mockResolvedValue({ rows: [updatedProduct] });

      const result = await ProductModel.update(1, updateData);

      expect(result).toEqual(updatedProduct);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE products'),
        expect.arrayContaining([
          updateData.product_name,
          updateData.price,
          updateData.qty,
          updateData.is_active,
          1
        ])
      );
    });

    it('should return null if product not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await ProductModel.update(999, { product_name: 'Updated' });

      expect(result).toBeNull();
    });
  });

  describe('updateStock', () => {
    it('should update product stock', async () => {
      const updatedProduct = {
        id: 1,
        product_name: 'Test Product',
        qty: 5,
        updated_at: new Date()
      };

      pool.query.mockResolvedValue({ rows: [updatedProduct] });

      const result = await ProductModel.updateStock(1, 5);

      expect(result).toEqual(updatedProduct);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE products SET qty = $1'),
        [5, 1]
      );
    });

    it('should handle negative stock updates', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await ProductModel.updateStock(1, -5);

      expect(result).toBeNull();
    });
  });

  describe('checkStock', () => {
    it('should check if product has sufficient stock', async () => {
      const mockProduct = {
        id: 1,
        product_name: 'Test Product',
        qty: 10,
        is_active: true
      };

      pool.query.mockResolvedValue({ rows: [mockProduct] });

      const result = await ProductModel.checkStock(1, 5);

      expect(result).toEqual({
        available: true,
        current_stock: 10,
        requested: 5,
        product: mockProduct
      });
    });

    it('should return false for insufficient stock', async () => {
      const mockProduct = {
        id: 1,
        product_name: 'Test Product',
        qty: 2,
        is_active: true
      };

      pool.query.mockResolvedValue({ rows: [mockProduct] });

      const result = await ProductModel.checkStock(1, 5);

      expect(result).toEqual({
        available: false,
        current_stock: 2,
        requested: 5,
        product: mockProduct
      });
    });

    it('should return false for inactive products', async () => {
      const mockProduct = {
        id: 1,
        product_name: 'Test Product',
        qty: 10,
        is_active: false
      };

      pool.query.mockResolvedValue({ rows: [mockProduct] });

      const result = await ProductModel.checkStock(1, 5);

      expect(result).toEqual({
        available: false,
        current_stock: 10,
        requested: 5,
        product: mockProduct,
        reason: 'Product is not active'
      });
    });

    it('should return false for non-existent products', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await ProductModel.checkStock(999, 5);

      expect(result).toEqual({
        available: false,
        current_stock: 0,
        requested: 5,
        product: null,
        reason: 'Product not found'
      });
    });
  });
});
