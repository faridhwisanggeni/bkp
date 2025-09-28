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
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().max(200).required(),
    role_id: Joi.number().integer().required(),
    is_active: Joi.boolean().default(true),
    created_by: Joi.string().max(100).allow(null, ''),
    password: Joi.string().min(8).max(128).required(),
  }).unknown(false),
}).unknown(true);

const update = Joi.object({
  params: Joi.object({ id: Joi.number().integer().required() }).unknown(false),
  body: Joi.object({
    name: Joi.string().min(2).max(100),
    email: Joi.string().email().max(200),
    role_id: Joi.number().integer(),
    is_active: Joi.boolean(),
    updated_by: Joi.string().max(100).allow(null, ''),
    password: Joi.string().min(8).max(128),
  }).unknown(false),
}).unknown(true);

const remove = getById;

module.exports = { pagination, getById, create, update, remove };
