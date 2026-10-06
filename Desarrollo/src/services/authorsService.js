const pool = require("../db/pool");
const { createError, parseId } = require("./helpers");

async function getAuthors() {
    const result = await pool.query(
        "SELECT id, name, email, bio, created_at FROM authors ORDER BY id"
    );

    return result.rows;
}

async function getAuthorById(id) {
    const authorId = parseId(id);

    const result = await pool.query(
        "SELECT id, name, email, bio, created_at FROM authors WHERE id = $1",
        [authorId]
    );

    if (result.rows.length === 0) {
        throw createError(404, "Autor no encontrado.");
    }

    return result.rows[0];
}

function validateAuthor(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw createError(400, "Debés enviar un objeto JSON.");
    }

    const name = typeof data.name === "string"
        ? data.name.trim()
        : "";

    const email = typeof data.email === "string"
        ? data.email.trim().toLowerCase()
        : "";

    if (!name || name.length > 100) {
        throw createError(400, "name es obligatorio y admite hasta 100 caracteres.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) {
        throw createError(400, "Debés ingresar un email válido.");
    }

    if (
        data.bio !== undefined &&
        data.bio !== null &&
        typeof data.bio !== "string"
    ) {
        throw createError(400, "bio debe ser texto o null.");
    }

    return {
        name,
        email,
        bio: typeof data.bio === "string" ? data.bio.trim() : null
    };
}

async function createAuthor(data) {
    const author = validateAuthor(data);

    const result = await pool.query(
        "INSERT INTO authors (name, email, bio) VALUES ($1, $2, $3) RETURNING id, name, email, bio, created_at",
        [author.name, author.email, author.bio]
    );

    return result.rows[0];
}

async function updateAuthor(id, data) {
    const authorId = parseId(id);
    const author = validateAuthor(data);

    const result = await pool.query(
        "UPDATE authors SET name = $1, email = $2, bio = $3 WHERE id = $4 RETURNING id, name, email, bio, created_at",
        [author.name, author.email, author.bio, authorId]
    );

    if (result.rows.length === 0) {
        throw createError(404, "Autor no encontrado.");
    }

    return result.rows[0];
}

async function deleteAuthor(id) {
    const authorId = parseId(id);

    const result = await pool.query(
        "DELETE FROM authors WHERE id = $1 RETURNING id",
        [authorId]
    );

    if (result.rows.length === 0) {
        throw createError(404, "Autor no encontrado.");
    }
}

module.exports = {
    getAuthors,
    getAuthorById,
    createAuthor,
    updateAuthor,
    deleteAuthor
};