const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("connect", () => {
  console.log("PostgreSQL Connected");
});

pool.on("error", (error) => {
  console.error("PostgreSQL pool error:", error.message);
});

const connectDB = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("PostgreSQL Database Connected");
  } catch (error) {
    console.error("PostgreSQL connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = { pool, connectDB };