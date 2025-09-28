const rabbitmqService = require('../services/rabbitmq.service')

class OrderConsumer {
  constructor() {
    this.isRunning = false
  }

  async startConsuming() {
    if (this.isRunning) {
      console.log('⚠️  Order consumer is already running')
      return
    }

    try {
      // Wait for RabbitMQ connection
      while (!rabbitmqService.isHealthy()) {
        console.log('⏳ Waiting for RabbitMQ connection...')
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      console.log('🎯 Starting order event consumers...')

      // Consume order created events
      await this.consumeOrderCreated()
      
      // Consume order updated events
      await this.consumeOrderUpdated()
      
      // Consume order completed events
      await this.consumeOrderCompleted()

      this.isRunning = true
      console.log('✅ Order consumers started successfully')

    } catch (error) {
      console.error('❌ Failed to start order consumers:', error)
      throw error
    }
  }

  async consumeOrderCreated() {
    const channel = rabbitmqService.channel
    const queueName = 'order.created'

    await channel.consume(queueName, async (message) => {
      if (message) {
        try {
          const content = JSON.parse(message.content.toString())
          console.log('📥 Received order created event:', {
            orderId: content.data.order_id,
            username: content.data.username,
            total: content.data.total_harga,
            timestamp: content.timestamp
          })

          // Process order created event
          await this.processOrderCreated(content.data)

          // Acknowledge message
          channel.ack(message)
        } catch (error) {
          console.error('❌ Error processing order created event:', error)
          // Reject message and requeue
          channel.nack(message, false, true)
        }
      }
    })

    console.log(`👂 Listening for order created events on queue: ${queueName}`)
  }

  async consumeOrderUpdated() {
    const channel = rabbitmqService.channel
    const queueName = 'order.updated'

    await channel.consume(queueName, async (message) => {
      if (message) {
        try {
          const content = JSON.parse(message.content.toString())
          console.log('📥 Received order updated event:', {
            orderId: content.data.order_id,
            status: content.data.order_status,
            timestamp: content.timestamp
          })

          // Process order updated event
          await this.processOrderUpdated(content.data)

          // Acknowledge message
          channel.ack(message)
        } catch (error) {
          console.error('❌ Error processing order updated event:', error)
          // Reject message and requeue
          channel.nack(message, false, true)
        }
      }
    })

    console.log(`👂 Listening for order updated events on queue: ${queueName}`)
  }

  async consumeOrderCompleted() {
    const channel = rabbitmqService.channel
    const queueName = 'order.completed'

    await channel.consume(queueName, async (message) => {
      if (message) {
        try {
          const content = JSON.parse(message.content.toString())
          console.log('📥 Received order completed event:', {
            orderId: content.data.order_id,
            username: content.data.username,
            timestamp: content.timestamp
          })

          // Process order completed event
          await this.processOrderCompleted(content.data)

          // Acknowledge message
          channel.ack(message)
        } catch (error) {
          console.error('❌ Error processing order completed event:', error)
          // Reject message and requeue
          channel.nack(message, false, true)
        }
      }
    })

    console.log(`👂 Listening for order completed events on queue: ${queueName}`)
  }

  async processOrderCreated(orderData) {
    // Example processing for order created
    console.log('🔄 Processing order created:', orderData.order_id)
    
    // Here you could:
    // - Send email notification
    // - Update inventory
    // - Create shipping record
    // - Send to payment processing
    // - Log analytics
    
    console.log('✅ Order created processing completed for:', orderData.order_id)
  }

  async processOrderUpdated(orderData) {
    // Example processing for order updated
    console.log('🔄 Processing order updated:', orderData.order_id, 'Status:', orderData.order_status)
    
    // Here you could:
    // - Update external systems
    // - Send status notification
    // - Update tracking information
    
    console.log('✅ Order updated processing completed for:', orderData.order_id)
  }

  async processOrderCompleted(orderData) {
    // Example processing for order completed
    console.log('🔄 Processing order completed:', orderData.order_id)
    
    // Here you could:
    // - Generate invoice
    // - Send completion email
    // - Update customer loyalty points
    // - Archive order data
    
    console.log('✅ Order completed processing completed for:', orderData.order_id)
  }

  async stopConsuming() {
    this.isRunning = false
    console.log('🛑 Order consumers stopped')
  }
}

module.exports = OrderConsumer
