const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const authMiddleware = require('./middleware/auth');
const healthCheck = require('./middleware/health');

const app = express();
const PORT = process.env.PORT || 8080;

// Security & Performance Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.use('/health', healthCheck);

// Service URLs
const SERVICES = {
  USER_SERVICE: process.env.USER_SERVICE_URL || 'http://user-service:3000',
  PRODUCT_SERVICE: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002',
  ORDER_SERVICE: process.env.ORDER_SERVICE_URL || 'http://order-service:3003'
};

console.log('🔗 Service URLs:', SERVICES);

// Proxy configurations
const createProxy = (target, pathRewrite = {}) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    timeout: 30000,
    proxyTimeout: 30000,
    onError: (err, req, res) => {
      console.error(`❌ Proxy error for ${req.url}:`, err.message);
      res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable',
        error: 'PROXY_ERROR'
      });
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`🔄 Proxying ${req.method} ${req.url} to ${target}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`✅ Response ${proxyRes.statusCode} for ${req.method} ${req.url}`);
    }
  });
};

// Authentication Routes (No auth required)
app.use('/api/auth', createProxy(SERVICES.USER_SERVICE, {
  '^/api/auth': '/auth'
}));

// Public health checks
app.use('/api/health', createProxy(SERVICES.USER_SERVICE, {
  '^/api/health': '/health'
}));

// Protected User Service Routes
app.use('/api/users', authMiddleware, createProxy(SERVICES.USER_SERVICE));

app.use('/api/roles', authMiddleware, createProxy(SERVICES.USER_SERVICE));

// Protected Product Service Routes
app.use('/api/products', authMiddleware, createProxy(SERVICES.PRODUCT_SERVICE));

app.use('/api/promotions', authMiddleware, createProxy(SERVICES.PRODUCT_SERVICE));

// Protected Order Service Routes
app.use('/api/orders', authMiddleware, createProxy(SERVICES.ORDER_SERVICE));

// Catch-all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Gateway Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal gateway error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'INTERNAL_ERROR'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend CORS: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
  console.log('🌐 Available routes:');
  console.log('  - POST /api/auth/login');
  console.log('  - POST /api/auth/refresh');
  console.log('  - GET  /api/users (protected)');
  console.log('  - GET  /api/roles (protected)');
  console.log('  - GET  /api/products (protected)');
  console.log('  - GET  /api/promotions (protected)');
  console.log('  - GET  /api/orders (protected)');
  console.log('  - GET  /health');
});
