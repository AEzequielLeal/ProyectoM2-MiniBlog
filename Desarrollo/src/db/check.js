const pool = require("./pool");

async function checkConnection() {
    try {
        const result = await pool.query(
            "SELECT current_database() AS database, COUNT(*)::int AS authors FROM authors"
        );

        console.log("Conexion correcta:", result.rows[0]);
    } catch (error) {
        console.error("No se pudo conectar:", error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

checkConnection();