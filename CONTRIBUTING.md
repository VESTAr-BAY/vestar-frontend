# Contributing to VESTAr

Thank you for taking the time to contribute. This document covers everything you need to get started.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 22 | [nodejs.org](https://nodejs.org) |
| pnpm | ≥ 10 | `npm install -g pnpm` |
| Git | any | [git-scm.com](https://git-scm.com) |

**Recommended IDE:** VS Code or any editor with a [Biome extension](https://biomejs.dev/guides/editors/first-party-plugins/).

---

## Getting Started

```bash
# 1. Clone the repository
git clone <repo-url>
cd VESTAr

# 2. Install dependencies
pnpm install

# 3. Start the dev server
pnpm dev
```

The app will be available at `http://localhost:5173`.

---

## Project Structure

```
VESTAr/
├── src/
│   ├── features/        # Feature modules (each self-contained)
│   ├── components/      # Shared UI components
│   ├── hooks/           # Shared custom hooks
│   ├── test/
│   │   └── setup.ts     # Vitest global setup
│   ├── App.tsx
│   └── main.tsx
├── public/
├── biome.json           # Linter + formatter config (replaces ESLint + Prettier)
├── vite.config.ts       # Vite + Vitest config
└── tsconfig.app.json
```

---

## Development Workflow

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start local dev server with HMR |
| `pnpm build` | Type-check and build for production |
| `pnpm preview` | Preview the production build locally |
| `pnpm check` | Run Biome lint + format + import checks |
| `pnpm check:fix` | Auto-fix all Biome issues |
| `pnpm lint` | Lint only |
| `pnpm lint:fix` | Auto-fix lint issues |
| `pnpm format` | Auto-format all files |
| `pnpm test` | Run all tests once |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with coverage report |

### Before Opening a PR

Run these in order and make sure all pass:

```bash
pnpm check:fix    # auto-fix formatting and lint
pnpm test         # all tests must pass
pnpm build        # type-check + production build must succeed
```

---

## Code Standards

This project uses **Biome** for both linting and formatting. There is no separate Prettier or ESLint config.

Key rules enforced:

- Double quotes for strings
- 2-space indentation, 100-character line width
- Semicolons required
- Imports auto-organized on save (via Biome assist)
- `target="_blank"` requires `rel="noopener"` or `rel="noreferrer"`
- Button elements require an explicit `type` attribute

**Immutability** — never mutate objects or arrays directly:

```typescript
// Wrong
user.name = "Alice";

// Correct
const updated = { ...user, name: "Alice" };
```

**File size** — keep files under 800 lines; extract utilities when a file grows large.

**No `console.log`** in committed code. Use proper error handling instead.

---

## Testing

- Minimum **80% coverage** across lines, functions, branches, and statements.
- Follow **Test-Driven Development**: write the test first, then implement.
- Tests live next to the code they test: `MyComponent.test.tsx` beside `MyComponent.tsx`.
- Use `@testing-library/react` for component tests — test behavior, not implementation details.

```bash
# Run with coverage report
pnpm test:coverage

# Open interactive UI
pnpm test:watch --ui
```

---

## Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org):

```
<type>: <short description>

<optional body>
```

| Type | Use when |
|------|----------|
| `feat` | Adding a new feature |
| `fix` | Fixing a bug |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `docs` | Documentation only changes |
| `chore` | Build process, dependency updates, tooling |
| `perf` | Performance improvements |
| `ci` | CI/CD configuration changes |

Examples:

```
feat: add user authentication flow
fix: resolve count reset on page refresh
docs: update contributing guide with test instructions
```

---

## Pull Request Process

1. **Branch** off `main` using a descriptive name: `feat/auth-flow`, `fix/count-reset`
2. **Keep PRs focused** — one feature or fix per PR
3. **Pass all checks** — `pnpm check`, `pnpm test`, `pnpm build` must all succeed
4. **Write a clear description** — explain the *why*, not just the *what*
5. **Request a review** — at least one approval required before merging
6. **Squash merge** into `main` to keep history clean

---

## Questions?

Open an issue or start a discussion in the repository. We're happy to help.
