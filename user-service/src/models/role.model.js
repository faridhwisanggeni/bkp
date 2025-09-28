const { pool } = require('../db/pool');

async function list() {
  const { rows } = await pool.query('SELECT id, role_name, is_active, created_at, created_by, updated_at, updated_by FROM roles ORDER BY id ASC');
  return rows;
}

async function getById(id) {
  const { rows } = await pool.query('SELECT id, role_name, is_active, created_at, created_by, updated_at, updated_by FROM roles WHERE id = $1', [id]);
  return rows[0];
}

async function create({ role_name, is_active = true, created_by }) {
  const { rows } = await pool.query(
    `INSERT INTO roles (role_name, is_active, created_by)
     VALUES ($1, $2, $3)
     ON CONFLICT (role_name) DO UPDATE SET role_name = EXCLUDED.role_name
     RETURNING id, role_name, is_active, created_at, created_by, updated_at, updated_by`,
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
     RETURNING id, role_name, is_active, created_at, created_by, updated_at, updated_by`,
    [id, role_name, is_active, updated_by]
  );
  return rows[0];
}

async function remove(id) {
  const { rowCount } = await pool.query('DELETE FROM roles WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = { list, getById, create, update, remove };
