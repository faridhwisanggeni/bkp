const Joi = require('joi');

const login = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).required(),
  }).unknown(false),
}).unknown(true);

const refresh = Joi.object({
  body: Joi.object({
    refreshToken: Joi.string().required(),
  }).unknown(false),
}).unknown(true);

module.exports = { login, refresh };
