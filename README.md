# Furai

pnpm monorepo with a React web app and a NestJS API.

| Path | Package | Stack |
| --- | --- | --- |
| `apps/web` | `@furai/web` | React, TypeScript, Vite, Zustand |
| `apps/api` | `@furai/api` | NestJS |
| `packages/shared` | `@furai/shared` | Shared types |

## Prerequisites

1. **Node.js 20+** (22 LTS recommended) on your `PATH`. Confirm before installing dependencies:

   ```bash
   node -v   # v20 or newer
   which node
   ```

   If `node` is missing, install it (e.g. `brew install node`, or use [nvm](https://github.com/nvm-sh/nvm) / [fnm](https://github.com/Schniz/fnm)).

2. **pnpm** (this repo pins `pnpm@10.34.7` via `packageManager`). With Node 16.13+:

   ```bash
   corepack enable
   corepack prepare pnpm@10.34.7 --activate
   ```

   Or: `npm install -g pnpm@10.34.7` / `brew install pnpm`.

## Start

From the repository root, with Node already available:

```bash
pnpm install
pnpm dev
```

`pnpm install` must run with a working `node` so platform-native packages (e.g. Vite/Rolldown bindings) install correctly.

`pnpm dev` builds `@furai/shared`, then starts the web app and the API.

- Web: http://localhost:5173
- API health: http://localhost:3000/api/health

The Vite dev server proxies `/api` to the API, so run both when using the notes screen.

## Run one app

`@furai/shared` must be built first (its exports point at `dist/`). Prefer `pnpm dev` for that, or:

```bash
pnpm --filter @furai/shared build
pnpm dev:web
pnpm dev:api
```

## Troubleshooting

**`exec: node: not found` / `spawn ENOENT`** — Node is not on your `PATH`. Fix prerequisites, then reinstall.

**`Cannot find module '@furai/shared'`** — Build shared: `pnpm --filter @furai/shared build`.

**`Cannot find native binding` (Rolldown / Vite)** — Dependencies were likely installed before Node was available. Reinstall cleanly:

```bash
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

## Other commands

```bash
pnpm build
pnpm test
pnpm --filter @furai/api test:e2e
```
