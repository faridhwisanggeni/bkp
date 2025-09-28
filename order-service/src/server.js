const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
require('dotenv').config()

const orderRoutes = require('./routes/order.routes')
const errorHandler = require('./middleware/errorHandler')
const rabbitmqService = require('./services/rabbitmq.service')
const OrderConsumer = require('./consumers/order.consumer')
const StockConsumer = require('./consumers/stock.consumer')

const app = express()
const PORT = process.env.PORT || 3003

// Middleware
app.use(helmet())
app.use(morgan('combined'))
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', (req, res) => {
  const rabbitmqStatus = rabbitmqService.getStatus()
  
  res.json({
    success: true,
    message: 'Order Service is running',
    timestamp: new Date().toISOString(),
    service: 'order-service',
    version: '1.0.0',
    rabbitmq: {
      ...rabbitmqStatus,
      status: rabbitmqStatus.connected ? 'healthy' : 'disconnected'
    }
  })
})

// API routes
app.use('/api', orderRoutes)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  })
})

// Error handler
app.use(errorHandler)

// Initialize RabbitMQ and start server
async function startServer() {
  try {
    // Connect to RabbitMQ
    await rabbitmqService.connect()
    
    // Start order consumers
    const orderConsumer = new OrderConsumer()
    await orderConsumer.startConsuming()
    
    // Start stock validation consumers
    const stockConsumer = new StockConsumer()
    await stockConsumer.startConsuming()
    
    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 Order Service running on port ${PORT}`)
      console.log(`📊 Health check: http://localhost:${PORT}/health`)
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`🐰 RabbitMQ Management UI: http://localhost:15672`)
      console.log(`   Username: admin, Password: admin123`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...')
  await rabbitmqService.close()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...')
  await rabbitmqService.close()
  process.exit(0)
})

startServer()
