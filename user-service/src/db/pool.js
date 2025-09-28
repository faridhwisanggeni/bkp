const { Pool } = require('pg');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'db-user',
  user: process.env.DB_USER || 'user_service_db',
  password: process.env.DB_PASSWORD || 'user@!4',
  max: Number(process.env.DB_POOL_MAX || 10),
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000),
  connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 5000),
  allowExitOnIdle: false,
};

const pool = new Pool(config);

pool.on('error', (err) => {
  // Log and continue; next query will get a new client
  console.error('Unexpected PG client error', err);
});

async function healthCheck() {
  try {
    const res = await pool.query('SELECT 1 AS ok');
    return res.rows[0]?.ok === 1;
  } catch (e) {
    return false;
  }
}

module.exports = { pool, healthCheck };
