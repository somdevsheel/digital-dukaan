# @app/api

The core synchronous REST API. Implements every endpoint in [API Design](../../docs/04-api-design/API_DESIGN.md) against the schema in [Database Design](../../docs/03-database-design/schema.prisma), structured per the Clean Architecture layering in [Architecture §5](../../docs/02-architecture/ARCHITECTURE.md#5-clean-architecture-inside-the-api-service).

## Status

Scaffolded (Phase 6). Implementation begins Phase 7.

## Structure (populated in Phase 7)

```
src/
  modules/
    identity/
    business/
    commerce/
    booking/
    payments/
    delivery/
    reviews/
    notifications/
    admin/
  main.ts
prisma/
  schema.prisma   # copied from docs/03-database-design/schema.prisma, then evolved
  migrations/
  seed.ts
```

Each module under `modules/` follows `domain/ → application/ → infrastructure/ → presentation/` — see Architecture §5 before adding a module.

## Local development

```bash
pnpm infra:up            # starts Postgres+PostGIS, Redis, Meilisearch, MinIO (see docker-compose.yml)
cp .env.example .env
pnpm --filter @app/api prisma:migrate
pnpm --filter @app/api dev
```
