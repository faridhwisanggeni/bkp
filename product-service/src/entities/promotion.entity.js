class Promotion {
  constructor({
    id,
    product_id,
    promotion_name,
    promotion_type,
    discount,
    qty_max,
    is_active,
    started_at,
    ended_at,
    deleted_at,
    created_at,
    created_by,
    updated_at,
    updated_by,
    product_name // from join with products table
  }) {
    this.id = id;
    this.product_id = product_id;
    this.promotion_name = promotion_name;
    this.promotion_type = promotion_type;
    this.discount = discount;
    this.qty_max = qty_max;
    this.is_active = is_active;
    this.started_at = started_at;
    this.ended_at = ended_at;
    this.deleted_at = deleted_at;
    this.created_at = created_at;
    this.created_by = created_by;
    this.updated_at = updated_at;
    this.updated_by = updated_by;
    this.product_name = product_name;
  }

  static fromDatabase(row) {
    return new Promotion({
      id: row.id,
      product_id: row.product_id,
      promotion_name: row.promotion_name,
      promotion_type: row.promotion_type,
      discount: row.discount,
      qty_max: row.qty_max,
      is_active: row.is_active,
      started_at: row.started_at,
      ended_at: row.ended_at,
      deleted_at: row.deleted_at,
      created_at: row.created_at,
      created_by: row.created_by,
      updated_at: row.updated_at,
      updated_by: row.updated_by,
      product_name: row.product_name
    });
  }

  toJSON() {
    return {
      id: this.id,
      product_id: this.product_id,
      promotion_name: this.promotion_name,
      promotion_type: this.promotion_type,
      discount: this.discount,
      qty_max: this.qty_max,
      is_active: this.is_active,
      started_at: this.started_at,
      ended_at: this.ended_at,
      deleted_at: this.deleted_at,
      created_at: this.created_at,
      created_by: this.created_by,
      updated_at: this.updated_at,
      updated_by: this.updated_by,
      product_name: this.product_name
    };
  }
}

module.exports = Promotion;
