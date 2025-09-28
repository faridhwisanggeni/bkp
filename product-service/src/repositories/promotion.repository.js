const { pool } = require('../db/pool');
const Promotion = require('../entities/promotion.entity');

class PromotionRepository {
  async create(promotionData) {
    const { product_id, promotion_name, promotion_type, discount, qty_max, is_active, started_at, ended_at, created_by } = promotionData;
    const query = `
      INSERT INTO promotions (product_id, promotion_name, promotion_type, discount, qty_max, is_active, started_at, ended_at, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [product_id, promotion_name, promotion_type, discount, qty_max, is_active, started_at, ended_at, created_by];
    const result = await pool.query(query, values);
    return Promotion.fromDatabase(result.rows[0]);
  }

  async findById(id) {
    const query = `
      SELECT p.*, pr.product_name 
      FROM promotions p
      LEFT JOIN products pr ON p.product_id = pr.id
      WHERE p.id = $1 AND p.deleted_at IS NULL AND pr.deleted_at IS NULL
    `;
    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? Promotion.fromDatabase(result.rows[0]) : null;
  }

  async findAll(filters = {}) {
    const { page = 1, limit = 10, search, product_id, is_active, status, sort_by = 'id', sort_order = 'asc' } = filters;
    const offset = (page - 1) * limit;
    
    let whereConditions = ['p.deleted_at IS NULL', 'pr.deleted_at IS NULL'];
    let values = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(p.promotion_name ILIKE $${paramIndex} OR pr.product_name ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (product_id) {
      whereConditions.push(`p.product_id = $${paramIndex}`);
      values.push(product_id);
      paramIndex++;
    }

    if (is_active !== undefined) {
      whereConditions.push(`p.is_active = $${paramIndex}`);
      values.push(is_active);
      paramIndex++;
    }

    if (status) {
      const now = new Date().toISOString();
      switch (status) {
        case 'active':
          whereConditions.push(`p.started_at <= $${paramIndex} AND p.ended_at >= $${paramIndex} AND p.is_active = true`);
          values.push(now);
          paramIndex++;
          break;
        case 'scheduled':
          whereConditions.push(`p.started_at > $${paramIndex} AND p.is_active = true`);
          values.push(now);
          paramIndex++;
          break;
        case 'expired':
          whereConditions.push(`p.ended_at < $${paramIndex}`);
          values.push(now);
          paramIndex++;
          break;
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const orderClause = `ORDER BY p.${sort_by} ${sort_order.toUpperCase()}`;
    
    const query = `
      SELECT p.*, pr.product_name 
      FROM promotions p
      LEFT JOIN products pr ON p.product_id = pr.id
      ${whereClause}
      ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    values.push(limit, offset);
    const result = await pool.query(query, values);
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM promotions p
      LEFT JOIN products pr ON p.product_id = pr.id
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, values.slice(0, -2));
    const total = parseInt(countResult.rows[0].count);
    
    return {
      data: result.rows.map(row => Promotion.fromDatabase(row)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async update(id, promotionData) {
    const { product_id, promotion_name, promotion_type, discount, qty_max, is_active, started_at, ended_at, updated_by } = promotionData;
    
    let setClause = [];
    let values = [];
    let paramIndex = 1;

    if (product_id !== undefined) {
      setClause.push(`product_id = $${paramIndex}`);
      values.push(product_id);
      paramIndex++;
    }

    if (promotion_name !== undefined) {
      setClause.push(`promotion_name = $${paramIndex}`);
      values.push(promotion_name);
      paramIndex++;
    }

    if (promotion_type !== undefined) {
      setClause.push(`promotion_type = $${paramIndex}`);
      values.push(promotion_type);
      paramIndex++;
    }

    if (discount !== undefined) {
      setClause.push(`discount = $${paramIndex}`);
      values.push(discount);
      paramIndex++;
    }

    if (qty_max !== undefined) {
      setClause.push(`qty_max = $${paramIndex}`);
      values.push(qty_max);
      paramIndex++;
    }

    if (is_active !== undefined) {
      setClause.push(`is_active = $${paramIndex}`);
      values.push(is_active);
      paramIndex++;
    }

    if (started_at !== undefined) {
      setClause.push(`started_at = $${paramIndex}`);
      values.push(started_at);
      paramIndex++;
    }

    if (ended_at !== undefined) {
      setClause.push(`ended_at = $${paramIndex}`);
      values.push(ended_at);
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
      UPDATE promotions 
      SET ${setClause.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows.length > 0 ? Promotion.fromDatabase(result.rows[0]) : null;
  }

  async delete(id) {
    const query = `
      UPDATE promotions 
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? Promotion.fromDatabase(result.rows[0]) : null;
  }

  async findByProductId(productId) {
    const query = `
      SELECT p.*, pr.product_name 
      FROM promotions p
      LEFT JOIN products pr ON p.product_id = pr.id
      WHERE p.product_id = $1 AND p.deleted_at IS NULL AND pr.deleted_at IS NULL
      ORDER BY p.created_at DESC
    `;
    const result = await pool.query(query, [productId]);
    return result.rows.map(row => Promotion.fromDatabase(row));
  }
}

module.exports = PromotionRepository;
