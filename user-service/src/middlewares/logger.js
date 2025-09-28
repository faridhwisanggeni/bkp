const pinoHttp = require('pino-http');
const { v4: uuidv4 } = require('uuid');

// Let pino-http create its own pino instance to ensure version compatibility
const httpLogger = pinoHttp({
  level: process.env.LOG_LEVEL || 'info',
  genReqId: function (req, res) {
    const existing = req.headers['x-request-id'];
    const id = existing || uuidv4();
    res.setHeader('x-request-id', id);
    return id;
  },
  customProps: function (req) {
    return { userId: req.user?.sub, role: req.user?.role };
  },
});

// Expose the underlying pino instance created by pino-http
const logger = httpLogger.logger;

module.exports = { logger, httpLogger };
