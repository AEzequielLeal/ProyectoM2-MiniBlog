const pool = require("../db/pool");
const authorsService = require("./authorsService");
const { createError, parseId } = require("./helpers");

async function getPosts() {
    const result = await pool.query(
        "SELECT id, author_id, title, content, published, created_at FROM posts ORDER BY id"
    );

    return result.rows;
}

async function getPostById(id) {
    const postId = parseId(id);

    const result = await pool.query(
        "SELECT id, author_id, title, content, published, created_at FROM posts WHERE id = $1",
        [postId]
    );

    if (result.rows.length === 0) {
        throw createError(404, "Publicación no encontrada.");
    }

    return result.rows[0];
}

async function getPostsByAuthor(authorId) {
    const author = await authorsService.getAuthorById(authorId);

    const result = await pool.query(
        "SELECT id, author_id, title, content, published, created_at FROM posts WHERE author_id = $1 ORDER BY id",
        [author.id]
    );

    return result.rows.map((post) => ({
        ...post,
        author
    }));
}

function validatePost(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw createError(400, "Debés enviar un objeto JSON.");
    }

    const title = typeof data.title === "string"
        ? data.title.trim()
        : "";

    const content = typeof data.content === "string"
        ? data.content.trim()
        : "";

    if (!title || title.length > 200) {
        throw createError(400, "title es obligatorio y admite hasta 200 caracteres.");
    }

    if (!content) {
        throw createError(400, "content es obligatorio.");
    }

    if (
        !Number.isInteger(data.author_id) ||
        data.author_id <= 0 ||
        data.author_id > 2147483647
    ) {
        throw createError(400, "author_id debe ser un entero positivo válido.");
    }

    if (
        data.published !== undefined &&
        typeof data.published !== "boolean"
    ) {
        throw createError(400, "published debe ser true o false.");
    }

    return {
        title,
        content,
        author_id: data.author_id,
        published: data.published ?? false
    };
}

async function createPost(data) {
    const post = validatePost(data);

    const result = await pool.query(
        "INSERT INTO posts (title, content, author_id, published) VALUES ($1, $2, $3, $4) RETURNING id, author_id, title, content, published, created_at",
        [post.title, post.content, post.author_id, post.published]
    );

    return result.rows[0];
}

async function updatePost(id, data) {
    const postId = parseId(id);
    const post = validatePost(data);

    const result = await pool.query(
        "UPDATE posts SET title = $1, content = $2, author_id = $3, published = $4 WHERE id = $5 RETURNING id, author_id, title, content, published, created_at",
        [post.title, post.content, post.author_id, post.published, postId]
    );

    if (result.rows.length === 0) {
        throw createError(404, "Publicación no encontrada.");
    }

    return result.rows[0];
}

async function deletePost(id) {
    const postId = parseId(id);

    const result = await pool.query(
        "DELETE FROM posts WHERE id = $1 RETURNING id",
        [postId]
    );

    if (result.rows.length === 0) {
        throw createError(404, "Publicación no encontrada.");
    }
}

module.exports = {
    getPosts,
    getPostById,
    getPostsByAuthor,
    createPost,
    updatePost,
    deletePost
};