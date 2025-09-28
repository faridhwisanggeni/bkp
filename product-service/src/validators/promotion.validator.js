const { createPromotionSchema, updatePromotionSchema, queryPromotionSchema } = require('../models/promotion.model');

const validateCreatePromotion = (req, res, next) => {
  const { error, value } = createPromotionSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(detail => detail.message)
    });
  }
  
  req.body = value;
  next();
};

const validateUpdatePromotion = (req, res, next) => {
  const { error, value } = updatePromotionSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(detail => detail.message)
    });
  }
  
  req.body = value;
  next();
};

const validateQueryPromotion = (req, res, next) => {
  const { error, value } = queryPromotionSchema.validate(req.query);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(detail => detail.message)
    });
  }
  
  req.query = value;
  next();
};

module.exports = {
  validateCreatePromotion,
  validateUpdatePromotion,
  validateQueryPromotion
};
