# MiniBlog API

API REST del Proyecto Integrador del Módulo 2 de Henry, desarrollada con Node.js, Express y PostgreSQL. Permite crear, consultar, actualizar y eliminar autores y publicaciones. Un autor puede tener muchos posts y cada post pertenece a un único autor.

## Tecnologías y requisitos

- Node.js 22 y npm. Desarrollo local probado con Node.js 22.16.0.
- PostgreSQL y su cliente `psql`. Desarrollo local probado con PostgreSQL 18.
- Express, pg, dotenv y swagger-ui-express.
- Supertest y el ejecutor incorporado `node:test` para las pruebas.
- Git, una cuenta de GitHub y una cuenta de Railway para publicar y desplegar.

Los comandos de terminal de esta guía usan Bash o Git Bash. Salvo que se indique otra ubicación, se ejecutan desde la carpeta **Desarrollo** del repositorio.

## Organización

| Ruta desde la raíz del repositorio | Contenido |
| --- | --- |
| Desarrollo/src/app.js | Configuración de Express y exportación de la aplicación |
| Desarrollo/src/server.js | Inicio del servidor HTTP |
| Desarrollo/src/routes/ | Endpoints de autores y publicaciones |
| Desarrollo/src/services/ | Validaciones y consultas SQL parametrizadas |
| Desarrollo/src/db/pool.js | Pool de conexión a PostgreSQL |
| Desarrollo/src/db/check.js | Comprobación de conexión |
| Desarrollo/src/middlewares/errorHandler.js | Manejo global de errores |
| Desarrollo/sql/setup.sql | Tablas, constraints e índice |
| Desarrollo/sql/seed.sql | Tres autores y cinco posts de ejemplo |
| Desarrollo/tests/api.test.js | Doce tests automatizados |
| Desarrollo/openapi.json | Especificación OpenAPI 3.0.3 |
| Desarrollo/.env.example | Ejemplo de configuración sin credenciales reales |
| Desarrollo/README.md | Guía de ejecución y despliegue |
| Documentación/README.md | Documentación del proyecto y uso de IA |

## Ejecución local

### 1. Instalar dependencias

Descargar o clonar este repositorio y abrir una terminal dentro de `Desarrollo`.

```bash
npm ci
```

### 2. Crear la base de datos

Con PostgreSQL en ejecución, abrir `psql`:

```bash
psql -U postgres
```

Ingresar la contraseña configurada durante la instalación. Dentro de psql:

```sql
CREATE DATABASE miniblog;
```

Salir de psql con `\q`. Luego, desde `Desarrollo`, crear las tablas y cargar los datos iniciales:

```bash
psql -U postgres -d miniblog -v ON_ERROR_STOP=1 -f sql/setup.sql
psql -U postgres -d miniblog -v ON_ERROR_STOP=1 -f sql/seed.sql
```

Ejecutar **setup y seed una sola vez sobre una base nueva**. No son scripts de migraciones idempotentes: repetir setup encuentra tablas existentes y repetir seed encuentra emails duplicados. Ambos usan transacciones. Una modificación posterior del esquema debe realizarse con un script de migración específico.

En Windows, si `psql` no está en PATH, se puede utilizar SQL Shell. Después de crear la base:

```text
\c miniblog
\i 'C:/ruta/al/repositorio/Desarrollo/sql/setup.sql'
\i 'C:/ruta/al/repositorio/Desarrollo/sql/seed.sql'
\dt
```

Reemplazar las rutas por la ubicación real del repositorio, usando barras `/`.

### 3. Configurar variables de entorno

Copiar el ejemplo:

```bash
cp .env.example .env
```

Editar el archivo `.env` con la configuración local:

```dotenv
PORT=3000
PGHOST=localhost
PGPORT=5432
PGDATABASE=miniblog
PGUSER=postgres
PGPASSWORD="tu_contrasena_de_postgres"
```

| Variable | Uso |
| --- | --- |
| PORT | Puerto HTTP; por defecto, 3000 |
| PGHOST, PGPORT | Host y puerto de PostgreSQL local |
| PGDATABASE | Nombre de la base local |
| PGUSER, PGPASSWORD | Usuario y contraseña de PostgreSQL |
| DATABASE_URL | Cadena de conexión completa; tiene prioridad sobre PG* cuando está configurada |

En Railway se utiliza `DATABASE_URL`. El código carga variables mediante dotenv y crea un único `Pool` reutilizable. El archivo `.env` contiene valores privados y queda excluido de Git; el repositorio incluye únicamente `.env.example`.

Para comprobar la conexión y la existencia de autores:

```bash
node src/db/check.js
```

Con el seed inicial, debe informar la base `miniblog` y tres autores.

### 4. Iniciar la API

Durante el desarrollo:

```bash
npm run dev
```

Para ejecución sin el modo de observación:

```bash
npm start
```

El servidor escucha en `0.0.0.0` y utiliza `process.env.PORT`.

- Estado y conexión a PostgreSQL: [http://localhost:3000/health](http://localhost:3000/health).
- Documentación interactiva: [http://localhost:3000/docs](http://localhost:3000/docs).
- Documento OpenAPI: [http://localhost:3000/openapi.json](http://localhost:3000/openapi.json).
- Autores: [http://localhost:3000/authors](http://localhost:3000/authors).
- Posts: [http://localhost:3000/posts](http://localhost:3000/posts).

Las URLs anteriores corresponden al puerto local predeterminado. `/health` responde `{"status":"ok","database":"connected"}` cuando la consulta `SELECT 1` funciona. La ruta raíz `/` devuelve 404; la documentación está en `/docs`.

## Modelo de datos

**authors:** `id SERIAL PRIMARY KEY`, `name VARCHAR(100)`, `email VARCHAR(150) UNIQUE`, `bio TEXT` y `created_at TIMESTAMPTZ`. Nombre y email son obligatorios; bio puede ser null.

**posts:** `id SERIAL PRIMARY KEY`, `author_id INTEGER`, `title VARCHAR(200)`, `content TEXT`, `published BOOLEAN DEFAULT FALSE` y `created_at TIMESTAMPTZ`. Autor, título y contenido son obligatorios.

`posts.author_id` referencia `authors.id`. La relación es 1:N y utiliza `ON DELETE CASCADE`: al eliminar un autor también se eliminan sus posts. Existe el índice `idx_posts_author_id` para las consultas por autor.

Se utiliza **authors** de manera consistente en tablas y endpoints; la referencia a `users.id` en una parte de la consigna se interpreta como `authors.id`, de acuerdo con las entidades y rutas solicitadas.

## Endpoints

| Método | Ruta | Resultado exitoso |
| --- | --- | --- |
| GET | /authors | 200, array de autores |
| GET | /authors/:id | 200, autor |
| POST | /authors | 201, autor creado y header Location |
| PUT | /authors/:id | 200, autor actualizado |
| DELETE | /authors/:id | 204, sin cuerpo |
| GET | /posts | 200, array de posts |
| GET | /posts/:id | 200, post |
| GET | /posts/author/:authorId | 200, array de posts con un objeto author dentro de cada post |
| POST | /posts | 201, post creado y header Location |
| PUT | /posts/:id | 200, post actualizado |
| DELETE | /posts/:id | 204, sin cuerpo |

Las listas se ordenan por ID. Si un autor existe pero no tiene posts, `GET /posts/author/:authorId` devuelve `[]`; si el autor no existe, devuelve 404.

### Ejemplos de cuerpos JSON

Crear o actualizar un autor:

```json
{
  "name": "Autor de ejemplo",
  "email": "autor@example.com",
  "bio": "Biografía breve."
}
```

Crear o actualizar un post:

```json
{
  "title": "Publicación de ejemplo",
  "content": "Contenido de la publicación.",
  "author_id": 1,
  "published": true
}
```

Usar un `author_id` existente. Los IDs se generan automáticamente; no debe suponerse que siempre son consecutivos.

## Validaciones y errores

- Los IDs deben ser enteros positivos de hasta 2147483647.
- Nombre: texto no vacío, hasta 100 caracteres después de recortar espacios.
- Email: formato básico válido, hasta 150 caracteres y único. Se recortan espacios y se guarda en minúsculas.
- Bio: texto o null; al omitirse se guarda null.
- Título: texto no vacío, hasta 200 caracteres después de recortar espacios.
- Contenido: texto no vacío después de recortar espacios.
- author_id: número entero JSON positivo que corresponde a un autor existente.
- published: booleano JSON; al omitirse se guarda false.
- Los campos desconocidos del cuerpo JSON se ignoran.

**PUT reemplaza los campos editables.** En autores requiere name y email, y omitir bio la deja en null. En posts requiere title, content y author_id, y omitir published lo deja en false. Se conservan id y created_at.

Las respuestas de error tienen la forma:

```json
{
  "error": "Publicación no encontrada."
}
```

| Código | Significado |
| --- | --- |
| 400 | Datos inválidos, ID inválido, JSON mal formado, email duplicado o autor referenciado inexistente |
| 404 | Recurso o ruta inexistente |
| 500 | Error inesperado; respuesta genérica sin detalles internos |

Las consultas usan parámetros `$1`, `$2`, etc. Las violaciones de unicidad del email y de la FK del post se traducen a errores 400 mediante el middleware global. Una segunda eliminación del mismo recurso devuelve 404.

## Tests automatizados

Desde `Desarrollo`:

```bash
npm test
```

Se incluyen **12 tests** con Supertest y `node:test`: creación, lectura, actualización y eliminación de autores; creación, actualización y eliminación de posts; validación de nombre; email duplicado; recurso inexistente; autor inexistente; y consulta de posts con detalles del autor.

Son pruebas HTTP y de la lógica de servicios con `pool.query` simulado. No necesitan el servidor de desarrollo ni una base de datos activa y no modifican datos reales. La persistencia y las constraints reales se comprobaron manualmente en PostgreSQL y mediante peticiones en Thunder Client.

Resultado verificado durante el desarrollo: **12 pruebas aprobadas y 0 fallidas**.

## Documentación OpenAPI

El archivo [openapi.json](../Desarrollo/openapi.json) documenta los once endpoints obligatorios y `/health`, cuerpos JSON, parámetros, respuestas y ejemplos.

Iniciar la API y abrir `/docs` para utilizar Swagger UI. Expandir un endpoint, seleccionar **Try it out** y luego **Execute**. Las operaciones de creación, modificación y eliminación actúan sobre la base conectada.

La opción **Servidor actual** permite usar la misma documentación en localhost y en Railway.

## Deployment en Railway

### Configurar los servicios

1. Publicar el repositorio en GitHub.
2. Crear un proyecto de Railway y agregar el servicio de la API desde ese repositorio.
3. En Settings del servicio, configurar **Root Directory: /Desarrollo** y **Start Command: npm start**. El proyecto usa JavaScript directamente y no necesita compilación.
4. Agregar PostgreSQL al mismo proyecto y entorno.
5. Configurar las variables del servicio de la API:

| Variable | Valor |
| --- | --- |
| DATABASE_URL | Referencia a la DATABASE_URL privada del servicio PostgreSQL |
| NODE_ENV | production |
| PORT | Utilizar el valor provisto por Railway |

Si el servicio de la base se llama `Postgres`, la referencia de DATABASE_URL es `${{Postgres.DATABASE_URL}}`. Si tiene otro nombre, seleccionar la referencia correspondiente desde Variables. El pool ya utiliza esta variable.

### Inicializar la base de Railway una sola vez

Los archivos SQL están en el repositorio, pero no se ejecutan al iniciar el servidor. Inicializar la base que provisiona Railway antes de probar el CRUD.

Para ejecutar los scripts desde una computadora con Bash/Git Bash y `psql`:

1. En el servicio PostgreSQL, habilitar **Public Access** en Networking.
2. Copiar el valor privado de `DATABASE_PUBLIC_URL`.
3. Desde `Desarrollo`, leer esa cadena en una variable temporal sin mostrarla en la terminal:

```bash
read -r -s -p "Pegá DATABASE_PUBLIC_URL y presioná Enter: " MINIBLOG_DATABASE_PUBLIC_URL
```

Luego ejecutar, una vez cada uno:

```bash
psql "$MINIBLOG_DATABASE_PUBLIC_URL" -v ON_ERROR_STOP=1 -f sql/setup.sql
psql "$MINIBLOG_DATABASE_PUBLIC_URL" -v ON_ERROR_STOP=1 -f sql/seed.sql
unset MINIBLOG_DATABASE_PUBLIC_URL
```

La cadena contiene credenciales: usarla únicamente para la conexión y mantenerla fuera del repositorio y de las capturas. El tráfico habitual API–PostgreSQL utiliza la URL privada.

### Internal URL y Public URL

- **URL interna de PostgreSQL:** conexión entre la API y la base dentro del proyecto y entorno de Railway, utilizando DATABASE_URL y un host interno.
- **URL interna de la API:** para otros servicios del mismo entorno, `http://NOMBRE_DEL_SERVICIO.railway.internal:PORT`, con el nombre y puerto reales.
- **URL pública de la API:** dominio HTTPS para acceder desde el navegador, Thunder Client o un frontend. Se genera en **Settings → Networking → Public Networking → Generate Domain**.
- **DATABASE_PUBLIC_URL:** conexión TCP externa a PostgreSQL para herramientas administrativas. Es diferente de la URL HTTP pública de la API y contiene credenciales.

### Verificar y registrar el deploy

Configurar el healthcheck de la API en `/health`. Una vez desplegada e inicializada la base, comprobar en el dominio público:

- `/health`: 200 y conexión activa.
- `/authors` y `/posts`: 200 y datos de ejemplo.
- `/docs`: documentación visible.
- Crear un recurso de prueba, volver a consultarlo y eliminarlo para verificar escritura y lectura en producción.

Guardar la URL pública real y una captura o registro del deployment en **Documentación** antes de entregar el repositorio. El deploy es una etapa separada de la validación local.

Cuando el servicio esté conectado a la rama de GitHub y el despliegue automático esté habilitado, los nuevos pushes permiten actualizar la aplicación. Ejecutar `npm test` antes de publicar cambios.

### Referencias oficiales

- [Deploy de Express en Railway](https://docs.railway.com/guides/express).
- [Root Directory para proyectos con subcarpetas](https://docs.railway.com/deployments/monorepo).
- [PostgreSQL: conexiones internas y externas](https://docs.railway.com/databases/postgresql).
- [Red privada](https://docs.railway.com/networking/private-networking).
- [Dominio público](https://docs.railway.com/networking/public-networking).

## Registro del uso de IA

**Herramienta:** ChatGPT/Codex, de OpenAI.  
**Período de trabajo:** 6 y 7 de octubre de 2026.

Se utilizó IA como apoyo para interpretar la consigna, organizar el proyecto y explicar e implementar SQL, Express, consultas parametrizadas, validaciones, manejo de errores, tests y documentación.

### Entradas y prompts utilizados

La consigna completa y la rúbrica del Proyecto Integrador se compartieron como contexto, incluyendo entidades, endpoints, validaciones, estructura de entrega y deployment.

| Consulta compartida en el chat | Cómo influyó en el trabajo |
| --- | --- |
| "necesito empezar y terminar hoy el tp final del modulo" | Se organizó un orden de trabajo: base, API, validaciones, tests, documentación y deployment. |
| "listo, desde cero" | Se desarrolló el proyecto por pasos desde la creación de la base y la estructura inicial. |
| "que significa esa linea", sobre COMMIT | Se explicó el uso de transacciones, BEGIN, COMMIT y ROLLBACK. |
| "es lo que me pide la consigna?" | Se verificó que OpenAPI era parte del entregable y que Swagger UI era una forma de mostrarlo. |

También se compartieron respuestas JSON y capturas de SQL Shell, VS Code, Thunder Client y la terminal. Esas salidas permitieron revisar la conexión, los códigos HTTP y los resultados de los tests.

### Aportes de IA y verificación

- Propuesta del modelo authors–posts, PKs, FK, constraints, índice y seed.
- Código de rutas, servicios, helpers, conexión y middleware de errores.
- Explicaciones de IDs, relaciones, transacciones, consultas parametrizadas y respuestas HTTP.
- Preparación de doce tests con Supertest y respuestas de base simuladas.
- Elaboración de OpenAPI y este README, incluida la guía de deployment.

La implementación se realizó paso a paso en VS Code y se ejecutaron los comandos en la computadora de trabajo. Se verificaron creación y seed de PostgreSQL, consulta de datos relacionados, conexión desde pg, CRUD mediante Thunder Client, doce tests aprobados y carga de Swagger UI en el navegador.

## API desplegada en Railway

- [URL pública de la API](https://proyectom2-miniblog-production.up.railway.app)
- [Comprobar conexión: /health](https://proyectom2-miniblog-production.up.railway.app/health)
- [Documentación Swagger](https://proyectom2-miniblog-production.up.railway.app/docs)
- [Registro del despliegue y pruebas](../Documentación/registro-deploy.md)

Despliegue verificado el 7 de octubre de 2026.
Se comprobaron conexión, lectura de autores y publicaciones,
Swagger y creación, consulta y eliminación de un autor temporal.
