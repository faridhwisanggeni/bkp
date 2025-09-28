const Joi = require('joi');

const pagination = Joi.object({
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(500).default(50),
    offset: Joi.number().integer().min(0).default(0),
  }).unknown(false),
}).unknown(true);

const getById = Joi.object({
  params: Joi.object({ id: Joi.number().integer().required() }).unknown(false),
}).unknown(true);

const create = Joi.object({
  body: Joi.object({
    role_name: Joi.string().min(2).max(50).required(),
    is_active: Joi.boolean().default(true),
    created_by: Joi.string().max(100).allow(null, ''),
  }).unknown(false),
}).unknown(true);

const update = Joi.object({
  params: Joi.object({ id: Joi.number().integer().required() }).unknown(false),
  body: Joi.object({
    role_name: Joi.string().min(2).max(50),
    is_active: Joi.boolean(),
    updated_by: Joi.string().max(100).allow(null, ''),
  }).unknown(false),
}).unknown(true);

const remove = getById;

module.exports = { pagination, getById, create, update, remove };
