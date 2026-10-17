# Furai

pnpm monorepo with a React web app and a NestJS API.

| Path | Package | Stack |
| --- | --- | --- |
| `apps/web` | `@furai/web` | React, TypeScript, Vite, Zustand |
| `apps/api` | `@furai/api` | NestJS |
| `packages/shared` | `@furai/shared` | Shared types |

Requires Node.js 20 or newer and pnpm.

## Start

From the repository root:

```bash
pnpm install
pnpm dev
```

`pnpm dev` builds `@furai/shared`, then starts the web app and the API.

- Web: http://localhost:5173
- API health: http://localhost:3000/api/health

The Vite dev server proxies `/api` to the API, so run both when using the notes screen.

## Run one app

```bash
pnpm dev:web
pnpm dev:api
```

## Other commands

```bash
pnpm build
pnpm test
pnpm --filter @furai/api test:e2e
```
