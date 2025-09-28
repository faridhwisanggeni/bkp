const express = require('express');
const { pool } = require('../db/pool');

const router = express.Router();

// GET /api/meta/stats - Get service statistics
router.get('/stats', async (req, res) => {
  try {
    const productCountQuery = 'SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as active FROM products';
    const promotionCountQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active = true AND started_at <= NOW() AND ended_at >= NOW()) as active,
        COUNT(*) FILTER (WHERE is_active = true AND started_at > NOW()) as scheduled,
        COUNT(*) FILTER (WHERE ended_at < NOW()) as expired
      FROM promotions
    `;

    const [productResult, promotionResult] = await Promise.all([
      pool.query(productCountQuery),
      pool.query(promotionCountQuery)
    ]);

    const stats = {
      products: {
        total: parseInt(productResult.rows[0].total),
        active: parseInt(productResult.rows[0].active)
      },
      promotions: {
        total: parseInt(promotionResult.rows[0].total),
        active: parseInt(promotionResult.rows[0].active),
        scheduled: parseInt(promotionResult.rows[0].scheduled),
        expired: parseInt(promotionResult.rows[0].expired)
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/meta/info - Get service information
router.get('/info', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'product-service',
      version: '1.0.0',
      description: 'Product and Promotion management service',
      endpoints: {
        products: '/api/products',
        promotions: '/api/promotions',
        health: '/api/health',
        stats: '/api/meta/stats'
      }
    }
  });
});

module.exports = router;
