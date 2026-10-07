const { test, afterEach, after, mock } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../src/app");
const pool = require("../src/db/pool");

const author = {
    id: 10,
    name: "Ana",
    email: "ana@example.com",
    bio: null,
    created_at: "2026-10-06T12:00:00.000Z"
};

const post = {
    id: 20,
    author_id: 10,
    title: "Post de prueba",
    content: "Contenido de prueba.",
    published: false,
    created_at: "2026-10-06T12:00:00.000Z"
};

// Sustituye temporalmente la consulta real a PostgreSQL.
function simulateRows(rows) {
    return mock.method(pool, "query", async () => ({ rows }));
}

// Cada prueba empieza sin los mocks de la anterior.
afterEach(() => {
    mock.restoreAll();
});

after(async () => {
    await pool.end();
});

test("POST /authors crea un autor y normaliza sus datos", async () => {
    const query = simulateRows([author]);

    const response = await request(app)
        .post("/authors")
        .send({
            name: " Ana ",
            email: " ANA@example.com "
        })
        .expect(201);

    assert.deepEqual(response.body, author);
    assert.equal(response.headers.location, "/authors/10");

    assert.deepEqual(
        query.mock.calls[0].arguments[1],
        ["Ana", "ana@example.com", null]
    );
});

test("GET /authors/:id devuelve el autor solicitado", async () => {
    const query = simulateRows([author]);

    const response = await request(app)
        .get("/authors/10")
        .expect(200);

    assert.deepEqual(response.body, author);
    assert.deepEqual(query.mock.calls[0].arguments[1], [10]);
});

test("PUT /authors/:id actualiza un autor", async () => {
    const updated = { ...author, name: "Ana actualizada" };
    const query = simulateRows([updated]);

    const response = await request(app)
        .put("/authors/10")
        .send({
            name: " Ana actualizada ",
            email: author.email
        })
        .expect(200);

    assert.deepEqual(response.body, updated);
    assert.deepEqual(
        query.mock.calls[0].arguments[1],
        ["Ana actualizada", author.email, null, 10]
    );
});

test("DELETE /authors/:id devuelve 204 sin contenido", async () => {
    const query = simulateRows([{ id: 10 }]);

    const response = await request(app)
        .delete("/authors/10")
        .expect(204);

    assert.equal(response.text, "");
    assert.deepEqual(query.mock.calls[0].arguments[1], [10]);
});

test("POST /authors rechaza un nombre vacío sin consultar la base", async () => {
    const query = simulateRows([]);

    const response = await request(app)
        .post("/authors")
        .send({
            name: "   ",
            email: author.email
        })
        .expect(400);

    assert.match(response.body.error, /name/);
    assert.equal(query.mock.callCount(), 0);
});

test("POST /authors devuelve 400 si el email está registrado", async () => {
    mock.method(pool, "query", async () => {
        const error = new Error("Email duplicado");
        error.code = "23505";
        error.constraint = "authors_email_key";
        throw error;
    });

    const response = await request(app)
        .post("/authors")
        .send({
            name: author.name,
            email: author.email
        })
        .expect(400);

    assert.equal(response.body.error, "El email ya está registrado.");
});

test("POST /posts crea un post con published false por defecto", async () => {
    const query = simulateRows([post]);

    const response = await request(app)
        .post("/posts")
        .send({
            title: " Post de prueba ",
            content: " Contenido de prueba. ",
            author_id: 10
        })
        .expect(201);

    assert.deepEqual(response.body, post);
    assert.equal(response.headers.location, "/posts/20");

    assert.deepEqual(
        query.mock.calls[0].arguments[1],
        ["Post de prueba", "Contenido de prueba.", 10, false]
    );
});

test("PUT /posts/:id actualiza un post", async () => {
    const updated = {
        ...post,
        title: "Nuevo título",
        content: "Nuevo contenido.",
        published: true
    };

    const query = simulateRows([updated]);

    const response = await request(app)
        .put("/posts/20")
        .send({
            title: updated.title,
            content: updated.content,
            author_id: 10,
            published: true
        })
        .expect(200);

    assert.deepEqual(response.body, updated);
    assert.deepEqual(
        query.mock.calls[0].arguments[1],
        ["Nuevo título", "Nuevo contenido.", 10, true, 20]
    );
});

test("DELETE /posts/:id devuelve 204 sin contenido", async () => {
    const query = simulateRows([{ id: 20 }]);

    const response = await request(app)
        .delete("/posts/20")
        .expect(204);

    assert.equal(response.text, "");
    assert.deepEqual(query.mock.calls[0].arguments[1], [20]);
});

test("DELETE /posts/:id devuelve 404 si el post no existe", async () => {
    simulateRows([]);

    const response = await request(app)
        .delete("/posts/9999")
        .expect(404);

    assert.equal(response.body.error, "Publicación no encontrada.");
});

test("POST /posts devuelve 400 si el autor no existe", async () => {
    mock.method(pool, "query", async () => {
        const error = new Error("Autor inexistente");
        error.code = "23503";
        error.constraint = "posts_author_id_fkey";
        throw error;
    });

    const response = await request(app)
        .post("/posts")
        .send({
            title: post.title,
            content: post.content,
            author_id: 9999
        })
        .expect(400);

    assert.equal(response.body.error, "El autor indicado no existe.");
});

test("GET /posts/author/:authorId incluye los datos del autor", async () => {
    mock.method(pool, "query", async (sql) => ({
        rows: sql.includes("FROM authors") ? [author] : [post]
    }));

    const response = await request(app)
        .get("/posts/author/10")
        .expect(200);

    assert.deepEqual(response.body, [
        {
            ...post,
            author
        }
    ]);
});