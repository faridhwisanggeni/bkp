const request = require('supertest');
const express = require('express');
const ProductController = require('../../src/controllers/product.controller');
const ProductModel = require('../../src/models/product.model');

// Mock dependencies
jest.mock('../../src/models/product.model');

const app = express();
app.use(express.json());
app.get('/products', ProductController.getAllProducts);
app.get('/products/:id', ProductController.getProductById);
app.post('/products', ProductController.createProduct);
app.put('/products/:id', ProductController.updateProduct);

describe('ProductController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /products', () => {
    it('should return all products with pagination', async () => {
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

      ProductModel.findAll.mockResolvedValue(mockProducts);

      const response = await request(app)
        .get('/products')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockProducts);
      expect(ProductModel.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined
      });
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

      ProductModel.findAll.mockResolvedValue(mockProducts);

      const response = await request(app)
        .get('/products')
        .query({ search: 'laptop' });

      expect(response.status).toBe(200);
      expect(ProductModel.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: 'laptop'
      });
    });

    it('should handle server errors', async () => {
      ProductModel.findAll.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/products');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Internal server error');
    });
  });

  describe('GET /products/:id', () => {
    it('should return product by id', async () => {
      const mockProduct = {
        id: 1,
        product_name: 'Laptop Gaming',
        price: 1299.99,
        qty: 10,
        is_active: true
      };

      ProductModel.findById.mockResolvedValue(mockProduct);

      const response = await request(app).get('/products/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockProduct);
      expect(ProductModel.findById).toHaveBeenCalledWith('1');
    });

    it('should return 404 for non-existent product', async () => {
      ProductModel.findById.mockResolvedValue(null);

      const response = await request(app).get('/products/999');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Product not found');
    });

    it('should return 400 for invalid id format', async () => {
      const response = await request(app).get('/products/invalid');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid product ID format');
    });
  });

  describe('POST /products', () => {
    it('should create a new product successfully', async () => {
      const newProduct = {
        product_name: 'New Laptop',
        price: 1599.99,
        qty: 15,
        is_active: true
      };

      const createdProduct = {
        id: 3,
        ...newProduct,
        created_at: new Date(),
        updated_at: new Date()
      };

      ProductModel.create.mockResolvedValue(createdProduct);

      const response = await request(app)
        .post('/products')
        .send(newProduct);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(createdProduct);
      expect(ProductModel.create).toHaveBeenCalledWith(newProduct);
    });

    it('should return 400 for validation errors', async () => {
      const response = await request(app)
        .post('/products')
        .send({
          product_name: 'Test'
          // missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should handle creation errors', async () => {
      ProductModel.create.mockRejectedValue(new Error('Database constraint violation'));

      const response = await request(app)
        .post('/products')
        .send({
          product_name: 'New Product',
          price: 99.99,
          qty: 10
        });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Internal server error');
    });
  });

  describe('PUT /products/:id', () => {
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

      ProductModel.findById.mockResolvedValue({ id: 1, product_name: 'Old Laptop' });
      ProductModel.update.mockResolvedValue(updatedProduct);

      const response = await request(app)
        .put('/products/1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(updatedProduct);
      expect(ProductModel.update).toHaveBeenCalledWith('1', updateData);
    });

    it('should return 404 for non-existent product', async () => {
      ProductModel.findById.mockResolvedValue(null);

      const response = await request(app)
        .put('/products/999')
        .send({
          product_name: 'Updated Product',
          price: 99.99
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Product not found');
    });

    it('should return 400 for validation errors', async () => {
      ProductModel.findById.mockResolvedValue({ id: 1 });

      const response = await request(app)
        .put('/products/1')
        .send({
          price: -10 // invalid price
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });
});
