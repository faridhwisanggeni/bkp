const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        error: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'dev_access_secret_change_me';
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Add user info to request for downstream services
    req.headers['x-user-id'] = decoded.sub || decoded.id;
    req.headers['x-user-username'] = decoded.email || decoded.username;
    req.headers['x-user-role'] = decoded.role;
    
    console.log(`🔐 Authenticated user: ${decoded.email || decoded.username} (${decoded.role})`);
    
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
        error: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: 'INVALID_TOKEN'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: 'AUTH_FAILED'
    });
  }
};

module.exports = authMiddleware;
