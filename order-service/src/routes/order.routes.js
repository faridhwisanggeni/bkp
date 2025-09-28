const express = require('express')
const OrderController = require('../controllers/order.controller')

const router = express.Router()

// Create new order
router.post('/orders', OrderController.createOrder)

// Get order by order_id
router.get('/orders/:orderId', OrderController.getOrderByOrderId)

// Get orders by username
router.get('/orders/user/:username', OrderController.getOrdersByUsername)

// Update order status
router.put('/orders/:orderId/status', OrderController.updateOrderStatus)

// Complete payment for order
router.post('/orders/:orderId/complete-payment', OrderController.completePayment)

module.exports = router
