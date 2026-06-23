# AGENTS.md — PY01 Restaurantes

Monorepo (npm workspaces) for a restaurant microservices system with polymorphic persistence.

## Services

| Service | Workspace | Entrypoint | Port |
|---------|-----------|------------|------|
| API (CRUD + Auth) | `services/api` | `src/index.js` | 3000 |
| Search (Elasticsearch) | `services/search` | `src/index.js` | 4000 |

Nginx gateway at `:80` routes `/api/*` → API, `/search/*` → Search.

## Persistence

Repository pattern: `services/api/src/repositories/{postgres,mongodb}/`. Switch via `DB_ENGINE=postgres|mongodb` env var (default: `postgres`).

- **PostgreSQL**: Prisma 7 + `@prisma/adapter-pg`. Schema at `services/api/prisma/schema.prisma`. Client must be generated (`prisma generate`) before runtime.
- **MongoDB**: Mongoose 9, lazy-connected via `ensureMongoConnection()` in `config/db.js`.
- **Seed script**: `infra/scripts/seed-data.js` — reuses `db.js` from API workspace. Run inside container: `docker compose exec -w /app/services/api api node ../../infra/scripts/seed-data.js`

## Commands (from root)

```bash
npm test                       # jest --coverage --runInBand --forceExit for both workspaces
npm run lint                   # eslint for both workspaces
npm run test:integration       # docker compose -f docker-compose.test.yml up --build --abort-on-container-exit
npm run dev:api                # nodemon services/api/src/index.js
npm run dev:search             # nodemon services/search/src/index.js
npm run seed:postgres          # seed with DB_ENGINE=postgres
npm run seed:mongodb           # seed with DB_ENGINE=mongodb
# Single workspace:
npm --workspace services/api test
npm --workspace services/api run lint
```

Workspace-level scripts are in each `services/*/package.json` (dev, start, test, lint, prisma:*).

## Testing

- **Jest 30 + Supertest**. All tests use `--runInBand --forceExit --coverage`.
- **Coverage threshold**: 90% lines/functions/statements, 80% branches.
- **Need live databases**: PostgreSQL, MongoDB, Redis, Elasticsearch. Use `docker-compose.test.yml` or run them manually.
- Tests are in `services/api/tests/` and `services/search/tests/`.

## Setup & Docker

```bash
docker compose up --build -d     # full stack (~20 containers, ~3min first time)
docker compose down -v            # full teardown + volume wipe (needed when switching DB_ENGINE)
```

- API Dockerfile runs `prisma migrate resolve --applied 001_initial` then `prisma migrate deploy` on start.
- Dockerfiles copy ALL workspace `package.json` files before `npm ci` for layer caching.

## Key env vars (no `.env.example`; defaults in `config/env.js`)

| Var | Default |
|-----|---------|
| `DB_ENGINE` | `postgres` |
| `API_PORT` | `3000` |
| `SEARCH_PORT` | `4000` |
| `JWT_SECRET` | `change_me` |
| `REDIS_URL` | `redis://localhost:6379` |
| `ELASTIC_URL` | `http://localhost:9200` |

## Conventions

- **CommonJS** (`require`/`module.exports`), not ES modules.
- **No `.github/workflows/`** in this checkout (described in README but absent from working tree).
- Node >= 22 required.
