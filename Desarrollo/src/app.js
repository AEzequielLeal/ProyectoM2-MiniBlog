const express = require("express");
const pool = require("./db/pool");
const errorHandler = require("./middlewares/errorHandler");
const authorsRouter = require("./routes/authorsRoutes");
const postsRouter = require("./routes/postsRoutes");
const swaggerUi = require("swagger-ui-express");
const openapi = require("../openapi.json");

const app = express();

app.use(express.json());

app.get("/openapi.json", (request, response) => {
    response.json(openapi);
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));

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