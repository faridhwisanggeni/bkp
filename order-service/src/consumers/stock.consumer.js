const rabbitmqService = require('../services/rabbitmq.service')
const OrderModel = require('../models/order.model')

class StockConsumer {
  constructor() {
    this.isRunning = false
    // Store validation results temporarily
    this.validationResults = new Map()
  }

  async startConsuming() {
    if (this.isRunning) {
      console.log('⚠️  Stock consumer is already running')
      return
    }

    try {
      // Wait for RabbitMQ connection
      while (!rabbitmqService.isHealthy()) {
        console.log('⏳ Waiting for RabbitMQ connection...')
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      console.log('🎯 Starting stock validation consumers...')

      // Consume stock validation responses
      await this.consumeStockValidationResponse()

      this.isRunning = true
      console.log('✅ Stock validation consumers started successfully')

    } catch (error) {
      console.error('❌ Failed to start stock validation consumers:', error)
      throw error
    }
  }

  async consumeStockValidationResponse() {
    const channel = rabbitmqService.channel
    const queueName = 'order.stock.validation.response'

    await channel.consume(queueName, async (message) => {
      if (message) {
        try {
          const content = JSON.parse(message.content.toString())
          console.log('📥 Received stock validation response:', {
            orderId: content.data.order_id,
            username: content.data.username,
            isValid: content.data.validation_result?.is_stock_valid,
            timestamp: content.timestamp
          })

          // Process stock validation response
          await this.processStockValidationResponse(content.data)

          // Acknowledge message
          channel.ack(message)
        } catch (error) {
          console.error('❌ Error processing stock validation response:', error)
          // Reject message and requeue
          channel.nack(message, false, true)
        }
      }
    })

    console.log(`👂 Listening for stock validation responses on queue: ${queueName}`)
  }

  async processStockValidationResponse(responseData) {
    const { order_id, validation_result } = responseData
    
    console.log('🔄 Processing stock validation response for order:', order_id)
    
    try {
      // Store validation result
      const orderValidation = this.validationResults.get(order_id) || {}
      orderValidation.stockValidation = validation_result
      orderValidation.stockValidationReceived = true
      this.validationResults.set(order_id, orderValidation)

      console.log('📊 Stock validation result:', {
        orderId: order_id,
        isValid: validation_result.is_stock_valid,
        hasPromo: validation_result.has_promo_items,
        details: validation_result.validation_details?.length || 0
      })

      // Process the order based on validation
      await this.checkAndProcessOrder(order_id)

      console.log('✅ Stock validation response processed for order:', order_id)
      
    } catch (error) {
      console.error('❌ Error processing stock validation response:', error)
      
      // Update order status to failed if validation fails
      try {
        await OrderModel.updateOrderStatus(order_id, 'failed')
        console.log('📝 Order status updated to failed due to validation error:', order_id)
      } catch (updateError) {
        console.error('❌ Failed to update order status:', updateError)
      }
    }
  }

  async checkAndProcessOrder(orderId) {
    const orderValidation = this.validationResults.get(orderId)
    
    // For the new flow, we only need stock validation
    if (!orderValidation?.stockValidationReceived) {
      console.log('⏳ Waiting for stock validation for order:', orderId)
      return
    }

    console.log('🔍 Processing stock validation for order:', orderId)

    const { stockValidation } = orderValidation
    
    try {
      // Check stock validation
      if (!stockValidation.is_stock_valid) {
        // Stock not available - cancel order
        const updatedOrder = await OrderModel.updateOrderStatus(orderId, 'cancelled')
        
        // Generate detailed error message
        const stockIssues = []
        for (const detail of stockValidation.validation_details) {
          if (!detail.is_valid) {
            if (detail.reason === 'Product not found') {
              stockIssues.push(`Product ID ${detail.id_product} is not available`)
            } else if (detail.reason === 'Product is not active') {
              stockIssues.push(`${detail.product_name} is currently unavailable`)
            } else if (detail.reason === 'Insufficient stock') {
              stockIssues.push(`${detail.product_name} is out of stock (requested: ${detail.requested_qty}, available: ${detail.available_stock})`)
            }
          }
        }
        
        const errorMessage = stockIssues.length > 0 
          ? `Order cannot be processed: ${stockIssues.join(', ')}`
          : 'Order cannot be processed due to stock unavailability or the items have been purchased by other customers'
        
        console.log(`❌ Order ${orderId} cancelled: ${errorMessage}`)
        
        // Publish cancellation event with detailed message
        if (updatedOrder) {
          await rabbitmqService.publishOrderEvent('cancelled', {
            order_id: updatedOrder.order_id,
            username: updatedOrder.username,
            order_status: updatedOrder.order_status,
            total_harga: updatedOrder.total_harga,
            updated_at: updatedOrder.updated_at,
            reason: errorMessage,
            stock_validation_details: stockValidation.validation_details
          })
        }
      } else {
        // Stock available - check if has promo items
        if (stockValidation.has_promo_items) {
          // Has promo - need to validate daily promo limits
          await this.validatePromoLimits(orderId, stockValidation)
        } else {
          // No promo - proceed to payment
          await this.proceedToPayment(orderId)
        }
      }

      // Clean up validation results
      this.validationResults.delete(orderId)
      
    } catch (error) {
      console.error('❌ Error in order processing:', error)
      
      // Try to mark order as failed
      try {
        await OrderModel.updateOrderStatus(orderId, 'failed')
        console.log('📝 Order marked as failed due to processing error:', orderId)
      } catch (updateError) {
        console.error('❌ Failed to mark order as failed:', updateError)
      }
      
      // Clean up validation results
      this.validationResults.delete(orderId)
    }
  }

  async validatePromoLimits(orderId, stockValidation) {
    console.log('🎁 Validating promo limits for order:', orderId)
    
    try {
      // Get today's date
      const today = new Date().toISOString().split('T')[0]
      
      // Get order details to check user's daily promo usage
      const order = await OrderModel.getOrderByOrderId(orderId)
      if (!order) {
        throw new Error('Order not found')
      }

      // Check each promo item against daily limits
      let allPromoItemsValid = true
      const promoValidationDetails = []

      for (const validationDetail of stockValidation.validation_details) {
        if (validationDetail.has_promo) {
          // Get user's daily promo usage for this promo
          const dailyPromoUsage = await this.getUserDailyPromoUsage(order.username, validationDetail.id_promo, today)
          const newTotalQty = dailyPromoUsage + validationDetail.requested_qty
          
          const isWithinLimit = newTotalQty <= validationDetail.max_promo_qty
          
          promoValidationDetails.push({
            id_promo: validationDetail.id_promo,
            id_product: validationDetail.id_product,
            requested_qty: validationDetail.requested_qty,
            current_daily_usage: dailyPromoUsage,
            max_promo_qty: validationDetail.max_promo_qty,
            new_total_qty: newTotalQty,
            is_within_limit: isWithinLimit
          })

          if (!isWithinLimit) {
            allPromoItemsValid = false
          }
        }
      }

      if (allPromoItemsValid) {
        console.log('✅ All promo items within daily limits, proceeding to payment')
        await this.proceedToPayment(orderId)
      } else {
        // Generate detailed promo limit error message
        const promoIssues = []
        for (const detail of promoValidationDetails) {
          if (!detail.is_within_limit) {
            promoIssues.push(`Promo item limit exceeded (requested: ${detail.requested_qty}, daily limit: ${detail.max_promo_qty}, already used: ${detail.current_daily_usage})`)
          }
        }
        
        const errorMessage = `Order cannot be processed: You have exceeded the daily promotional item limits. ${promoIssues.join(', ')}`
        
        console.log('❌ Some promo items exceed daily limits, cancelling order')
        const updatedOrder = await OrderModel.updateOrderStatus(orderId, 'cancelled')
        
        if (updatedOrder) {
          await rabbitmqService.publishOrderEvent('cancelled', {
            order_id: updatedOrder.order_id,
            username: updatedOrder.username,
            order_status: updatedOrder.order_status,
            total_harga: updatedOrder.total_harga,
            updated_at: updatedOrder.updated_at,
            reason: errorMessage,
            promo_validation_details: promoValidationDetails
          })
        }
      }
      
    } catch (error) {
      console.error('❌ Error validating promo limits:', error)
      throw error
    }
  }

  async proceedToPayment(orderId) {
    console.log('💳 Proceeding to payment for order:', orderId)
    
    try {
      // Update order status to ready for payment
      const updatedOrder = await OrderModel.updateOrderStatus(orderId, 'ready_for_payment')
      
      if (updatedOrder) {
        console.log(`✅ Order ${orderId} ready for payment`)
        
        // Publish event that order is ready for payment
        await rabbitmqService.publishOrderEvent('ready_for_payment', {
          order_id: updatedOrder.order_id,
          username: updatedOrder.username,
          order_status: updatedOrder.order_status,
          total_harga: updatedOrder.total_harga,
          updated_at: updatedOrder.updated_at,
          message: 'Order validated successfully, ready for payment'
        })
      }
      
    } catch (error) {
      console.error('❌ Error proceeding to payment:', error)
      throw error
    }
  }

  async getUserDailyPromoUsage(username, promoId, date) {
    try {
      // This would query the database for user's daily promo usage
      // For now, return a mock value
      const mockUsage = Math.floor(Math.random() * 3) // Random 0-2
      console.log(`📊 Daily promo usage for user ${username}, promo ${promoId}: ${mockUsage}`)
      return mockUsage
      
      // In real implementation:
      // SELECT SUM(qty) FROM order_detail od
      // JOIN order_header oh ON od.id_order_header = oh.id
      // WHERE oh.username = ? AND od.id_promo = ? 
      // AND DATE(oh.order_date) = ? AND oh.order_status = 'completed'
      
    } catch (error) {
      console.error('❌ Error getting daily promo usage:', error)
      return 0
    }
  }

  async stopConsuming() {
    this.isRunning = false
    console.log('🛑 Stock validation consumers stopped')
  }

  // Cleanup method for validation results that might be stuck
  async cleanupStaleValidations() {
    const now = Date.now()
    const maxAge = 5 * 60 * 1000 // 5 minutes
    
    for (const [orderId, validation] of this.validationResults.entries()) {
      if (validation.timestamp && (now - validation.timestamp) > maxAge) {
        console.log('🧹 Cleaning up stale validation for order:', orderId)
        this.validationResults.delete(orderId)
      }
    }
  }
}

module.exports = StockConsumer
