const OrderModel = require('../models/order.model')
const rabbitmqService = require('../services/rabbitmq.service')
const Joi = require('joi')

// Validation schema for create order
const createOrderSchema = Joi.object({
  username: Joi.string().required().min(3).max(50),
  total_harga: Joi.number().required().min(0),
  items: Joi.array().items(
    Joi.object({
      id_product: Joi.number().required(),
      qty: Joi.number().required().min(1),
      original_price: Joi.number().required().min(0),
      id_promo: Joi.number().optional().allow(null),
      deduct_price: Joi.number().optional().default(0),
      total_price: Joi.number().required().min(0)
    })
  ).required().min(1)
})

class OrderController {
  // Create new order
  static async createOrder(req, res) {
    try {
      // Validate request body
      const { error, value } = createOrderSchema.validate(req.body)
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details.map(detail => detail.message)
        })
      }
      
      // Create order
      const orderResult = await OrderModel.createOrder(value)
      
      // Publish order created event to RabbitMQ
      try {
        await rabbitmqService.publishOrderCreated({
          order_id: orderResult.orderHeader.order_id,
          username: orderResult.orderHeader.username,
          total_harga: orderResult.orderHeader.total_harga,
          order_status: orderResult.orderHeader.order_status,
          order_date: orderResult.orderHeader.order_date,
          items: orderResult.orderDetails.map(item => ({
            id_product: item.id_product,
            qty: item.qty,
            original_price: item.original_price,
            id_promo: item.id_promo,
            deduct_price: item.deduct_price,
            total_price: item.total_price
          }))
        })
      } catch (mqError) {
        console.error('Failed to publish order created event:', mqError)
        // Don't fail the request if RabbitMQ fails
      }
      
      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: {
          order_id: orderResult.orderHeader.order_id,
          order_header: orderResult.orderHeader,
          order_details: orderResult.orderDetails
        }
      })
      
    } catch (error) {
      console.error('Error creating order:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }
  
  // Get order by order_id
  static async getOrderByOrderId(req, res) {
    try {
      const { orderId } = req.params
      
      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: 'Order ID is required'
        })
      }
      
      const order = await OrderModel.getOrderByOrderId(orderId)
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        })
      }
      
      res.json({
        success: true,
        data: order
      })
      
    } catch (error) {
      console.error('Error getting order:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }
  
  // Get orders by username
  static async getOrdersByUsername(req, res) {
    try {
      const { username } = req.params
      
      if (!username) {
        return res.status(400).json({
          success: false,
          message: 'Username is required'
        })
      }
      
      const orders = await OrderModel.getOrdersByUsername(username)
      
      res.json({
        success: true,
        data: orders
      })
      
    } catch (error) {
      console.error('Error getting orders by username:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }
  
  // Update order status
  static async updateOrderStatus(req, res) {
    try {
      const { orderId } = req.params
      const { status } = req.body
      
      // Validate status
      const validStatuses = ['pending', 'ready_for_payment', 'completed', 'cancelled', 'failed']
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: pending, ready_for_payment, completed, cancelled, failed'
        })
      }
      
      const updatedOrder = await OrderModel.updateOrderStatus(orderId, status)
      
      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        })
      }
      
      // Publish order updated event to RabbitMQ
      try {
        const eventType = status === 'completed' ? 'completed' : 'updated'
        const publishMethod = status === 'completed' ? 'publishOrderCompleted' : 'publishOrderUpdated'
        
        await rabbitmqService[publishMethod]({
          order_id: updatedOrder.order_id,
          username: updatedOrder.username,
          order_status: updatedOrder.order_status,
          total_harga: updatedOrder.total_harga,
          updated_at: updatedOrder.updated_at
        })
      } catch (mqError) {
        console.error('Failed to publish order status update event:', mqError)
        // Don't fail the request if RabbitMQ fails
      }
      
      res.json({
        success: true,
        message: 'Order status updated successfully',
        data: updatedOrder
      })
      
    } catch (error) {
      console.error('Error updating order status:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }

  // Complete payment for order
  static async completePayment(req, res) {
    try {
      const { orderId } = req.params
      const { payment_method, card_number } = req.body
      
      // Validate payment data
      if (!payment_method || !card_number) {
        return res.status(400).json({
          success: false,
          message: 'Payment method and card number are required'
        })
      }
      
      // Get current order
      const currentOrder = await OrderModel.getOrderByOrderId(orderId)
      if (!currentOrder) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        })
      }
      
      // Check if order is ready for payment
      if (currentOrder.order_status !== 'ready_for_payment') {
        return res.status(400).json({
          success: false,
          message: `Order is not ready for payment. Current status: ${currentOrder.order_status}`
        })
      }
      
      // Simulate payment processing (always success for demo)
      console.log(`💳 Processing payment for order ${orderId} with card ending in ${card_number.slice(-4)}`)
      
      // Update order status to completed
      const updatedOrder = await OrderModel.updateOrderStatus(orderId, 'completed')
      
      if (!updatedOrder) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update order status'
        })
      }
      
      // Publish order completed event to RabbitMQ (this will trigger stock reduction)
      try {
        await rabbitmqService.publishOrderCompleted({
          order_id: updatedOrder.order_id,
          username: updatedOrder.username,
          order_status: updatedOrder.order_status,
          total_harga: updatedOrder.total_harga,
          updated_at: updatedOrder.updated_at,
          items: currentOrder.order_details,
          payment_info: {
            payment_method,
            card_last_four: card_number.slice(-4),
            payment_date: new Date().toISOString()
          }
        })
      } catch (mqError) {
        console.error('Failed to publish order completed event:', mqError)
        // Don't fail the request if RabbitMQ fails
      }
      
      res.json({
        success: true,
        message: 'Payment completed successfully',
        data: {
          order_id: updatedOrder.order_id,
          order_status: updatedOrder.order_status,
          payment_info: {
            payment_method,
            card_last_four: card_number.slice(-4),
            payment_date: new Date().toISOString()
          }
        }
      })
      
    } catch (error) {
      console.error('Error completing payment:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }
}

module.exports = OrderController
