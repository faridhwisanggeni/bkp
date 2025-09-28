const { pool } = require('../db/pool');

const cols = 'id, name, email, role_id, is_active, created_at, created_by, updated_at, updated_by';

async function list({ limit = 50, offset = 0 } = {}) {
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.email, u.role_id, u.is_active, u.created_at, u.created_by, u.updated_at, u.updated_by, r.role_name
     FROM users u
     JOIN roles r ON r.id = u.role_id
     ORDER BY u.id ASC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}

async function getById(id) {
  const { rows } = await pool.query(`SELECT ${cols} FROM users WHERE id = $1`, [id]);
  return rows[0];
}

async function create({ name, email, role_id, is_active = true, created_by, password }) {
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, role_id, is_active, created_by, password)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${cols}`,
    [name, email, role_id, is_active, created_by, password]
  );
  return rows[0];
}

async function update(id, { name, email, role_id, is_active, updated_by, password }) {
  const { rows } = await pool.query(
    `UPDATE users SET
       name = COALESCE($2, name),
       email = COALESCE($3, email),
       role_id = COALESCE($4, role_id),
       is_active = COALESCE($5, is_active),
       password = COALESCE($6, password),
       updated_at = NOW(),
       updated_by = $7
     WHERE id = $1
     RETURNING ${cols}`,
    [id, name, email, role_id, is_active, password, updated_by]
  );
  return rows[0];
}

async function remove(id) {
  const { rowCount } = await pool.query(
    `UPDATE users SET is_active = FALSE, updated_at = NOW(), updated_by = COALESCE(updated_by, 'system')
     WHERE id = $1 AND is_active = TRUE`,
    [id]
  );
  return rowCount > 0;
}

// Auth helpers
async function getByEmailWithPassword(email) {
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.password, u.is_active, r.role_name
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.email = $1`,
    [email]
  );
  return rows[0];
}

async function getByIdWithRole(id) {
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.is_active, r.role_name
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1`,
    [id]
  );
  return rows[0];
}

module.exports = { list, getById, create, update, remove, getByEmailWithPassword, getByIdWithRole };
