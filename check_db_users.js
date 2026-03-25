const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkUsers() {
  try {
    const res = await pool.query('SELECT name, email, role FROM users');
    console.log('--- USERS IN DATABASE ---');
    console.table(res.rows);
    await pool.end();
  } catch (err) {
    console.error('Database analysis failed:', err.message);
    process.exit(1);
  }
}

checkUsers();
