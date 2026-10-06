function createError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

function parseId(value) {
    const id = Number(value);

    if (
        !/^\d+$/.test(String(value)) ||
        !Number.isInteger(id) ||
        id <= 0 ||
        id > 2147483647
    ) {
        throw createError(400, "El id debe ser un entero positivo válido.");
    }

    return id;
}

module.exports = { createError, parseId };