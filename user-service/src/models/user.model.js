const { pool } = require('../db/pool');

const cols = 'id, name, email, role_id, is_active, created_at, created_by, updated_at, updated_by';

async function list() {
  const { rows } = await pool.query(`SELECT ${cols} FROM users ORDER BY id ASC`);
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
  const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = { list, getById, create, update, remove };
