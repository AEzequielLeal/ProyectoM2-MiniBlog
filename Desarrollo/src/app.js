const express = require("express");
const pool = require("./db/pool");
const errorHandler = require("./middlewares/errorHandler");
const authorsRouter = require("./routes/authorsRoutes");
const postsRouter = require("./routes/postsRoutes");

const app = express();

app.use(express.json());

app.use("/authors", authorsRouter);

app.use("/posts", postsRouter);

app.get("/health", async (request, response, next) => {
    try {
        await pool.query("SELECT 1");

        response.status(200).json({
            status: "ok",
            database: "connected"
        });
    } catch (error) {
        next(error);
    }
});

app.use((request, response) => {
    response.status(404).json({
        error: "Ruta no encontrada."
    });
});

app.use(errorHandler);

module.exports = app;