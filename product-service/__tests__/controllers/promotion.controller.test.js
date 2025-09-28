const request = require('supertest');
const express = require('express');
const PromotionController = require('../../src/controllers/promotion.controller');
const PromotionModel = require('../../src/models/promotion.model');

// Mock dependencies
jest.mock('../../src/models/promotion.model');

const app = express();
app.use(express.json());
app.get('/promotions', PromotionController.getAllPromotions);
app.get('/promotions/:id', PromotionController.getPromotionById);
app.post('/promotions', PromotionController.createPromotion);
app.put('/promotions/:id', PromotionController.updatePromotion);

describe('PromotionController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /promotions', () => {
    it('should return all promotions with pagination', async () => {
      const mockPromotions = [
        {
          id: 1,
          product_id: 1,
          promotion_name: 'Flash Sale Weekend',
          promotion_type: 'discount',
          discount: 15,
          qty_max: 2,
          is_active: true,
          started_at: '2024-01-20T00:00:00Z',
          ended_at: '2024-12-31T23:59:59Z',
          product_name: 'Laptop Gaming'
        }
      ];

      PromotionModel.findAllWithProducts.mockResolvedValue(mockPromotions);

      const response = await request(app)
        .get('/promotions')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPromotions);
      expect(PromotionModel.findAllWithProducts).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined
      });
    });

    it('should handle search parameter', async () => {
      const mockPromotions = [
        {
          id: 1,
          promotion_name: 'Flash Sale Weekend',
          product_name: 'Laptop Gaming'
        }
      ];

      PromotionModel.findAllWithProducts.mockResolvedValue(mockPromotions);

      const response = await request(app)
        .get('/promotions')
        .query({ search: 'flash' });

      expect(response.status).toBe(200);
      expect(PromotionModel.findAllWithProducts).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: 'flash'
      });
    });

    it('should handle server errors', async () => {
      PromotionModel.findAllWithProducts.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/promotions');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Internal server error');
    });
  });

  describe('GET /promotions/:id', () => {
    it('should return promotion by id', async () => {
      const mockPromotion = {
        id: 1,
        product_id: 1,
        promotion_name: 'Flash Sale Weekend',
        promotion_type: 'discount',
        discount: 15,
        qty_max: 2,
        is_active: true,
        product_name: 'Laptop Gaming'
      };

      PromotionModel.findByIdWithProduct.mockResolvedValue(mockPromotion);

      const response = await request(app).get('/promotions/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPromotion);
      expect(PromotionModel.findByIdWithProduct).toHaveBeenCalledWith('1');
    });

    it('should return 404 for non-existent promotion', async () => {
      PromotionModel.findByIdWithProduct.mockResolvedValue(null);

      const response = await request(app).get('/promotions/999');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Promotion not found');
    });

    it('should return 400 for invalid id format', async () => {
      const response = await request(app).get('/promotions/invalid');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid promotion ID format');
    });
  });

  describe('POST /promotions', () => {
    it('should create a new promotion successfully', async () => {
      const newPromotion = {
        product_id: 1,
        promotion_name: 'New Year Sale',
        promotion_type: 'discount',
        discount: 20,
        qty_max: 5,
        is_active: true,
        started_at: '2024-01-01T00:00:00Z',
        ended_at: '2024-01-31T23:59:59Z'
      };

      const createdPromotion = {
        id: 2,
        ...newPromotion,
        created_at: new Date(),
        updated_at: new Date()
      };

      PromotionModel.create.mockResolvedValue(createdPromotion);

      const response = await request(app)
        .post('/promotions')
        .send(newPromotion);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(createdPromotion);
      expect(PromotionModel.create).toHaveBeenCalledWith(newPromotion);
    });

    it('should return 400 for validation errors', async () => {
      const response = await request(app)
        .post('/promotions')
        .send({
          promotion_name: 'Test'
          // missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid date range', async () => {
      const response = await request(app)
        .post('/promotions')
        .send({
          product_id: 1,
          promotion_name: 'Invalid Promotion',
          promotion_type: 'discount',
          discount: 10,
          qty_max: 1,
          started_at: '2024-12-31T23:59:59Z',
          ended_at: '2024-01-01T00:00:00Z' // end before start
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /promotions/:id', () => {
    it('should update promotion successfully', async () => {
      const updateData = {
        promotion_name: 'Updated Sale',
        discount: 25,
        qty_max: 3,
        is_active: true
      };

      const updatedPromotion = {
        id: 1,
        ...updateData,
        updated_at: new Date()
      };

      PromotionModel.findById.mockResolvedValue({ id: 1, promotion_name: 'Old Sale' });
      PromotionModel.update.mockResolvedValue(updatedPromotion);

      const response = await request(app)
        .put('/promotions/1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(updatedPromotion);
      expect(PromotionModel.update).toHaveBeenCalledWith('1', updateData);
    });

    it('should return 404 for non-existent promotion', async () => {
      PromotionModel.findById.mockResolvedValue(null);

      const response = await request(app)
        .put('/promotions/999')
        .send({
          promotion_name: 'Updated Promotion'
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Promotion not found');
    });

    it('should return 400 for validation errors', async () => {
      PromotionModel.findById.mockResolvedValue({ id: 1 });

      const response = await request(app)
        .put('/promotions/1')
        .send({
          discount: -5 // invalid discount
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });
});
