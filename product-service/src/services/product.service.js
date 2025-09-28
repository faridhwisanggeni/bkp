const ProductRepository = require('../repositories/product.repository');

class ProductService {
  constructor() {
    this.productRepository = new ProductRepository();
  }

  async createProduct(productData) {
    try {
      const product = await this.productRepository.create(productData);
      return { success: true, data: product };
    } catch (error) {
      console.error('Error creating product:', error);
      return { success: false, error: error.message };
    }
  }

  async getProductById(id) {
    try {
      const product = await this.productRepository.findById(id);
      if (!product) {
        return { success: false, error: 'Product not found' };
      }
      return { success: true, data: product };
    } catch (error) {
      console.error('Error getting product by id:', error);
      return { success: false, error: error.message };
    }
  }

  async getAllProducts(filters) {
    try {
      const result = await this.productRepository.findAll(filters);
      return { success: true, data: result.data, pagination: result.pagination };
    } catch (error) {
      console.error('Error getting all products:', error);
      return { success: false, error: error.message };
    }
  }

  async updateProduct(id, productData) {
    try {
      const existingProduct = await this.productRepository.findById(id);
      if (!existingProduct) {
        return { success: false, error: 'Product not found' };
      }

      const updatedProduct = await this.productRepository.update(id, productData);
      return { success: true, data: updatedProduct };
    } catch (error) {
      console.error('Error updating product:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteProduct(id) {
    try {
      const existingProduct = await this.productRepository.findById(id);
      if (!existingProduct) {
        return { success: false, error: 'Product not found' };
      }

      const deletedProduct = await this.productRepository.delete(id);
      return { success: true, data: deletedProduct };
    } catch (error) {
      console.error('Error deleting product:', error);
      return { success: false, error: error.message };
    }
  }

  async checkProductExists(id) {
    try {
      const exists = await this.productRepository.exists(id);
      return { success: true, exists };
    } catch (error) {
      console.error('Error checking product exists:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = ProductService;
