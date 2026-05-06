# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

`foundation` is a pnpm + Turborepo monorepo scaffold. Workspaces are declared in `pnpm-workspace.yaml`:

- `apps/*` — runnable applications:
  - `@foundation/cli` (`apps/cli`) — shadcn-style CLI; `pnpm dlx @foundation/cli add <pkg> [folder]` copies the source of a `@foundation/<pkg>` workspace package into the user's CWD by reading the GitHub Trees API and fetching `raw.githubusercontent.com`. Default `--repo` is parsed from this package's `repository.url`. Conflict UX: per-file prompt (skip/overwrite); `--yes` overwrites all, `--skip-existing` skips all. `GITHUB_TOKEN` env var lifts the unauthenticated 60 req/hr API limit.
- `packages/*` — shared libraries:
  - `@foundation/base` — utility library (TypeScript, ESM). Source files originate from VS Code (Microsoft, MIT). Uses VS Code's `@memoize`/legacy decorators and ambient `const enum`s (handled via project-wide tsconfig flags below).
  - `@foundation/platform` — depends on `@foundation/base`; currently houses the log subsystem (`src/log/`).
  - `@foundation/eslint-config` — shared flat ESLint config. `base.js` for any TS package, `node.js` for Node-runtime packages.

There is **no** `packages/config` — the shared `tsconfig.base.json` lives at the repo root and is referenced as `../../tsconfig.base.json` by every package.

## Common Commands

`packageManager` is pinned to `pnpm@10.28.1`. Use Turbo from the repo root for fan-out:

```bash
pnpm install                    # install all workspace deps
pnpm build                      # turbo run build (respects ^build deps)
pnpm -F @foundation/base build  # build a single package
pnpm -F @foundation/base lint   # eslint .  (uses flat config)
pnpm -F @foundation/base typecheck  # tsc --noEmit

# CLI dogfooding
pnpm -F @foundation/cli build
node apps/cli/dist/index.js add base foundation-base   # uses default --repo from package.json
```

Turbo tasks defined in `turbo.json`: `build` (outputs `dist/**`, `.next/**`), `lint`, `typecheck`, `dev` (persistent, uncached). `build` and `typecheck` declare `^build` so upstream packages build first.

There is no test runner. Every package's `test` script is the placeholder `echo "Error: no test specified" && exit 1`. Don't invent tests — if you add one, install a runner first.

## TypeScript Conventions

The shared `tsconfig.base.json` (repo root) sets — these match VS Code's source assumptions on purpose, since `@foundation/base` is upstream-derived:

| Flag | Value | Why |
|------|-------|-----|
| `target` / `lib` | `ES2024` / `["ES2024", "DOM", "DOM.Iterable", "WebWorker.ImportScripts"]` | Matches VS Code. Avoids `lib.esnext.iterator`'s `MapIterator`/`SetIterator` types breaking VS Code's `class Foo implements Map<K,V>` patterns. |
| `module` / resolution | `NodeNext` | ESM. Imports MUST use `.js` extensions even in `.ts` source. |
| `verbatimModuleSyntax` | `true` | Imports are not erased. Use `import type` for type-only. |
| `isolatedModules` | `true` | Single-file transpilers (esbuild/swc/vitest) work. |
| `preserveConstEnums` | `true` | VS Code uses `const enum` heavily; this makes them emit a real runtime object so cross-package consumers don't error. |
| `experimentalDecorators` | `true` | VS Code uses legacy 3-arg decorators (`@memoize`, DI `@IFoo`). `emitDecoratorMetadata` is OFF — VS Code's DI records dependencies inside the decorator itself, no `reflect-metadata` polyfill is required or installed. |
| `useUnknownInCatchVariables` | `false` | Match VS Code source. |
| `jsx` / `jsxImportSource` | `react-jsx` / `hono/jsx` | Hono JSX (not React). Only relevant where JSX is actually used. |

Per-package `tsconfig.json` extends the root, sets `outDir: ./dist`, `rootDir: ./src`, and overrides `types` to `[]` (or `["node"]` for `apps/cli`).

### Cross-package imports

Both `@foundation/base` and `@foundation/platform` use the **same `exports` map**:

```jsonc
"exports": {
  "./*.js": {
    "types": "./dist/*.d.ts",
    "default": "./dist/*.js"
  }
}
```

The `*` substitution slot deliberately omits the `.js` so the import path's `.js` becomes the file extension Node resolves. **Always** import with the `.js` suffix even though the source is `.ts`:

```ts
import { Emitter } from '@foundation/base/common/event.js';   // ✅
import { Emitter } from '@foundation/base/common/event';      // ❌ ERR_PACKAGE_PATH_NOT_EXPORTED
```

## VS Code source sync

Most files under `packages/base/src/common/`, `packages/base/src/common/observableInternal/`, etc. are copied **verbatim** from VS Code (`vscode/src/vs/base/common/...`, MIT). Sync rules:

- Keep files byte-identical when possible. Don't reformat.
- If a file references a sibling that doesn't exist (`./cancellation.js`, `./errors.js`, `./equals.js`, …), copy that sibling too.
- `arrays.ts` is the canonical "what does VS Code source look like" reference.

## CLI source layout

`apps/cli/src/`:

```
index.ts              # shebang + commander wiring + top-level error handler
constants.ts          # DEFAULT_REF + repoFromPackageJson() (parses owner/repo from package.json#repository)
types.ts              # AddOptions, ConflictMode, TreeEntry
commands/add.ts       # `add <pkg> [folder]` flow with clack intro/spinner/outro
lib/github.ts         # listPackageFiles() via Trees API, fetchRaw(), UnknownPackageError
lib/conflicts.ts      # clack select for skip/overwrite
lib/writer.ts         # mkdir -p + writeFile
```

The CLI reads `apps/cli/package.json#repository.url` at runtime to derive the default `--repo`. To change the published default, change the `repository` field — don't hardcode in source.

## Releases

`release-please-config.json`: single component `foundation`, root `CHANGELOG.md`. Conventional Commit prefixes — `feat`, `fix`, `perf`, `docs` are surfaced; `chore`, `style`, `refactor`, `test`, `ci` are hidden. PR titles are squash-merged into the changelog (see `CONTRIBUTING.md`).
