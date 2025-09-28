const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/error');
const { httpLogger } = require('./middlewares/logger');
const { timeoutGuard } = require('./middlewares/timeout');

const app = express();

// Security and performance middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(httpLogger);
app.use(timeoutGuard());

// Basic rate limiting (tune as needed)
const limiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
app.use(limiter);

// Routes
app.use('/', routes);

// 404 and Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
