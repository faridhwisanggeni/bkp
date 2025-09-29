// Response transformation middleware for consistent API responses

const transformAuthResponse = (req, res, next) => {
  // Only transform auth endpoints
  if (!req.url.includes('/api/auth/')) {
    return next();
  }

  // Store original res.json method
  const originalJson = res.json;
  
  // Override res.json to wrap auth responses
  res.json = function(data) {
    // If data already has success/data structure, pass through
    if (data && typeof data === 'object' && ('success' in data || 'data' in data)) {
      return originalJson.call(this, data);
    }
    
    // Wrap auth response in consistent format
    const wrappedResponse = {
      success: true,
      data: data
    };
    
    return originalJson.call(this, wrappedResponse);
  };

  next();
};

module.exports = { transformAuthResponse };
