const { Pool } = require('pg');
require('dotenv').config();

// Use the full connection string from Supabase
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false  // Required for Supabase
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL (Supabase) connected successfully!');
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    return false;
  }
}

module.exports = { pool, testConnection };