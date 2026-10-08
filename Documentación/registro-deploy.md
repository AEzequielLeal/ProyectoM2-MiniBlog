# Registro del despliegue de MiniBlog

Fecha de verificación: 7 de octubre de 2026.

## Enlaces

- API: https://proyectom2-miniblog-production.up.railway.app
- Swagger: https://proyectom2-miniblog-production.up.railway.app/docs
- GitHub: https://github.com/AEzequielLeal/ProyectoM2-MiniBlog

## Configuración

- Plataforma: Railway.
- Entorno: Production.
- Servicios: ProyectoM2-MiniBlog y Postgres, ambos Online.
- Rama: main.
- Directorio raíz de la API: /Desarrollo.
- Comando de inicio: npm start.
- Puerto del dominio: 8080.
- NODE_ENV: production.
- DATABASE_URL: referencia a ${{Postgres.DATABASE_URL}}.

La API se conecta a PostgreSQL mediante la red privada de Railway.
Las credenciales se mantienen en variables de entorno.

Se ejecutaron setup.sql y seed.sql una sola vez sobre la base
de Railway, cargando tres autores y cinco publicaciones.

## Verificación en producción

Las comprobaciones se realizaron en el navegador y Thunder Client.

| Petición | Resultado |
| --- | --- |
| GET /health | status: ok; database: connected |
| GET /authors | Tres autores del seed |
| GET /posts | Cinco publicaciones del seed |
| GET /docs | Swagger UI con los endpoints |
| POST /authors | 201 Created; autor temporal con id 4 |
| GET /authors/4 | 200; lectura del autor creado |
| DELETE /authors/4 | 204; cuerpo vacío |
| DELETE /authors/4 repetido | 404; autor inexistente |

El autor temporal fue eliminado al finalizar la prueba.
Se comprobó lectura y escritura con PostgreSQL real en producción.

## Tests automatizados

Antes del despliegue pasaron los 12 tests de npm test.
Utilizan Node.js Test Runner y Supertest, con consultas
a PostgreSQL simuladas.