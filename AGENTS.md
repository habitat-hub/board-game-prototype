# Repository Guidelines

This document defines project structure, workflows, and conventions for contributors.

## Prerequisites
- Node.js (see `.nvmrc` or `package.json` "engines") and a single project-wide package manager (npm, pnpm, or yarn)
- If using pnpm: `corepack enable && corepack prepare pnpm@latest --activate`
- Docker and Docker Compose v2 (`docker compose ...`)
- PostgreSQL client (optional, for local debugging)
- Local env files prepared: `cp frontend/.env_example frontend/.env.local` and `cp backend/.env_example backend/.env`

## Project Structure & Module Organization
- `frontend/`: Next.js + TypeScript app (`src/`, `public/`). Generated API types in `frontend/src/__generated__/api/types/` (do not edit).
- `backend/`: Express + TypeScript server (`src/`, outputs to `dist/`). Swagger files and scripts live under `backend/src/scripts/`.
- `docs/`: Built API docs (Redoc) output path used by backend script.
- `scripts/`: Helper scripts (e.g., `scripts/parallel-npm-ci.sh`).

## Build, Test, and Development Commands
- `make ci`: Install dependencies for backend and frontend in parallel.
- `make dev`: Start DB (Docker), backend dev server, and frontend dev server together.
- `make db-up[-detached]` | `make db-down` | `make db-destroy`: Manage local Postgres via `backend/docker-compose.yml`.
- Backend:
  - `npm run dev-without-swagger`: Start dev server with ts-node-dev.
  - `npm run generate-swagger && npm run generate-api-types`: Refresh API spec and regenerate frontend types.
  - `npm run lint`: Type-check + ESLint.
- Frontend:
  - `npm run dev` | `npm run build` | `npm run start`: Next.js lifecycle.
  - `npm run lint`, `npm run format`: Lint/format.
  - `npm run test`, `npm run test:watch`, `npm run test:coverage`: Jest tests.

## Coding Style & Naming Conventions
- TypeScript, 2-space indent, Prettier enforced (`backend/.prettierrc`, frontend Prettier script).
- ESLint active in both apps; frontend enforces import order and path alias `@/*`.
- Components: PascalCase (e.g., `MyComponent.tsx`); hooks/utilities: camelCase; directories: kebab-case.
- Do not edit generated files in `frontend/src/__generated__/api/types/` (ignored by ESLint).

## Testing Guidelines
- Frontend: Jest + Testing Library (`frontend/jest.config.js`). Place specs as `*.test.ts(x)` (e.g., `src/**/__tests__/*` or alongside files). Run `npm test` in `frontend/`.
- Backend: Use Vitest/Jest + Supertest for new modules. Target: ≥1 happy-path test per new route/service and ≥60% stmt/branch coverage on touched files. Keep pure logic decoupled from Express handlers for testability.

## Commit & Pull Request Guidelines
- Commits: Prefer Conventional Commits (e.g., `feat:`, `fix:`, `refactor:`). Keep messages scoped and imperative.
- Branching: Open PRs to `develop`; merges to `main` are automated via workflow.
- PRs: Use the template, describe changes, link issues, and add screenshots for UI updates. Ensure local run passes.
- CI: Lint runs for backend/frontend; frontend and backend tests + coverage run on PRs to `develop`/`main`.

## Security & Configuration Tips
- Copy env examples: `cp frontend/.env_example frontend/.env.local` and `cp backend/.env_example backend/.env`.
- Do not commit secrets. Adjust `DATABASE_URL` and external keys locally.
