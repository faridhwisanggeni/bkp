const rabbitmqService = require('../services/rabbitmq.service')
const ProductRepository = require('../repositories/product.repository')
const redisClient = require('../config/redis')

class OrderConsumer {
  constructor() {
    this.isRunning = false
    this.productRepository = new ProductRepository()
  }

  async startConsuming() {
    if (this.isRunning) {
      console.log('⚠️  Product Order consumer is already running')
      return
    }

    try {
      // Wait for RabbitMQ connection
      while (!rabbitmqService.isHealthy()) {
        console.log('⏳ Waiting for RabbitMQ connection...')
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      console.log('🎯 Starting product order event consumers...')

      // Consume order created events for stock validation
      await this.consumeOrderCreated()
      
      // Consume order updated events if needed
      await this.consumeOrderUpdated()

      this.isRunning = true
      console.log('✅ Product order consumers started successfully')

    } catch (error) {
      console.error('❌ Failed to start product order consumers:', error)
      throw error
    }
  }

  async consumeOrderCreated() {
    const channel = rabbitmqService.channel
    const queueName = 'product.order.created'

    await channel.consume(queueName, async (message) => {
      if (message) {
        try {
          const content = JSON.parse(message.content.toString())
          console.log('📥 Product Service received order created event:', {
            orderId: content.data.order_id,
            username: content.data.username,
            itemsCount: content.data.items?.length || 0,
            timestamp: content.timestamp
          })

          // Process stock validation
          await this.processStockValidation(content.data)

          // Acknowledge message
          channel.ack(message)
        } catch (error) {
          console.error('❌ Error processing order created event in product service:', error)
          // Reject message and requeue
          channel.nack(message, false, true)
        }
      }
    })

    console.log(`👂 Product Service listening for order created events on queue: ${queueName}`)
  }

  async consumeOrderUpdated() {
    const channel = rabbitmqService.channel
    const queueName = 'product.order.updated'

    await channel.consume(queueName, async (message) => {
      if (message) {
        try {
          const content = JSON.parse(message.content.toString())
          console.log('📥 Product Service received order updated event:', {
            orderId: content.data.order_id,
            status: content.data.order_status,
            timestamp: content.timestamp
          })

          // Process order update if needed
          await this.processOrderUpdated(content.data)

          // Acknowledge message
          channel.ack(message)
        } catch (error) {
          console.error('❌ Error processing order updated event in product service:', error)
          // Reject message and requeue
          channel.nack(message, false, true)
        }
      }
    })

    console.log(`👂 Product Service listening for order updated events on queue: ${queueName}`)
  }

  async processStockValidation(orderData) {
    console.log('🔄 Processing stock validation for order:', orderData.order_id)
    
    try {
      const stockValidationResults = []
      let allItemsValid = true
      let hasPromoItems = false

      // Validate each item in the order
      for (const item of orderData.items || []) {
        // Check if item has promo
        if (item.id_promo) {
          hasPromoItems = true
        }
        
        // Get product from database
        const product = await this.productRepository.findById(item.id_product)
        
        if (!product) {
          stockValidationResults.push({
            id_product: item.id_product,
            requested_qty: item.qty,
            available_stock: 0,
            is_valid: false,
            reason: 'Product not found',
            has_promo: !!item.id_promo,
            id_promo: item.id_promo || null
          })
          allItemsValid = false
          continue
        }

        // Check if product is active
        if (!product.is_active) {
          stockValidationResults.push({
            id_product: item.id_product,
            product_name: product.product_name,
            requested_qty: item.qty,
            available_stock: product.qty,
            is_valid: false,
            reason: 'Product is not active',
            has_promo: !!item.id_promo,
            id_promo: item.id_promo || null
          })
          allItemsValid = false
          continue
        }

        // Check stock availability
        const isStockAvailable = product.qty >= item.qty
        
        // Get maximum qty for promo items (if applicable)
        let maxPromoQty = null
        if (item.id_promo) {
          maxPromoQty = await this.getPromoMaxQty(item.id_promo)
        }
        
        stockValidationResults.push({
          id_product: item.id_product,
          product_name: product.product_name,
          requested_qty: item.qty,
          available_stock: product.qty,
          is_valid: isStockAvailable,
          reason: isStockAvailable ? 'Stock available' : 'Insufficient stock',
          has_promo: !!item.id_promo,
          id_promo: item.id_promo || null,
          max_promo_qty: maxPromoQty
        })

        if (!isStockAvailable) {
          allItemsValid = false
        }
      }

      // Prepare stock validation response
      const stockValidation = {
        order_id: orderData.order_id,
        is_stock_valid: allItemsValid,
        has_promo_items: hasPromoItems,
        validation_details: stockValidationResults,
        validated_at: new Date().toISOString()
      }

      // Publish stock validation response
      await rabbitmqService.publishStockValidationResponse(orderData, stockValidation)

      console.log('✅ Stock validation completed for order:', orderData.order_id, 'Valid:', allItemsValid, 'Has Promo:', hasPromoItems)
      
    } catch (error) {
      console.error('❌ Error during stock validation:', error)
      
      // Send error response
      const errorValidation = {
        order_id: orderData.order_id,
        is_stock_valid: false,
        has_promo_items: false,
        error: 'Stock validation failed',
        error_details: error.message,
        validated_at: new Date().toISOString()
      }
      
      await rabbitmqService.publishStockValidationResponse(orderData, errorValidation)
    }
  }

  async getPromoMaxQty(promoId) {
    try {
      // Get promo details from database
      // This would typically query the promotion table
      // For now, return a default max qty
      const defaultMaxQty = 5 // Default maximum quantity for promo items
      
      // In real implementation, you would query:
      // SELECT max_qty FROM promotions WHERE id = promoId
      
      console.log(`📊 Getting max qty for promo ${promoId}: ${defaultMaxQty}`)
      return defaultMaxQty
    } catch (error) {
      console.error('❌ Error getting promo max qty:', error)
      return 1 // Default to 1 if error
    }
  }

  async processOrderUpdated(orderData) {
    console.log('🔄 Processing order updated in product service:', orderData.order_id)
    
    // Handle order status updates
    if (orderData.order_status === 'completed') {
      console.log('💳 Order completed, reducing stock:', orderData.order_id)
      await this.reduceStock(orderData)
    } else if (orderData.order_status === 'cancelled') {
      console.log('📦 Order cancelled, no stock reduction needed:', orderData.order_id)
    }
    
    console.log('✅ Order updated processing completed in product service:', orderData.order_id)
  }

  async reduceStock(orderData) {
    console.log('📦 Reducing stock for completed order:', orderData.order_id)
    
    try {
      for (const item of orderData.items || []) {
        // Get current product
        const product = await this.productRepository.findById(item.id_product)
        
        if (!product) {
          console.error(`❌ Product not found for stock reduction: ${item.id_product}`)
          continue
        }

        // Calculate new stock
        const newStock = Math.max(0, product.qty - item.qty)
        
        // Update stock in database
        await this.productRepository.update(item.id_product, {
          qty: newStock,
          updated_by: 'system-stock-reduction'
        })

        console.log(`📉 Stock reduced for product ${item.id_product}: ${product.qty} → ${newStock} (reduced by ${item.qty})`)

        // Update Redis cache (if Redis is available)
        await this.updateStockCache(item.id_product, newStock)
      }

      console.log('✅ Stock reduction completed for order:', orderData.order_id)
      
    } catch (error) {
      console.error('❌ Error reducing stock:', error)
    }
  }

  async updateStockCache(productId, newStock) {
    try {
      // Update Redis cache with new stock level
      const cacheKey = `product:${productId}:stock`
      const success = await redisClient.set(cacheKey, newStock, 3600) // 1 hour TTL
      
      if (success) {
        console.log(`✅ Redis cache updated for product ${productId}: stock = ${newStock}`)
      } else {
        console.log(`⚠️ Failed to update Redis cache for product ${productId}`)
      }
      
      // Also cache the full product data
      const product = await this.productRepository.findById(productId)
      if (product) {
        const productCacheKey = `product:${productId}:data`
        await redisClient.set(productCacheKey, product, 1800) // 30 minutes TTL
        console.log(`✅ Redis product data cached for product ${productId}`)
      }
      
    } catch (error) {
      console.error('❌ Error updating stock cache:', error)
    }
  }

  async stopConsuming() {
    this.isRunning = false
    console.log('🛑 Product order consumers stopped')
  }
}

module.exports = OrderConsumer
