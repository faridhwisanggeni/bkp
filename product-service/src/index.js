require('dotenv').config();
const app = require('./app');
const { pool } = require('./db/pool');
const rabbitmqService = require('./services/rabbitmq.service');
const OrderConsumer = require('./consumers/order.consumer');

const PORT = process.env.PORT || 3002;

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

// Start server
async function startServer() {
  try {
    await testConnection();
    
    // Connect to RabbitMQ
    await rabbitmqService.connect();
    
    // Start order consumers
    const orderConsumer = new OrderConsumer();
    await orderConsumer.startConsuming();
    
    app.listen(PORT, () => {
      console.log(`🚀 Product Service running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🐰 RabbitMQ Management UI: http://localhost:15672`);
      console.log(`   Username: admin, Password: admin123`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await rabbitmqService.close();
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await rabbitmqService.close();
  await pool.end();
  process.exit(0);
});

startServer();
