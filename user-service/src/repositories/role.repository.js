const { pool } = require('../db/pool');

const cols = 'id, role_name, is_active, created_at, created_by, updated_at, updated_by';

async function list({ limit = 50, offset = 0 } = {}) {
  const { rows } = await pool.query(
    `SELECT ${cols}
     FROM roles
     ORDER BY id ASC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}

async function getById(id) {
  const { rows } = await pool.query(
    `SELECT ${cols} FROM roles WHERE id = $1`,
    [id]
  );
  return rows[0];
}

async function create({ role_name, is_active = true, created_by }) {
  const { rows } = await pool.query(
    `INSERT INTO roles (role_name, is_active, created_by)
     VALUES ($1, $2, $3)
     RETURNING ${cols}`,
    [role_name, is_active, created_by]
  );
  return rows[0];
}

async function update(id, { role_name, is_active, updated_by }) {
  const { rows } = await pool.query(
    `UPDATE roles SET
       role_name = COALESCE($2, role_name),
       is_active = COALESCE($3, is_active),
       updated_at = NOW(),
       updated_by = $4
     WHERE id = $1
     RETURNING ${cols}`,
    [id, role_name, is_active, updated_by]
  );
  return rows[0];
}

async function remove(id) {
  const { rowCount } = await pool.query(
    `UPDATE roles SET is_active = FALSE, updated_at = NOW(), updated_by = COALESCE(updated_by, 'system')
     WHERE id = $1 AND is_active = TRUE`,
    [id]
  );
  return rowCount > 0;
}

module.exports = { list, getById, create, update, remove };
