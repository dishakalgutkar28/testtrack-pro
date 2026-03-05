const mysql = require("mysql2");

/**
 * Database Configuration with Connection Pooling
 * Uses environment variables for secure credential management
 */

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "testtrack",
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_LIMIT || "10"),
  queueLimit: 0,
  connectTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || "10000"),
  // Enable multiple statements for migrations
  multipleStatements: true
};

// Create connection pool for better performance
const pool = mysql.createPool(dbConfig);

// Test initial connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error("   -> Is MySQL server running on " + dbConfig.host + ":" + dbConfig.port + "?");
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error("   -> Check DB_USER and DB_PASSWORD in .env file");
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      console.error("   -> Database '" + dbConfig.database + "' does not exist");
    }
    process.exit(1);
  } else {
    console.log("✅ Database connected successfully");
    console.log("   Host:", dbConfig.host);
    console.log("   Database:", dbConfig.database);
    console.log("   Pool limit:", dbConfig.connectionLimit);
    connection.release();
  }
});

// Handle pool errors
pool.on('error', (err) => {
  console.error("❌ Unexpected database error:", err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error("   -> Database connection lost. Reconnecting...");
  }
});

// Export the pool (maintains backward compatibility with existing code)
module.exports = pool;