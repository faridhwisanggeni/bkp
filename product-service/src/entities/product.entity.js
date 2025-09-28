class Product {
  constructor({
    id,
    product_name,
    price,
    qty,
    is_active,
    deleted_at,
    created_at,
    created_by,
    updated_at,
    updated_by
  }) {
    this.id = id;
    this.product_name = product_name;
    this.price = price;
    this.qty = qty;
    this.is_active = is_active;
    this.deleted_at = deleted_at;
    this.created_at = created_at;
    this.created_by = created_by;
    this.updated_at = updated_at;
    this.updated_by = updated_by;
  }

  static fromDatabase(row) {
    return new Product({
      id: row.id,
      product_name: row.product_name,
      price: row.price,
      qty: row.qty,
      is_active: row.is_active,
      deleted_at: row.deleted_at,
      created_at: row.created_at,
      created_by: row.created_by,
      updated_at: row.updated_at,
      updated_by: row.updated_by
    });
  }

  toJSON() {
    return {
      id: this.id,
      product_name: this.product_name,
      price: this.price,
      qty: this.qty,
      is_active: this.is_active,
      deleted_at: this.deleted_at,
      created_at: this.created_at,
      created_by: this.created_by,
      updated_at: this.updated_at,
      updated_by: this.updated_by
    };
  }
}

module.exports = Product;
