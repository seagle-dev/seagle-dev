const { Pool } = require('pg');

const config = {};

if (process.env.DATABASE_URL) {
  config.connectionString = process.env.DATABASE_URL;
} else {
  config.host = process.env.PGHOST || process.env.PG_HOST || 'localhost';
  config.user = process.env.PGUSER || process.env.PG_USER || 'postgres';
  config.password = process.env.PGPASSWORD || process.env.PG_PASSWORD;
  config.database = process.env.PGDATABASE || process.env.PG_DATABASE || 'postgres';
  config.port = process.env.PGPORT || process.env.PG_PORT || 5432;
}

if (config.connectionString || (config.host && config.host !== 'localhost' && config.host !== '127.0.0.1')) {
  config.ssl = {
    rejectUnauthorized: false
  };
}

const pool = new Pool(config);

module.exports = pool;