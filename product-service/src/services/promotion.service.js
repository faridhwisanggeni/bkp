const PromotionRepository = require('../repositories/promotion.repository');
const ProductRepository = require('../repositories/product.repository');

class PromotionService {
  constructor() {
    this.promotionRepository = new PromotionRepository();
    this.productRepository = new ProductRepository();
  }

  async createPromotion(promotionData) {
    try {
      // Check if product exists
      const productExists = await this.productRepository.exists(promotionData.product_id);
      if (!productExists) {
        return { success: false, error: 'Product not found' };
      }

      const promotion = await this.promotionRepository.create(promotionData);
      return { success: true, data: promotion };
    } catch (error) {
      console.error('Error creating promotion:', error);
      return { success: false, error: error.message };
    }
  }

  async getPromotionById(id) {
    try {
      const promotion = await this.promotionRepository.findById(id);
      if (!promotion) {
        return { success: false, error: 'Promotion not found' };
      }
      return { success: true, data: promotion };
    } catch (error) {
      console.error('Error getting promotion by id:', error);
      return { success: false, error: error.message };
    }
  }

  async getAllPromotions(filters) {
    try {
      const result = await this.promotionRepository.findAll(filters);
      return { success: true, data: result.data, pagination: result.pagination };
    } catch (error) {
      console.error('Error getting all promotions:', error);
      return { success: false, error: error.message };
    }
  }

  async updatePromotion(id, promotionData) {
    try {
      const existingPromotion = await this.promotionRepository.findById(id);
      if (!existingPromotion) {
        return { success: false, error: 'Promotion not found' };
      }

      // Check if product exists if product_id is being updated
      if (promotionData.product_id) {
        const productExists = await this.productRepository.exists(promotionData.product_id);
        if (!productExists) {
          return { success: false, error: 'Product not found' };
        }
      }

      const updatedPromotion = await this.promotionRepository.update(id, promotionData);
      return { success: true, data: updatedPromotion };
    } catch (error) {
      console.error('Error updating promotion:', error);
      return { success: false, error: error.message };
    }
  }

  async deletePromotion(id) {
    try {
      const existingPromotion = await this.promotionRepository.findById(id);
      if (!existingPromotion) {
        return { success: false, error: 'Promotion not found' };
      }

      const deletedPromotion = await this.promotionRepository.delete(id);
      return { success: true, data: deletedPromotion };
    } catch (error) {
      console.error('Error deleting promotion:', error);
      return { success: false, error: error.message };
    }
  }

  async getPromotionsByProductId(productId) {
    try {
      const productExists = await this.productRepository.exists(productId);
      if (!productExists) {
        return { success: false, error: 'Product not found' };
      }

      const promotions = await this.promotionRepository.findByProductId(productId);
      return { success: true, data: promotions };
    } catch (error) {
      console.error('Error getting promotions by product id:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = PromotionService;
