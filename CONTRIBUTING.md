# 👷 Contributing Guide
Welcome! To keep our project history clean and to automate our release process, we use **Conventional Commits** paired with a Squash and Merge workflow.

## 🚀 The Workflow in a Nutshell
1. Branch: Create a feature branch from main.
2. Commit: Work on your changes. Don't worry about commit names on your branch; they will be squashed later.
3. PR Title: Give your Pull Request a title following the Type(Scope) format.
4. Merge: Once approved, we use Squash and Merge to move your changes into main.

## 📝 Pull Request Naming Standard
We use the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. Your PR Title becomes the final entry in our changelog.

**Format**: `type(scope): description` (all lowercase)

### 1. The Types
* `feat`: A new feature (triggers minor version bump).
* `fix`: A bug fix (triggers patch version bump).
* `perf`: A code change that improves performance.
* `refactor`: Code refactoring.
* `test`: Test additions or changes.
* `ci`: Changes to GitHub Actions, linting, or deployment scripts.
* `docs`: Documentation only changes.
* `chore`: Maintenance (updating dependencies, etc.). Hidden from changelog.

### 2. The Scopes (Required)
Scopes match monorepo package or app names. This is **required** — the PR title linter will reject PRs without a scope.

**Apps:**
* `cli`: shadcn-style CLI for distributing `@foundation/*` package source (`apps/cli`)

**Packages:**
* `base`: VS Code-derived utility library — arrays, async, event, lifecycle, observable, etc. (`packages/base`)
* `platform`: depends on `base`; houses the log subsystem and other platform services (`packages/platform`)
* `eslint-config`: shared flat ESLint config (`packages/eslint-config`)

**Feature-based scopes** (for cross-cutting changes):
* `deps`, `repo`, `infra`, etc.

**Examples:**
* `feat(cli): add --skip-existing flag`
* `fix(base): resolve missing import in observableInternal`
* `feat(platform): add log service implementation`
* `chore(repo): align tsconfig with vscode (target ES2024)`
* `chore(deps): update typescript to v5.8`

> **Tip:** The scope must match a real package path for release-please to associate the change correctly.

## 📦 Automated Releases
We use `Release Please`.
1. Every time a PR is merged to `main`, a "Release PR" is automatically updated/created by a bot.
2. This "Release PR" batches all recent changes and prepares the next version number.
3. We merge this Release PR periodically (e.g., once a week or after a big milestone) to officially tag a new version and update the `CHANGELOG.md`.

## Best Practices
* Use the Imperative Mood: Write the description as if you are giving a command: "add feature" instead of "added feature."
* One PR = One Task: Try not to mix a feat and a fix in the same PR. This makes it easier to revert changes if something goes wrong.
* Check the Linter: A GitHub Action will check your PR title. If it's red, please rename your PR to match the standard!

## Why we do this
> "We write code for machines, but we write history for humans. A clean git log is the best documentation a project can have."

Thank you for contributing to our project! Your adherence to these guidelines helps us maintain a clean and efficient codebase.
