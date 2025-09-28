const morgan = require('morgan');

// Custom token for response time
morgan.token('response-time', (req, res) => {
  if (!req._startTime || !res._startTime) {
    return '-';
  }
  const ms = (res._startTime[0] - req._startTime[0]) * 1000 +
    (res._startTime[1] - req._startTime[1]) * 1e-6;
  return ms.toFixed(3);
});

// Custom format
const logFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

const logger = morgan(logFormat, {
  skip: (req, res) => {
    // Skip logging for health check endpoints
    return req.url === '/health' || req.url === '/';
  }
});

module.exports = logger;
