# Contributing Guide

Welcome! This monorepo uses **Conventional Commits** + Squash & Merge so PR titles drive the changelog.

## Workflow

1. **Branch** off `main` (e.g. `feat/cli-add-command`).
2. **Commit** freely on your branch — messages will be squashed away.
3. **PR title** must follow `type(scope): description` (lowercase). The squash-merge commit becomes the changelog entry.
4. **Squash & Merge** once approved.

## PR title format

We follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

### Types

| Type | Bump | Visible in changelog |
|------|------|----------------------|
| `feat` | minor | yes |
| `fix` | patch | yes |
| `perf` | patch | yes |
| `docs` | none | yes |
| `refactor`, `style`, `test`, `ci`, `chore` | none | hidden |

### Scopes (required)

Scopes match a workspace name or a cross-cutting concern. The PR-title linter will reject titles without a scope.

**Workspace scopes:**

| Scope | Path | Notes |
|-------|------|-------|
| `cli` | `apps/cli` | `@foundation/cli` — shadcn-style `add` command |
| `base` | `packages/base` | `@foundation/base` — VS Code-derived utilities |
| `platform` | `packages/platform` | `@foundation/platform` — depends on `base`; log + future services |
| `eslint-config` | `packages/eslint-config` | shared flat ESLint config |

**Cross-cutting scopes:**

| Scope | Use for |
|-------|---------|
| `deps` | dependency bumps |
| `repo` | root configs (`tsconfig.base.json`, `turbo.json`, workspace files) |
| `ci` | GitHub Actions, release-please config |
| `docs` | `README`, `CLAUDE.md`, `CONTRIBUTING.md` |

### Examples

- `feat(cli): scaffold @foundation/cli with add command`
- `feat(base): copy observableInternal from upstream vscode`
- `fix(platform): correct exports map so subpath imports resolve`
- `chore(repo): align tsconfig with vscode (target ES2024, experimentalDecorators)`
- `chore(deps): bump eslint-plugin-import-x to ^4.16`

> The scope must correspond to a real package or known cross-cut. Made-up scopes break release-please grouping.

## Local checks before opening a PR

```bash
pnpm install
pnpm build         # turbo orchestrates ^build deps
pnpm -r lint       # eslint flat config across all packages
pnpm -r typecheck  # tsc --noEmit per package (where the script exists)
```

There is **no test runner** wired up yet. If your change adds tests, also add the runner (vitest/node:test) and update this guide.

## Working on `@foundation/base` (VS Code source)

Most files under `packages/base/src/common/...` are copied verbatim from upstream VS Code (`vscode/src/vs/base/common/...`, MIT-licensed). Conventions:

- **Don't reformat** copied files. Keep them byte-identical so future syncs are clean diffs.
- **Pull missing siblings** when adding a new file (`arrays.ts` → also copy `arraysFind.ts`, `cancellation.ts`, etc., as needed).
- **Decorator and `const enum` patterns** match VS Code on purpose. The shared `tsconfig.base.json` sets `experimentalDecorators: true` and `preserveConstEnums: true` so VS Code source compiles unchanged across our package boundary.
- **Imports use `.js`** even though sources are `.ts` — required by `module: NodeNext` + `verbatimModuleSyntax`.

## Working on the CLI

The `add` command discovers files via the GitHub Trees API. To dogfood locally:

```bash
pnpm -F @foundation/cli build
mkdir /tmp/scratch && cd /tmp/scratch
node ~/path/to/foundation/apps/cli/dist/index.js add base foundation-base
```

Default `--repo` comes from `apps/cli/package.json#repository.url`. Override with `--repo owner/name --ref branch-or-tag`. Set `GITHUB_TOKEN` in the environment to avoid the 60 req/hr anonymous rate limit.

## Releases

We use [release-please](https://github.com/googleapis/release-please).

1. Every merge to `main` updates a single open "Release PR" with batched changes.
2. Merging that Release PR cuts a tag, updates `CHANGELOG.md`, and bumps `package.json`.

## Best practices

- **Imperative mood** in PR titles: "add feature" not "added feature".
- **One PR = one logical change.** Mixing `feat` + `fix` makes reverts painful.
- **Lint your PR title** mentally before opening: `type(scope): description`, lowercase, no period.
