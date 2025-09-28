const { createProductSchema, updateProductSchema, queryProductSchema } = require('../models/product.model');

const validateCreateProduct = (req, res, next) => {
  const { error, value } = createProductSchema.validate(req.body);
  
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

const validateUpdateProduct = (req, res, next) => {
  const { error, value } = updateProductSchema.validate(req.body);
  
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

const validateQueryProduct = (req, res, next) => {
  const { error, value } = queryProductSchema.validate(req.query);
  
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
  validateCreateProduct,
  validateUpdateProduct,
  validateQueryProduct
};
