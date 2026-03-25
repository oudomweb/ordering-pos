const mysql = require("mysql2/promise");
const config = require("./config");

// Create a connection pool
const pool = mysql.createPool({
  host: config.db.HOST,
  user: config.db.USER,
  password: config.db.PASSWORD,
  database: config.db.DATABASE,
  port: config.db.PORT,
  namedPlaceholders: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
