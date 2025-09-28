const ProductService = require('../services/product.service');

class ProductController {
  constructor() {
    this.productService = new ProductService();
  }

  async createProduct(req, res) {
    try {
      const result = await this.productService.createProduct(req.body);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error
        });
      }

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: result.data
      });
    } catch (error) {
      console.error('Error in createProduct controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getProductById(req, res) {
    try {
      const { id } = req.params;
      const result = await this.productService.getProductById(parseInt(id));
      
      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.error
        });
      }

      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      console.error('Error in getProductById controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getAllProducts(req, res) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        search: req.query.search,
        is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
        sort_by: req.query.sort_by || 'id',
        sort_order: req.query.sort_order || 'asc'
      };

      const result = await this.productService.getAllProducts(filters);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error
        });
      }

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error in getAllProducts controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const result = await this.productService.updateProduct(parseInt(id), req.body);
      
      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.error
        });
      }

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: result.data
      });
    } catch (error) {
      console.error('Error in updateProduct controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const result = await this.productService.deleteProduct(parseInt(id));
      
      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.error
        });
      }

      res.json({
        success: true,
        message: 'Product deleted successfully',
        data: result.data
      });
    } catch (error) {
      console.error('Error in deleteProduct controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = ProductController;
