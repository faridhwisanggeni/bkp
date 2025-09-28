const pool = require('../config/database')
const { v4: uuidv4 } = require('uuid')

class OrderModel {
  // Create new order with order details
  static async createOrder(orderData) {
    const client = await pool.connect()
    
    try {
      await client.query('BEGIN')
      
      const orderId = uuidv4()
      
      // Insert order header
      const orderHeaderQuery = `
        INSERT INTO order_header (id, order_id, username, order_date, order_status, total_harga)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `
      
      const orderHeaderValues = [
        uuidv4(),
        orderId,
        orderData.username,
        new Date(),
        'pending',
        orderData.total_harga
      ]
      
      const orderHeaderResult = await client.query(orderHeaderQuery, orderHeaderValues)
      const orderHeader = orderHeaderResult.rows[0]
      
      // Insert order details
      const orderDetails = []
      for (const item of orderData.items) {
        const orderDetailQuery = `
          INSERT INTO order_detail (id, id_order_header, id_product, qty, original_price, id_promo, deduct_price, total_price)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `
        
        const orderDetailValues = [
          uuidv4(),
          orderHeader.id,
          item.id_product,
          item.qty,
          item.original_price,
          item.id_promo || null,
          item.deduct_price || 0,
          item.total_price
        ]
        
        const orderDetailResult = await client.query(orderDetailQuery, orderDetailValues)
        orderDetails.push(orderDetailResult.rows[0])
      }
      
      await client.query('COMMIT')
      
      return {
        orderHeader,
        orderDetails
      }
      
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
  
  // Get order by order_id
  static async getOrderByOrderId(orderId) {
    const query = `
      SELECT 
        oh.*,
        json_agg(
          json_build_object(
            'id', od.id,
            'id_product', od.id_product,
            'qty', od.qty,
            'original_price', od.original_price,
            'id_promo', od.id_promo,
            'deduct_price', od.deduct_price,
            'total_price', od.total_price
          )
        ) as order_details
      FROM order_header oh
      LEFT JOIN order_detail od ON oh.id = od.id_order_header
      WHERE oh.order_id = $1
      GROUP BY oh.id, oh.order_id, oh.username, oh.order_date, oh.order_status, oh.total_harga
    `
    
    const result = await pool.query(query, [orderId])
    return result.rows[0] || null
  }
  
  // Get orders by username
  static async getOrdersByUsername(username) {
    const query = `
      SELECT 
        oh.*,
        json_agg(
          json_build_object(
            'id', od.id,
            'id_product', od.id_product,
            'qty', od.qty,
            'original_price', od.original_price,
            'id_promo', od.id_promo,
            'deduct_price', od.deduct_price,
            'total_price', od.total_price
          )
        ) as order_details
      FROM order_header oh
      LEFT JOIN order_detail od ON oh.id = od.id_order_header
      WHERE oh.username = $1
      GROUP BY oh.id, oh.order_id, oh.username, oh.order_date, oh.order_status, oh.total_harga
      ORDER BY oh.order_date DESC
    `
    
    const result = await pool.query(query, [username])
    return result.rows
  }
  
  // Get all orders with pagination and filters
  static async getAllOrders(options = {}) {
    const { page = 1, limit = 10, status, username } = options
    const offset = (page - 1) * limit
    
    let whereClause = ''
    const queryParams = []
    let paramIndex = 1
    
    if (status) {
      whereClause += `WHERE oh.order_status = $${paramIndex}`
      queryParams.push(status)
      paramIndex++
    }
    
    if (username) {
      whereClause += whereClause ? ` AND oh.username ILIKE $${paramIndex}` : `WHERE oh.username ILIKE $${paramIndex}`
      queryParams.push(`%${username}%`)
      paramIndex++
    }
    
    const query = `
      SELECT 
        oh.*,
        json_agg(
          json_build_object(
            'id', od.id,
            'id_product', od.id_product,
            'qty', od.qty,
            'original_price', od.original_price,
            'id_promo', od.id_promo,
            'deduct_price', od.deduct_price,
            'total_price', od.total_price
          )
        ) as order_details
      FROM order_header oh
      LEFT JOIN order_detail od ON oh.id = od.id_order_header
      ${whereClause}
      GROUP BY oh.id, oh.order_id, oh.username, oh.order_date, oh.order_status, oh.total_harga
      ORDER BY oh.order_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    
    queryParams.push(limit, offset)
    
    const result = await pool.query(query, queryParams)
    return result.rows
  }

  // Update order status
  static async updateOrderStatus(orderId, status) {
    const query = `
      UPDATE order_header 
      SET order_status = $1 
      WHERE order_id = $2 
      RETURNING *
    `
    
    const result = await pool.query(query, [status, orderId])
    return result.rows[0] || null
  }
}

module.exports = OrderModel
