const router = require('express').Router();
const { healthCheck } = require('../db/pool');

router.get('/', async (req, res) => {
  res.json({ message: 'Welcome to User Service API', status: 'active', timestamp: new Date() });
});

router.get('/health', async (req, res) => {
  const dbOk = await healthCheck();
  const status = dbOk ? 'ok' : 'degraded';
  res.status(dbOk ? 200 : 503).json({ status, db: dbOk ? 'up' : 'down', timestamp: new Date() });
});

module.exports = { healthRouter: router };
