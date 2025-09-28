const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/config/database');

describe('Product Integration Tests', () => {
  let testProduct;

  beforeAll(async () => {
    // Setup test database connection
  });

  afterAll(async () => {
    // Cleanup test data
    if (testProduct) {
      await pool.query('DELETE FROM products WHERE id = $1', [testProduct.id]);
    }
    await pool.end();
  });

  beforeEach(async () => {
    // Clean up any existing test data
    await pool.query('DELETE FROM products WHERE product_name LIKE $1', ['%Integration Test%']);
  });

  describe('Product CRUD Operations', () => {
    it('should create, read, update product successfully', async () => {
      // Step 1: Create Product
      const productData = {
        product_name: 'Integration Test Laptop',
        price: 1599.99,
        qty: 10,
        is_active: true
      };

      const createResponse = await request(app)
        .post('/api/products')
        .send(productData);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.product_name).toBe(productData.product_name);
      expect(createResponse.body.data.price).toBe(productData.price);

      testProduct = createResponse.body.data;

      // Step 2: Read Product
      const readResponse = await request(app)
        .get(`/api/products/${testProduct.id}`);

      expect(readResponse.status).toBe(200);
      expect(readResponse.body.success).toBe(true);
      expect(readResponse.body.data.id).toBe(testProduct.id);
      expect(readResponse.body.data.product_name).toBe(productData.product_name);

      // Step 3: Update Product
      const updateData = {
        product_name: 'Updated Integration Test Laptop',
        price: 1699.99,
        qty: 8,
        is_active: true
      };

      const updateResponse = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .send(updateData);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.product_name).toBe(updateData.product_name);
      expect(updateResponse.body.data.price).toBe(updateData.price);

      // Step 4: Verify update in database
      const dbProduct = await pool.query('SELECT * FROM products WHERE id = $1', [testProduct.id]);
      expect(dbProduct.rows[0].product_name).toBe(updateData.product_name);
      expect(parseFloat(dbProduct.rows[0].price)).toBe(updateData.price);
    });

    it('should handle product listing with pagination', async () => {
      // Create multiple test products
      const products = [];
      for (let i = 1; i <= 5; i++) {
        const productData = {
          product_name: `Integration Test Product ${i}`,
          price: 100 * i,
          qty: i * 2,
          is_active: true
        };

        const response = await request(app)
          .post('/api/products')
          .send(productData);

        products.push(response.body.data);
      }

      // Test pagination
      const listResponse = await request(app)
        .get('/api/products')
        .query({ page: 1, limit: 3 });

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.success).toBe(true);
      expect(Array.isArray(listResponse.body.data)).toBe(true);
      expect(listResponse.body.data.length).toBeGreaterThan(0);

      // Test search functionality
      const searchResponse = await request(app)
        .get('/api/products')
        .query({ search: 'Integration Test Product 1' });

      expect(searchResponse.status).toBe(200);
      expect(searchResponse.body.data.length).toBeGreaterThan(0);
      expect(searchResponse.body.data[0].product_name).toContain('Integration Test Product 1');

      // Cleanup
      for (const product of products) {
        await pool.query('DELETE FROM products WHERE id = $1', [product.id]);
      }
    });
  });

  describe('Product Validation', () => {
    it('should validate required fields', async () => {
      const invalidProduct = {
        product_name: '', // empty name
        price: -100, // negative price
        qty: -5 // negative quantity
      };

      const response = await request(app)
        .post('/api/products')
        .send(invalidProduct);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should handle database constraints', async () => {
      // Test with extremely long product name
      const longNameProduct = {
        product_name: 'A'.repeat(300), // Very long name
        price: 99.99,
        qty: 1,
        is_active: true
      };

      const response = await request(app)
        .post('/api/products')
        .send(longNameProduct);

      // Should either truncate or return validation error
      expect([400, 500]).toContain(response.status);
    });
  });

  describe('Product Stock Management', () => {
    it('should handle stock updates correctly', async () => {
      // Create product with initial stock
      const productData = {
        product_name: 'Stock Test Product',
        price: 299.99,
        qty: 100,
        is_active: true
      };

      const createResponse = await request(app)
        .post('/api/products')
        .send(productData);

      const productId = createResponse.body.data.id;

      // Update stock
      const stockUpdate = {
        product_name: 'Stock Test Product',
        price: 299.99,
        qty: 85, // Reduced stock
        is_active: true
      };

      const updateResponse = await request(app)
        .put(`/api/products/${productId}`)
        .send(stockUpdate);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.qty).toBe(85);

      // Verify in database
      const dbCheck = await pool.query('SELECT qty FROM products WHERE id = $1', [productId]);
      expect(dbCheck.rows[0].qty).toBe(85);

      // Cleanup
      await pool.query('DELETE FROM products WHERE id = $1', [productId]);
    });
  });
});
