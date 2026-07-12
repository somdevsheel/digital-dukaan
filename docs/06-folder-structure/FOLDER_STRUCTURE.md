# Folder Structure

## Hyperlocal Digital Marketplace Platform

| | |
|---|---|
| **Owner** | Arutech Consultancy Services LLP |
| **Status** | Draft v1.0 — pending stakeholder approval |
| **Date** | 2026-07-11 |
| **Phase** | 6 of 10 |
| **Input** | [Architecture §20](../02-architecture/ARCHITECTURE.md#20-monorepo-strategy) |
| **Next phase** | Backend Development |

This phase scaffolds the monorepo the previous five phases were designed against — directories, package manifests, and tooling config. **No feature code.** Every app/package README below says so explicitly and points to where its real implementation begins (Phase 7 or 8).

---

## 1. What Got Built This Phase

```
Digital Market Place/
├── package.json, pnpm-workspace.yaml, turbo.json     # workspace root
├── tsconfig.base.json, eslint.config.js               # shared compiler/lint config
├── .prettierrc.json, .editorconfig, .nvmrc, .gitignore
├── docker-compose.yml                                  # local dev infra only (§4)
├── apps/
│   ├── api/            # NestJS — core REST API (Architecture §3)
│   ├── worker/          # NestJS — BullMQ consumers
│   ├── realtime/          # Socket.IO gateway
│   ├── web-merchant/        # Next.js — merchant dashboard
│   ├── web-admin/             # Next.js — admin panel
│   ├── web-public/              # Next.js — SEO/discovery (Architecture §4 addition)
│   ├── mobile-customer/           # Expo/React Native — customer app
│   └── mobile-delivery/             # Expo/React Native — delivery partner app
├── packages/
│   ├── domain-types/       # Shared TS types mirrored from prisma/schema.prisma
│   ├── api-client/          # Typed client generated from @app/api's OpenAPI spec
│   ├── validation-schemas/    # Zod schemas, shared client/server validation
│   ├── ui/                      # Shadcn-based web component library
│   ├── ui-native/                 # React Native component library
│   └── config/                      # Shared ESLint preset
└── docs/                                                # Phases 1–6 deliverables (this doc included)
```

Every `apps/*` and `packages/*` entry has a `package.json` (real dependency list, matching the exact libraries fixed in Architecture/tech stack — not placeholders), a `tsconfig.json` extending the root base config, and a `README.md` stating its purpose and current status. Apps that need runtime secrets also have an `.env.example`.

---

## 2. Tooling Decisions

| Choice | Alternative considered | Why |
|---|---|---|
| **pnpm** workspaces | npm/yarn workspaces | Strict, non-flat `node_modules` (via symlinks) catches "works because a transitive dep happened to hoist" bugs that npm/yarn's flatter layout hides; also the fastest installer of the three, which matters once CI is running installs on every PR across 8 apps. |
| **Turborepo** for task orchestration | Nx, plain npm scripts | Simplest mental model (a task graph over `package.json` scripts) for a team this size; Nx's plugin ecosystem/generators are more machinery than needed here. Remote caching is a one-line addition later if CI times demand it. |
| **ESLint flat config** (`eslint.config.js`) | Legacy `.eslintrc` | Flat config is ESLint's current, actively-developed format; starting on the legacy format in a new 2026 project would be adopting deprecated tooling on day one. |
| Internal packages consumed as **TS source directly** (no build step) | Each package pre-compiled to `dist/` before consumption | Next.js, Metro (React Native), and `tsx` (Node dev) all transpile TypeScript on the fly — adding a build step to `@platform/*` packages would mean remembering to rebuild on every edit during local dev for no benefit until those packages are ever published outside this monorepo (not planned). Turborepo's `build` pipeline still exists for the apps that do need a real build output (Next.js, Nest). |
| **`@app/*`** and **`@platform/*`** npm-scope convention | Unscoped package names | Immediately tells a reader "deployable unit" vs. "shared library" from the import statement alone (`import { X } from "@platform/domain-types"` vs. deploying `@app/api`) — small thing, removes a whole class of "wait, is this a package or an app" confusion as the repo grows. |

---

## 3. Path Aliases

Every app's `tsconfig.json` sets `@/*` → its own `src/*` (framework-idiomatic: Next.js and Nest both expect this locally-scoped alias). Cross-package imports always go through the package name (`@platform/domain-types`), never a relative `../../../packages/...` reach-across — pnpm workspace linking makes this free, and it's what keeps a package's internal reorganization from becoming a repo-wide find-and-replace.

---

## 4. `docker-compose.yml` Scope

Deliberately **infrastructure-only** (Postgres+PostGIS, Redis, Meilisearch, MinIO) — application services (`api`, `worker`, `realtime`, the three web apps) run natively via `pnpm dev` for fast hot-reload, not in containers, during local development. Per-app `Dockerfile`s and the Kubernetes/Helm deployment artifacts referenced in [Architecture §21](../02-architecture/ARCHITECTURE.md#21-infrastructure--deployment) are a Phase 10 deliverable — building them now, before any app has real code to containerize, would be scaffolding with nothing to validate it against.

---

## 5. Environment Variables

Every app that needs secrets ships an `.env.example` (committed) documenting every variable it reads; the real `.env` is git-ignored, never committed, per [Architecture §17](../02-architecture/ARCHITECTURE.md#17-security-architecture). Mobile apps use `app.config.example.json` (Expo's config-as-code) for the same purpose, since Expo doesn't read `.env` files directly into the app bundle the way Next.js/Node do.

---

## 6. What's Deliberately Not Here Yet

- No `prisma/schema.prisma` inside `apps/api/` yet — the authoritative copy lives at [docs/03-database-design/schema.prisma](../03-database-design/schema.prisma) until Phase 7 copies it in as that phase's first step (and from then on, the copy in `apps/api/prisma/` is the one that evolves via migrations; this doc's copy becomes historical record).
- No component code in `packages/ui` / `packages/ui-native` — Phase 8, built on the validated Phase 5 wireframe layouts.
- No `Dockerfile`s, Helm charts, or CI workflow files — Phase 9/10.
- No `src/main.ts`/`App.tsx` bootstrap files in any app — intentionally left for whoever writes the first line of Phase 7/8 code to create, so that first commit is a real starting point rather than a scaffold-generated stub nobody wrote.

---

**Status:** Ready for review. Phase 7 (Backend Development) starts by copying [schema.prisma](../03-database-design/schema.prisma) into `apps/api/prisma/`, running the first migration, and implementing the Identity module end-to-end as the reference pattern every other module in [Architecture §6](../02-architecture/ARCHITECTURE.md#6-domain--bounded-context-map) follows.
