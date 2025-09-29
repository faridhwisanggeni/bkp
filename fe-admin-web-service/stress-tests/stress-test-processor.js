// Artillery processor for custom functions and data generation

module.exports = {
  // Generate random test data
  generateTestUser,
  generateTestProduct,
  generateTestOrder,
  
  // Custom hooks
  beforeScenario,
  afterScenario,
  
  // Metrics collection
  collectCustomMetrics
}

function generateTestUser(context, events, done) {
  const usernames = [
    'testuser', 'demouser', 'sampleuser', 'loaduser', 'stressuser'
  ]
  const domains = ['example.com', 'test.com', 'demo.com', 'load.com']
  
  const randomId = Math.floor(Math.random() * 10000)
  const randomUsername = usernames[Math.floor(Math.random() * usernames.length)]
  const randomDomain = domains[Math.floor(Math.random() * domains.length)]
  
  context.vars.testUser = {
    username: `${randomUsername}${randomId}`,
    email: `${randomUsername}${randomId}@${randomDomain}`,
    password: 'TestPassword123!',
    role: Math.random() > 0.8 ? 'admin' : 'user' // 20% admin, 80% user
  }
  
  return done()
}

function generateTestProduct(context, events, done) {
  const productNames = [
    'Laptop', 'Phone', 'Tablet', 'Monitor', 'Keyboard', 'Mouse', 
    'Headphones', 'Speaker', 'Camera', 'Printer'
  ]
  const adjectives = [
    'Premium', 'Professional', 'Gaming', 'Wireless', 'Portable',
    'High-Performance', 'Ultra-Slim', 'Heavy-Duty', 'Compact'
  ]
  
  const randomProduct = productNames[Math.floor(Math.random() * productNames.length)]
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const randomId = Math.floor(Math.random() * 1000)
  
  context.vars.testProduct = {
    name: `${randomAdjective} ${randomProduct} ${randomId}`,
    price: Math.floor(Math.random() * 2000) + 50, // $50 - $2050
    stock: Math.floor(Math.random() * 100) + 1,   // 1 - 100
    description: `High-quality ${randomProduct.toLowerCase()} for professional use`,
    category: getProductCategory(randomProduct)
  }
  
  return done()
}

function generateTestOrder(context, events, done) {
  const productCount = Math.floor(Math.random() * 5) + 1 // 1-5 products
  const products = []
  let total = 0
  
  for (let i = 0; i < productCount; i++) {
    const productId = Math.floor(Math.random() * 100) + 1
    const quantity = Math.floor(Math.random() * 3) + 1
    const price = Math.floor(Math.random() * 500) + 20
    
    products.push({
      id: productId,
      quantity: quantity,
      price: price
    })
    
    total += price * quantity
  }
  
  context.vars.testOrder = {
    userId: Math.floor(Math.random() * 50) + 1,
    products: products,
    total: total,
    status: 'pending'
  }
  
  return done()
}

function getProductCategory(productName) {
  const categories = {
    'Laptop': 'computers',
    'Phone': 'mobile',
    'Tablet': 'mobile',
    'Monitor': 'accessories',
    'Keyboard': 'accessories',
    'Mouse': 'accessories',
    'Headphones': 'audio',
    'Speaker': 'audio',
    'Camera': 'photography',
    'Printer': 'office'
  }
  
  return categories[productName] || 'general'
}

function beforeScenario(context, events, done) {
  // Log scenario start
  console.log(`Starting scenario: ${context.scenario?.name || 'Unknown'}`)
  
  // Set custom headers
  context.vars.userAgent = 'Artillery-Load-Test/1.0'
  context.vars.testRunId = process.env.TEST_RUN_ID || `test-${Date.now()}`
  
  // Initialize custom metrics
  context.vars.startTime = Date.now()
  
  return done()
}

function afterScenario(context, events, done) {
  // Calculate scenario duration
  const duration = Date.now() - context.vars.startTime
  
  // Emit custom metric
  events.emit('customStat', 'scenario.duration', duration)
  
  // Log scenario completion
  console.log(`Completed scenario in ${duration}ms`)
  
  return done()
}

function collectCustomMetrics(context, events, done) {
  // Collect memory usage
  const memUsage = process.memoryUsage()
  events.emit('customStat', 'memory.heapUsed', memUsage.heapUsed)
  events.emit('customStat', 'memory.heapTotal', memUsage.heapTotal)
  
  // Collect CPU usage (simplified)
  const cpuUsage = process.cpuUsage()
  events.emit('customStat', 'cpu.user', cpuUsage.user)
  events.emit('customStat', 'cpu.system', cpuUsage.system)
  
  return done()
}

// Error handling and logging
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})
