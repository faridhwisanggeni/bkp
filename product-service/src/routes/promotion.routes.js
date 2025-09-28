const express = require('express');
const PromotionController = require('../controllers/promotion.controller');
const { validateCreatePromotion, validateUpdatePromotion, validateQueryPromotion } = require('../validators/promotion.validator');

const router = express.Router();
const promotionController = new PromotionController();

// GET /api/promotions - Get all promotions with filtering and pagination
router.get('/', validateQueryPromotion, (req, res) => {
  promotionController.getAllPromotions(req, res);
});

// GET /api/promotions/:id - Get promotion by ID
router.get('/:id', (req, res) => {
  promotionController.getPromotionById(req, res);
});

// GET /api/promotions/product/:productId - Get promotions by product ID
router.get('/product/:productId', (req, res) => {
  promotionController.getPromotionsByProductId(req, res);
});

// POST /api/promotions - Create new promotion
router.post('/', validateCreatePromotion, (req, res) => {
  promotionController.createPromotion(req, res);
});

// PUT /api/promotions/:id - Update promotion
router.put('/:id', validateUpdatePromotion, (req, res) => {
  promotionController.updatePromotion(req, res);
});


module.exports = router;
