BEGIN;

INSERT INTO authors (name, email, bio)
VALUES
    ('Ana Garcia', 'ana@example.com', 'Desarrolladora full-stack.'),
    ('Carlos Ruiz', 'carlos@example.com', 'Escritor sobre bases de datos.'),
    ('Maria Lopez', 'maria@example.com', 'Ingeniera de software.');

INSERT INTO posts (title, content, author_id, published)
VALUES
    (
        'Introduccion a Node.js',
        'Node.js permite ejecutar JavaScript en el servidor.',
        (SELECT id FROM authors WHERE email = 'ana@example.com'),
        TRUE
    ),
    (
        'PostgreSQL',
        'PostgreSQL permite almacenar datos relacionados en tablas.',
        (SELECT id FROM authors WHERE email = 'carlos@example.com'),
        TRUE
    ),
    (
        'APIs REST',
        'Una API permite que distintas aplicaciones se comuniquen.',
        (SELECT id FROM authors WHERE email = 'ana@example.com'),
        TRUE
    ),
    (
        'Manejo de errores',
        'Los errores deben devolver respuestas claras.',
        (SELECT id FROM authors WHERE email = 'maria@example.com'),
        FALSE
    ),
    (
        'Async y await',
        'Estas palabras permiten trabajar con operaciones asincronas.',
        (SELECT id FROM authors WHERE email = 'ana@example.com'),
        FALSE
    );

COMMIT;