const amqp = require('amqplib')
require('dotenv').config()

class RabbitMQService {
  constructor() {
    this.connection = null
    this.channel = null
    this.isConnected = false
  }

  async connect() {
    try {
      const rabbitmqUrl = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}${process.env.RABBITMQ_VHOST}`
      
      console.log('🐰 Product Service connecting to RabbitMQ...')
      this.connection = await amqp.connect(rabbitmqUrl)
      this.channel = await this.connection.createChannel()
      
      // Setup exchanges and queues
      await this.setupExchangesAndQueues()
      
      this.isConnected = true
      console.log('✅ Product Service connected to RabbitMQ successfully')
      
      // Handle connection events
      this.connection.on('error', (err) => {
        console.error('❌ RabbitMQ connection error:', err)
        this.isConnected = false
      })
      
      this.connection.on('close', () => {
        console.log('🔌 RabbitMQ connection closed')
        this.isConnected = false
      })
      
    } catch (error) {
      console.error('❌ Failed to connect to RabbitMQ:', error)
      this.isConnected = false
      throw error
    }
  }

  async setupExchangesAndQueues() {
    try {
      // Create exchanges
      await this.channel.assertExchange('order.events', 'topic', {
        durable: true
      })
      
      await this.channel.assertExchange('stock.events', 'topic', {
        durable: true
      })
      
      // Create queues for consuming order events
      const orderQueues = [
        'product.order.created',
        'product.order.updated'
      ]
      
      for (const queueName of orderQueues) {
        await this.channel.assertQueue(queueName, {
          durable: true
        })
      }
      
      // Bind order queues to order exchange
      await this.channel.bindQueue('product.order.created', 'order.events', 'order.created')
      await this.channel.bindQueue('product.order.updated', 'order.events', 'order.updated')
      
      // Create queues for stock validation responses
      const stockQueues = [
        'stock.validation.response',
        'stock.limit.response'
      ]
      
      for (const queueName of stockQueues) {
        await this.channel.assertQueue(queueName, {
          durable: true
        })
        
        // Bind to stock exchange
        const routingKey = queueName.replace('.', '.')
        await this.channel.bindQueue(queueName, 'stock.events', routingKey)
      }
      
      console.log('✅ Product Service RabbitMQ exchanges and queues setup completed')
    } catch (error) {
      console.error('❌ Failed to setup RabbitMQ exchanges and queues:', error)
      throw error
    }
  }

  async publishStockValidationResponse(orderData, stockValidation) {
    if (!this.isConnected || !this.channel) {
      console.error('❌ RabbitMQ not connected, cannot publish message')
      return false
    }

    try {
      const routingKey = 'stock.validation.response'
      const message = {
        eventType: 'stock_validation_response',
        timestamp: new Date().toISOString(),
        data: {
          order_id: orderData.order_id,
          username: orderData.username,
          validation_result: stockValidation,
          processed_by: 'product-service'
        }
      }

      const published = this.channel.publish(
        'stock.events',
        routingKey,
        Buffer.from(JSON.stringify(message)),
        {
          persistent: true,
          contentType: 'application/json'
        }
      )

      if (published) {
        console.log(`📤 Published stock validation response for order ${orderData.order_id}`)
        return true
      } else {
        console.error('❌ Failed to publish stock validation response')
        return false
      }
    } catch (error) {
      console.error('❌ Error publishing stock validation response:', error)
      return false
    }
  }

  async publishStockLimitResponse(orderData, limitValidation) {
    if (!this.isConnected || !this.channel) {
      console.error('❌ RabbitMQ not connected, cannot publish message')
      return false
    }

    try {
      const routingKey = 'stock.limit.response'
      const message = {
        eventType: 'stock_limit_response',
        timestamp: new Date().toISOString(),
        data: {
          order_id: orderData.order_id,
          username: orderData.username,
          limit_validation: limitValidation,
          processed_by: 'product-service'
        }
      }

      const published = this.channel.publish(
        'stock.events',
        routingKey,
        Buffer.from(JSON.stringify(message)),
        {
          persistent: true,
          contentType: 'application/json'
        }
      )

      if (published) {
        console.log(`📤 Published stock limit response for order ${orderData.order_id}`)
        return true
      } else {
        console.error('❌ Failed to publish stock limit response')
        return false
      }
    } catch (error) {
      console.error('❌ Error publishing stock limit response:', error)
      return false
    }
  }

  async close() {
    try {
      if (this.channel) {
        await this.channel.close()
      }
      if (this.connection) {
        await this.connection.close()
      }
      this.isConnected = false
      console.log('🔌 Product Service RabbitMQ connection closed')
    } catch (error) {
      console.error('❌ Error closing RabbitMQ connection:', error)
    }
  }

  // Health check method
  isHealthy() {
    return this.isConnected && !!this.connection && !!this.channel
  }

  // Get connection status for health check
  getStatus() {
    return {
      connected: this.isConnected,
      hasConnection: !!this.connection,
      hasChannel: !!this.channel
    }
  }
}

// Create singleton instance
const rabbitmqService = new RabbitMQService()

module.exports = rabbitmqService
