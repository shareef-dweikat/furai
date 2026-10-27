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

## Code cleanliness

[Fallow](https://fallow.tools/docs/) checks unused code, duplication, and health across `apps/web`, `apps/api`, and `packages/shared`. Run it from the repository root. `pnpm install` is enough; there is no global install.

Oxlint (`pnpm lint`) checks each file. Fallow checks how those files connect. Run both.

**See the state of the code**

```bash
pnpm fallow                  # unused code, duplication, and health together
pnpm fallow health --score   # 0–100 score and the biggest deductions
pnpm fallow dead-code        # unused files, exports, and dependencies
pnpm fallow dupes            # copied blocks across apps and packages
```

Limit a run to your change, or to one package:

```bash
pnpm fallow --changed-since main
pnpm fallow dead-code --workspace apps/web
```

**Before you delete something**, ask Fallow to prove it is unused. A name that looks unused in one app can still be imported by the other.

```bash
pnpm fallow dead-code --trace apps/web/src/network/services/products/products.service.ts:getProducts
pnpm fallow dead-code --trace-dependency some-package
```

**Clean up only what Fallow can do safely.** Preview first, then apply:

```bash
pnpm fallow fix --dry-run
pnpm fallow fix
```

That removes supported unused code. Duplicates and complex functions stay in the report for you to refactor.

**Before a pull request**, check only what your branch introduced:

```bash
pnpm fallow audit --base main
```

A `fail` verdict means this change added a finding. Existing issues in files you did not touch stay out of the verdict.

### Coding agents

The same checks are already wired for Cursor. After `pnpm install`, enable the **fallow** MCP server if it is off, and start chats from the repository root.

| File | What it does |
| --- | --- |
| `AGENTS.md` | Short project context loaded in every chat: layout, commands, and agent rules |
| `.agents/skills/fallow` | Fallow task map and analysis skill, read when a Fallow task comes up |
| `.agents/skills/fallow-setup` | Setup skill for code-quality tooling |
| `.cursor/mcp.json` | Registers the `fallow` MCP server as `npx --no fallow-mcp` |

The Fallow task map stays in `.agents/skills/fallow`, so it is not sent with every chat. Git does not enforce an audit: a commit from your terminal still goes through, and so does a commit if the agent skips the check.

Claude Code and Codex can install a real gate with `pnpm exec fallow agent install`. That hook runs when the agent tries to commit or push, and blocks the command when `fallow audit` returns `fail`. Fallow skips that hook for Cursor, because Cursor's hook format is different.

When you want the check yourself, run `pnpm fallow audit --base main`.

Refresh the agent files after a Fallow upgrade. `--without guide` leaves `AGENTS.md` alone; a plain install writes the Fallow task map back into it.

```bash
pnpm exec fallow agent install --dry-run --without guide          # preview
pnpm exec fallow agent install --harness cursor --without guide   # rewrite the Cursor files
```
