const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const http = require('http');
require('dotenv').config();

const authMiddleware = require('./middleware/auth');
const healthCheck = require('./middleware/health');
const { transformAuthResponse } = require('./middleware/responseTransform');

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
    followRedirects: true,
    secure: false,
    onError: (err, req, res) => {
      console.error(`❌ Proxy error for ${req.url}:`, err.message);
      if (!res.headersSent) {
        res.status(503).json({
          success: false,
          message: 'Service temporarily unavailable',
          error: 'PROXY_ERROR',
          details: err.message
        });
      }
    },
    onProxyReq: (proxyReq, req, res) => {
      // Fix content-length for body requests
      if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
      console.log(`🔄 Proxying ${req.method} ${req.url} to ${target}${req.url}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`✅ Response ${proxyRes.statusCode} for ${req.method} ${req.url}`);
    }
  });
};

// Helper function for HTTP requests
const makeHttpRequest = (url, method, data) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsedBody = JSON.parse(body);
          resolve({
            status: res.statusCode,
            data: parsedBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

// Authentication Routes (No auth required) - manual handling for response wrapping
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔄 Auth login request to user-service');
    const response = await makeHttpRequest(`${SERVICES.USER_SERVICE}/auth/login`, 'POST', req.body);
    
    if (response.status === 200) {
      console.log('✅ Auth login successful, wrapping response');
      // Wrap in consistent format
      res.json({
        success: true,
        data: response.data
      });
    } else {
      res.status(response.status).json(response.data);
    }
  } catch (error) {
    console.error('❌ Auth login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Authentication service unavailable',
      error: 'AUTH_SERVICE_ERROR'
    });
  }
});

app.post('/api/auth/refresh', async (req, res) => {
  try {
    console.log('🔄 Auth refresh request to user-service');
    const response = await makeHttpRequest(`${SERVICES.USER_SERVICE}/auth/refresh`, 'POST', req.body);
    
    if (response.status === 200) {
      console.log('✅ Auth refresh successful, wrapping response');
      // Wrap in consistent format
      res.json({
        success: true,
        data: response.data
      });
    } else {
      res.status(response.status).json(response.data);
    }
  } catch (error) {
    console.error('❌ Auth refresh error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Authentication service unavailable',
      error: 'AUTH_SERVICE_ERROR'
    });
  }
});

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
