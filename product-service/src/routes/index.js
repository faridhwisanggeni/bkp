const express = require('express');
const productRoutes = require('./product.routes');
const promotionRoutes = require('./promotion.routes');
const metaRoutes = require('./meta.routes');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Product service is healthy',
    timestamp: new Date().toISOString()
  });
});

// API routes
router.use('/products', productRoutes);
router.use('/promotions', promotionRoutes);
router.use('/meta', metaRoutes);

module.exports = router;
