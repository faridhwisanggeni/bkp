const Joi = require('joi');

const createProductSchema = Joi.object({
  product_name: Joi.string().min(1).max(200).required(),
  price: Joi.number().min(0).precision(2).required(),
  qty: Joi.number().integer().min(0).required(),
  is_active: Joi.boolean().default(true),
  created_by: Joi.string().max(100).optional()
});

const updateProductSchema = Joi.object({
  product_name: Joi.string().min(1).max(200).optional(),
  price: Joi.number().min(0).precision(2).optional(),
  qty: Joi.number().integer().min(0).optional(),
  is_active: Joi.boolean().optional(),
  updated_by: Joi.string().max(100).optional()
});

const queryProductSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().max(200).optional(),
  is_active: Joi.boolean().optional(),
  sort_by: Joi.string().valid('id', 'product_name', 'qty', 'created_at').default('id'),
  sort_order: Joi.string().valid('asc', 'desc').default('asc')
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  queryProductSchema
};
