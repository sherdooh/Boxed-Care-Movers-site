const { Pool } = require('pg');
require('dotenv').config();

// ============================================
// Use the full connection string from Supabase
// ============================================
const connectionString = process.env.DATABASE_URL;

// ============================================
// Create connection pool
// ============================================
const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false  // Required for Supabase
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// ============================================
// Test connection function
// ============================================
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

// ============================================
// Export the pool and test function
// ============================================
module.exports = { pool, testConnection };