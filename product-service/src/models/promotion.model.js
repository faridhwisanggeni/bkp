const Joi = require('joi');

const createPromotionSchema = Joi.object({
  product_id: Joi.number().integer().positive().required(),
  promotion_name: Joi.string().min(1).max(200).required(),
  promotion_type: Joi.string().valid('discount', 'cashback').required(),
  discount: Joi.when('promotion_type', {
    is: 'discount',
    then: Joi.number().integer().min(0).max(100).required(),
    otherwise: Joi.number().integer().min(0).required()
  }),
  qty_max: Joi.number().integer().min(1).required(),
  is_active: Joi.boolean().default(true),
  started_at: Joi.date().iso().required(),
  ended_at: Joi.date().iso().min(Joi.ref('started_at')).required(),
  created_by: Joi.string().max(100).optional()
});

const updatePromotionSchema = Joi.object({
  product_id: Joi.number().integer().positive().optional(),
  promotion_name: Joi.string().min(1).max(200).optional(),
  promotion_type: Joi.string().valid('discount', 'cashback').optional(),
  discount: Joi.when('promotion_type', {
    is: 'discount',
    then: Joi.number().integer().min(0).max(100).optional(),
    otherwise: Joi.number().integer().min(0).optional()
  }),
  qty_max: Joi.number().integer().min(1).optional(),
  is_active: Joi.boolean().optional(),
  started_at: Joi.date().iso().optional(),
  ended_at: Joi.date().iso().optional(),
  updated_by: Joi.string().max(100).optional()
}).custom((value, helpers) => {
  // Validate that ended_at is not before started_at if both are provided
  if (value.started_at && value.ended_at && value.ended_at < value.started_at) {
    return helpers.error('any.invalid', { message: 'ended_at must be greater than or equal to started_at' });
  }
  return value;
});

const queryPromotionSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().max(200).optional(),
  product_id: Joi.number().integer().positive().optional(),
  is_active: Joi.boolean().optional(),
  status: Joi.string().valid('active', 'scheduled', 'expired').optional(),
  sort_by: Joi.string().valid('id', 'promotion_name', 'started_at', 'ended_at', 'created_at').default('id'),
  sort_order: Joi.string().valid('asc', 'desc').default('asc')
});

module.exports = {
  createPromotionSchema,
  updatePromotionSchema,
  queryPromotionSchema
};
