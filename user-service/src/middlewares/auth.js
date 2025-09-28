const jwt = require('jsonwebtoken');
const createError = require('http-errors');

function verifyAccessToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return next(createError(401, 'Missing access token'));

    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = payload; // { sub, email, role, iat, exp, jti }
    next();
  } catch (e) {
    return next(createError(401, 'Invalid or expired access token'));
  }
}

function requireRole(roles = []) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user || !req.user.role) return next(createError(403, 'Forbidden'));
    if (allowed.length === 0 || allowed.includes(req.user.role)) return next();
    return next(createError(403, 'Forbidden'));
  };
}

module.exports = { verifyAccessToken, requireRole };
