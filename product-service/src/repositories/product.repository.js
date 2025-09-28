const { pool } = require('../db/pool');
const Product = require('../entities/product.entity');

class ProductRepository {
  async create(productData) {
    const { product_name, price, qty, is_active, created_by } = productData;
    const query = `
      INSERT INTO products (product_name, price, qty, is_active, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [product_name, price, qty, is_active, created_by];
    const result = await pool.query(query, values);
    return Product.fromDatabase(result.rows[0]);
  }

  async findById(id) {
    const query = 'SELECT * FROM products WHERE id = $1 AND deleted_at IS NULL';
    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? Product.fromDatabase(result.rows[0]) : null;
  }

  async findAll(filters = {}) {
    const { page = 1, limit = 10, search, is_active, sort_by = 'id', sort_order = 'asc' } = filters;
    const offset = (page - 1) * limit;
    
    let whereConditions = ['deleted_at IS NULL'];
    let values = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`product_name ILIKE $${paramIndex}`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (is_active !== undefined) {
      whereConditions.push(`is_active = $${paramIndex}`);
      values.push(is_active);
      paramIndex++;
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
    const orderClause = `ORDER BY ${sort_by} ${sort_order.toUpperCase()}`;
    
    const query = `
      SELECT * FROM products 
      ${whereClause}
      ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    values.push(limit, offset);
    const result = await pool.query(query, values);
    
    // Get total count
    const countQuery = `SELECT COUNT(*) FROM products ${whereClause}`;
    const countResult = await pool.query(countQuery, values.slice(0, -2));
    const total = parseInt(countResult.rows[0].count);
    
    return {
      data: result.rows.map(row => Product.fromDatabase(row)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async update(id, productData) {
    const { product_name, price, qty, is_active, updated_by } = productData;
    
    let setClause = [];
    let values = [];
    let paramIndex = 1;

    if (product_name !== undefined) {
      setClause.push(`product_name = $${paramIndex}`);
      values.push(product_name);
      paramIndex++;
    }

    if (price !== undefined) {
      setClause.push(`price = $${paramIndex}`);
      values.push(price);
      paramIndex++;
    }

    if (qty !== undefined) {
      setClause.push(`qty = $${paramIndex}`);
      values.push(qty);
      paramIndex++;
    }

    if (is_active !== undefined) {
      setClause.push(`is_active = $${paramIndex}`);
      values.push(is_active);
      paramIndex++;
    }

    if (updated_by !== undefined) {
      setClause.push(`updated_by = $${paramIndex}`);
      values.push(updated_by);
      paramIndex++;
    }

    setClause.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE products 
      SET ${setClause.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows.length > 0 ? Product.fromDatabase(result.rows[0]) : null;
  }

  async delete(id) {
    const query = `
      UPDATE products 
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? Product.fromDatabase(result.rows[0]) : null;
  }

  async exists(id) {
    const query = 'SELECT 1 FROM products WHERE id = $1 AND deleted_at IS NULL';
    const result = await pool.query(query, [id]);
    return result.rows.length > 0;
  }
}

module.exports = ProductRepository;
