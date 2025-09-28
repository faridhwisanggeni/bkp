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
      
      console.log('🐰 Connecting to RabbitMQ...')
      this.connection = await amqp.connect(rabbitmqUrl)
      this.channel = await this.connection.createChannel()
      
      // Setup exchanges and queues
      await this.setupExchangesAndQueues()
      
      this.isConnected = true
      console.log('✅ Connected to RabbitMQ successfully')
      
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
      // Create exchange for order events
      await this.channel.assertExchange('order.events', 'topic', {
        durable: true
      })
      
      // Create queues
      const queues = [
        'order.created',
        'order.updated',
        'order.completed'
      ]
      
      for (const queueName of queues) {
        await this.channel.assertQueue(queueName, {
          durable: true
        })
        
        // Bind queue to exchange
        const routingKey = queueName.replace('.', '.')
        await this.channel.bindQueue(queueName, 'order.events', routingKey)
      }
      
      console.log('✅ RabbitMQ exchanges and queues setup completed')
    } catch (error) {
      console.error('❌ Failed to setup RabbitMQ exchanges and queues:', error)
      throw error
    }
  }

  async publishOrderEvent(eventType, orderData) {
    if (!this.isConnected || !this.channel) {
      console.error('❌ RabbitMQ not connected, cannot publish message')
      return false
    }

    try {
      const routingKey = `order.${eventType}`
      const message = {
        eventType,
        timestamp: new Date().toISOString(),
        data: orderData
      }

      const published = this.channel.publish(
        'order.events',
        routingKey,
        Buffer.from(JSON.stringify(message)),
        {
          persistent: true,
          contentType: 'application/json'
        }
      )

      if (published) {
        console.log(`📤 Published order event: ${eventType} for order ${orderData.order_id}`)
        return true
      } else {
        console.error('❌ Failed to publish message to RabbitMQ')
        return false
      }
    } catch (error) {
      console.error('❌ Error publishing order event:', error)
      return false
    }
  }

  async publishOrderCreated(orderData) {
    return await this.publishOrderEvent('created', orderData)
  }

  async publishOrderUpdated(orderData) {
    return await this.publishOrderEvent('updated', orderData)
  }

  async publishOrderCompleted(orderData) {
    return await this.publishOrderEvent('completed', orderData)
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
      console.log('🔌 RabbitMQ connection closed')
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
