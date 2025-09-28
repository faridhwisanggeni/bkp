const PromotionService = require('../services/promotion.service');

class PromotionController {
  constructor() {
    this.promotionService = new PromotionService();
  }

  async createPromotion(req, res) {
    try {
      const result = await this.promotionService.createPromotion(req.body);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error
        });
      }

      res.status(201).json({
        success: true,
        message: 'Promotion created successfully',
        data: result.data
      });
    } catch (error) {
      console.error('Error in createPromotion controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getPromotionById(req, res) {
    try {
      const { id } = req.params;
      const result = await this.promotionService.getPromotionById(parseInt(id));
      
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
      console.error('Error in getPromotionById controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getAllPromotions(req, res) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        search: req.query.search,
        product_id: req.query.product_id ? parseInt(req.query.product_id) : undefined,
        is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
        status: req.query.status,
        sort_by: req.query.sort_by || 'id',
        sort_order: req.query.sort_order || 'asc'
      };

      const result = await this.promotionService.getAllPromotions(filters);
      
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
      console.error('Error in getAllPromotions controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async updatePromotion(req, res) {
    try {
      const { id } = req.params;
      const result = await this.promotionService.updatePromotion(parseInt(id), req.body);
      
      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.error
        });
      }

      res.json({
        success: true,
        message: 'Promotion updated successfully',
        data: result.data
      });
    } catch (error) {
      console.error('Error in updatePromotion controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async deletePromotion(req, res) {
    try {
      const { id } = req.params;
      const result = await this.promotionService.deletePromotion(parseInt(id));
      
      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.error
        });
      }

      res.json({
        success: true,
        message: 'Promotion deleted successfully',
        data: result.data
      });
    } catch (error) {
      console.error('Error in deletePromotion controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getPromotionsByProductId(req, res) {
    try {
      const { productId } = req.params;
      const result = await this.promotionService.getPromotionsByProductId(parseInt(productId));
      
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
      console.error('Error in getPromotionsByProductId controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = PromotionController;
