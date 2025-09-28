const createError = require('http-errors');

function notFoundHandler(req, res, next) {
  next(createError(404, 'Route not found'));
}

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status = err.status || 500;
  const payload = {
    status,
    message: err.message || 'Internal Server Error',
  };
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    payload.stack = err.stack;
  }
  res.status(status).json(payload);
}

module.exports = { notFoundHandler, errorHandler };
