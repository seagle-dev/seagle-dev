const { Pool } = require('pg');

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Missing SUPABASE_DB_URL. Set it to your Supabase Postgres connection string.');
}

if (!/^postgres(?:ql)?:\/\//i.test(connectionString)) {
  throw new Error('SUPABASE_DB_URL must be a PostgreSQL connection string.');
}

const pool = new Pool({
  connectionString,
  // Supabase requires TLS for hosted database connections.
  ssl: { rejectUnauthorized: false },
  max: Number.parseInt(process.env.DB_POOL_MAX || '10', 10),
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 30_000,
});

pool.on('error', (error) => {
  console.error('Unexpected Supabase Postgres pool error:', error.message);
});

console.log('Supabase Postgres pool initialized.');

module.exports = {
  query: (sql, params) => pool.query(sql, params),
  pool,
};
