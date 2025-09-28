const express = require('express');
const ProductController = require('../controllers/product.controller');
const { validateCreateProduct, validateUpdateProduct, validateQueryProduct } = require('../validators/product.validator');

const router = express.Router();
const productController = new ProductController();

// GET /api/products - Get all products with filtering and pagination
router.get('/', validateQueryProduct, (req, res) => {
  productController.getAllProducts(req, res);
});

// GET /api/products/:id - Get product by ID
router.get('/:id', (req, res) => {
  productController.getProductById(req, res);
});

// POST /api/products - Create new product
router.post('/', validateCreateProduct, (req, res) => {
  productController.createProduct(req, res);
});

// PUT /api/products/:id - Update product
router.put('/:id', validateUpdateProduct, (req, res) => {
  productController.updateProduct(req, res);
});


module.exports = router;
