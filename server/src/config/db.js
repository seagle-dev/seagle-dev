const mysql = require("mysql2");

const pool = mysql.createPool({
  host: process.env.MYSQLHOST || process.env.MYSQL_HOST,
  user: process.env.MYSQLUSER || process.env.MYSQL_USER,
  password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD,
  database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE,
  port: process.env.MYSQLPORT || process.env.MYSQL_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool.promise();