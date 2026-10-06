function errorHandler(error, request, response, next) {
    if (response.headersSent) {
        return next(error);
    }

    if (
    error.code === "23505" &&
    error.constraint === "authors_email_key"
) {
    error.status = 400;
    error.message = "El email ya está registrado.";
}

    const status = error.status || 500;
    let message = error.message;

    if (error.type === "entity.parse.failed") {
        message = "El cuerpo debe ser JSON válido.";
    }

    if (status >= 500) {
        console.error(error.message);
        message = "Error interno del servidor.";
    }

    response.status(status).json({ error: message });
}

module.exports = errorHandler;