require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || undefined
});

pool.on("error", (error) => {
    console.error("Error de PostgreSQL:", error.message);
});

module.exports = pool;