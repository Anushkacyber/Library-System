const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

pool.on('connect', () => {
  console.log('✅ Connected to NeonDB PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client:', err.message);
  if (err.code === '57P01') {
    console.error('💡 Database connection was terminated by server. This usually happens during maintenance or inactivity.');
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
};
