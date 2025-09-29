#!/usr/bin/env node

/**
 * Test Script: Redis Stock Reduction
 * 
 * This script tests the complete order flow to verify that:
 * 1. Order is created successfully
 * 2. Stock validation passes
 * 3. Order completion triggers stock reduction
 * 4. Redis cache is updated with new stock levels
 */

const axios = require('axios');
const redis = require('redis');

const ORDER_SERVICE_URL = 'http://localhost:3003';
const PRODUCT_SERVICE_URL = 'http://localhost:3002';
const REDIS_URL = 'redis://localhost:6379';

class RedisStockTester {
  constructor() {
    this.redisClient = null;
  }

  async connect() {
    try {
      this.redisClient = redis.createClient({ url: REDIS_URL });
      await this.redisClient.connect();
      console.log('✅ Connected to Redis');
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.redisClient) {
      await this.redisClient.quit();
      console.log('👋 Disconnected from Redis');
    }
  }

  async getProductStock(productId) {
    try {
      // Get from database via API
      const response = await axios.get(`${PRODUCT_SERVICE_URL}/products/${productId}`);
      const dbStock = response.data.data?.qty || 0;

      // Get from Redis cache
      const cacheKey = `product:${productId}:stock`;
      const cachedStock = await this.redisClient.get(cacheKey);
      const redisStock = cachedStock ? JSON.parse(cachedStock) : null;

      return {
        database: dbStock,
        redis: redisStock,
        synced: dbStock === redisStock
      };
    } catch (error) {
      console.error(`❌ Error getting stock for product ${productId}:`, error.message);
      return { database: null, redis: null, synced: false };
    }
  }

  async createTestOrder() {
    try {
      const orderData = {
        username: 'test-user-redis',
        items: [
          {
            id_product: 1,
            qty: 2,
            harga: 50000
          }
        ]
      };

      const response = await axios.post(`${ORDER_SERVICE_URL}/orders`, orderData);
      console.log('✅ Test order created:', response.data.data.order_id);
      return response.data.data;
    } catch (error) {
      console.error('❌ Failed to create test order:', error.response?.data || error.message);
      throw error;
    }
  }

  async completeOrder(orderId) {
    try {
      const response = await axios.put(`${ORDER_SERVICE_URL}/orders/${orderId}/complete-payment`, {
        payment_method: 'credit_card',
        card_number: '4111111111111111',
        card_holder: 'Test User',
        expiry_date: '12/25',
        cvv: '123'
      });

      console.log('✅ Order completed:', orderId);
      return response.data.data;
    } catch (error) {
      console.error('❌ Failed to complete order:', error.response?.data || error.message);
      throw error;
    }
  }

  async waitForStockReduction(productId, initialStock, maxWaitTime = 10000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const stock = await this.getProductStock(productId);
      
      if (stock.database < initialStock && stock.redis !== null && stock.synced) {
        return stock;
      }
      
      console.log(`⏳ Waiting for stock reduction... DB: ${stock.database}, Redis: ${stock.redis}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Timeout waiting for stock reduction');
  }

  async runTest() {
    console.log('🧪 Starting Redis Stock Reduction Test...\n');

    try {
      await this.connect();

      // Step 1: Get initial stock
      console.log('📊 Step 1: Getting initial stock...');
      const productId = 1;
      const initialStock = await this.getProductStock(productId);
      console.log(`Initial stock - DB: ${initialStock.database}, Redis: ${initialStock.redis}, Synced: ${initialStock.synced}\n`);

      // Step 2: Create order
      console.log('📝 Step 2: Creating test order...');
      const order = await this.createTestOrder();
      console.log(`Order created: ${order.order_id}\n`);

      // Step 3: Complete order
      console.log('💳 Step 3: Completing order payment...');
      await this.completeOrder(order.order_id);
      console.log('Payment completed\n');

      // Step 4: Wait for stock reduction
      console.log('⏳ Step 4: Waiting for stock reduction...');
      const finalStock = await this.waitForStockReduction(productId, initialStock.database);
      
      // Step 5: Verify results
      console.log('✅ Step 5: Verification Results:');
      console.log(`Initial Stock: ${initialStock.database}`);
      console.log(`Final Stock (DB): ${finalStock.database}`);
      console.log(`Final Stock (Redis): ${finalStock.redis}`);
      console.log(`Stock Reduced: ${initialStock.database - finalStock.database}`);
      console.log(`Redis Synced: ${finalStock.synced ? '✅' : '❌'}`);

      if (finalStock.synced && finalStock.database < initialStock.database) {
        console.log('\n🎉 TEST PASSED: Redis stock reduction working correctly!');
      } else {
        console.log('\n❌ TEST FAILED: Redis stock reduction not working properly');
      }

    } catch (error) {
      console.error('\n❌ TEST FAILED:', error.message);
    } finally {
      await this.disconnect();
    }
  }
}

// Run the test
if (require.main === module) {
  const tester = new RedisStockTester();
  tester.runTest().catch(console.error);
}

module.exports = RedisStockTester;
