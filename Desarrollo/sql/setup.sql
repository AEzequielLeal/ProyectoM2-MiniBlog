BEGIN;

CREATE TABLE authors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL CHECK (length(trim(name)) > 0),
    email VARCHAR(150) NOT NULL UNIQUE CHECK (length(trim(email)) > 0),
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    author_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL CHECK (length(trim(title)) > 0),
    content TEXT NOT NULL CHECK (length(trim(content)) > 0),
    published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (author_id)
        REFERENCES authors(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_posts_author_id ON posts(author_id);

COMMIT;