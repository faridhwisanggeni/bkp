const express = require('express');
const http = require('http');
const router = express.Router();

// Service health check URLs
const HEALTH_URLS = {
  'user-service': process.env.USER_SERVICE_URL || 'http://user-service:3000',
  'product-service': process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002',
  'order-service': process.env.ORDER_SERVICE_URL || 'http://order-service:3003'
};

// Check individual service health using native http
const checkServiceHealth = async (serviceName, baseUrl) => {
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    try {
      const url = new URL(`${baseUrl}/health`);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'GET',
        timeout: 5000
      };

      const req = http.request(options, (res) => {
        const responseTime = Date.now() - startTime;
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(data);
            resolve({
              service: serviceName,
              status: res.statusCode === 200 ? 'healthy' : 'unhealthy',
              responseTime: `${responseTime}ms`,
              statusCode: res.statusCode,
              details: parsedData
            });
          } catch (e) {
            resolve({
              service: serviceName,
              status: res.statusCode === 200 ? 'healthy' : 'unhealthy',
              responseTime: `${responseTime}ms`,
              statusCode: res.statusCode,
              details: { message: 'Invalid JSON response' }
            });
          }
        });
      });

      req.on('error', (error) => {
        const responseTime = Date.now() - startTime;
        resolve({
          service: serviceName,
          status: 'unhealthy',
          error: error.code === 'ECONNREFUSED' ? 'Service unavailable' : error.message,
          responseTime: `${responseTime}ms`
        });
      });

      req.on('timeout', () => {
        req.destroy();
        const responseTime = Date.now() - startTime;
        resolve({
          service: serviceName,
          status: 'unhealthy',
          error: 'Request timeout',
          responseTime: `${responseTime}ms`
        });
      });

      req.end();
    } catch (error) {
      const responseTime = Date.now() - startTime;
      resolve({
        service: serviceName,
        status: 'unhealthy',
        error: error.message,
        responseTime: `${responseTime}ms`
      });
    }
  });
};

// Gateway health endpoint
router.get('/', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Check all services in parallel
    const healthChecks = await Promise.allSettled(
      Object.entries(HEALTH_URLS).map(([name, url]) => 
        checkServiceHealth(name, url)
      )
    );
    
    const services = healthChecks.map(result => 
      result.status === 'fulfilled' ? result.value : {
        service: 'unknown',
        status: 'error',
        error: result.reason?.message || 'Health check failed'
      }
    );
    
    const allHealthy = services.every(service => service.status === 'healthy');
    const responseTime = Date.now() - startTime;
    
    const healthStatus = {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services,
      summary: {
        total: services.length,
        healthy: services.filter(s => s.status === 'healthy').length,
        unhealthy: services.filter(s => s.status === 'unhealthy').length
      }
    };
    
    const statusCode = allHealthy ? 200 : 503;
    res.status(statusCode).json(healthStatus);
    
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      uptime: process.uptime()
    });
  }
});

// Individual service health check
router.get('/:service', async (req, res) => {
  const serviceName = req.params.service;
  const serviceUrl = HEALTH_URLS[serviceName];
  
  if (!serviceUrl) {
    return res.status(404).json({
      success: false,
      message: `Service '${serviceName}' not found`,
      availableServices: Object.keys(HEALTH_URLS)
    });
  }
  
  try {
    const healthResult = await checkServiceHealth(serviceName, serviceUrl);
    const statusCode = healthResult.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthResult);
  } catch (error) {
    res.status(500).json({
      service: serviceName,
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
