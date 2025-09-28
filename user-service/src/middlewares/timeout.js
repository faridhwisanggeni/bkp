// Simple request timeout guard middleware
// If a request takes longer than REQUEST_TIMEOUT_MS, respond 503

const DEFAULT_TIMEOUT = Number(process.env.REQUEST_TIMEOUT_MS || 10000); // 10s

function timeoutGuard(ms = DEFAULT_TIMEOUT) {
  return function (req, res, next) {
    let finished = false;
    const timer = setTimeout(() => {
      if (finished || res.headersSent) return;
      res.status(503).json({ error: 'RequestTimeout', message: `Request timed out after ${ms}ms` });
    }, ms);

    const clear = () => {
      finished = true;
      clearTimeout(timer);
    };

    res.on('finish', clear);
    res.on('close', clear);
    next();
  };
}

module.exports = { timeoutGuard };
