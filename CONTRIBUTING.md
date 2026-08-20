# Contributing to @libar-dev/architect

We welcome contributions! This guide covers how to get started.

## Prerequisites

- **Node.js** >= 20.0.0 (minimum; `.node-version` pins 22 for local dev)
- **pnpm** (recommended package manager)
- ESM project (`"type": "module"`)

## Getting Started

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/<your-username>/architect.git
cd architect
pnpm install
pnpm build && pnpm test
```

## Development Workflow

```bash
pnpm build              # Compile TypeScript
pnpm dev                # Watch mode
pnpm test               # Run all tests
pnpm test <pattern>     # Run specific tests
pnpm typecheck          # Type check without emit
pnpm lint               # ESLint
pnpm format:check       # Prettier check
```

## Testing Policy

This package enforces **strict Gherkin-only testing**:

- All tests are `.feature` files with step definitions in `.steps.ts`
- No `.test.ts` files — exception-free policy
- Edge cases use `Scenario Outline` with Examples tables
- Feature files live in `tests/features/`, step defs in `tests/steps/`

A package that generates documentation from `.feature` files should demonstrate that Gherkin is sufficient for testing.

## Git Hooks

The project uses [Husky](https://typicode.github.io/husky/) with lint-staged.
Hooks install automatically via the `prepare` script on `pnpm install` — no
manual setup needed. Both call composite scripts in `package.json` (`pnpm
ci:pre-commit` / `pnpm ci:pre-push`), so you can run either gate by hand.

**pre-commit** (fast, staged-scoped):

- `lint-staged` — ESLint `--fix` on staged root-scoped `.ts` (`architect.config.ts`
  plus `.ts` under `scripts/` / `tests/`; package source is linted at pre-push)
  and Prettier `--write` on every staged `.ts`/`.json`/`.md`/`.yml`/`.yaml`
- `check:build` then `architect-guard --staged` — a dist-freshness gate (loud-fails
  if `src/` is ahead of `dist/`, so the FSM guard never runs from stale compiled
  code) followed by the FSM process guard on the staged transition

**pre-push** (full correctness gate, mirrors CI):

- `pnpm ci:verify` — build, format:check, lint, typecheck (+ dogfood), test
  (+ dogfood), `validate:all`, the No-BC suppression guard, the skill-symlink
  check, the dangling-reference gate, the `@libar-dev/architect` bin smoke (run
  via the umbrella package's `test` script), and the subtractive dependency audit
- `pnpm docs:check` — projection determinism (re-renders in place, writes
  nothing, fails on drift from the PatternGraph)

Never bypass a hook with `--no-verify` — the No-BC doctrine treats the gates as
load-bearing. If a hook is wrong, fix the hook (the logic is in `package.json`).

## Making Changes

1. Create a branch from `main`
2. Make your changes
3. Run the full validation suite:
   ```bash
   pnpm build && pnpm test && pnpm typecheck && pnpm lint && pnpm format:check
   ```
4. Commit with a clear message describing the "why"

## Pull Requests

- PRs target the `main` branch
- CI runs on Node.js 20 (the `pnpm ci:verify` gate, plus the docs-determinism
  diff and the projection perf baseline)
- All checks must pass; locally, `pnpm ci:pre-push` runs the same gate
- We review for consistency with the source-first, event-sourced architecture —
  the PatternGraph as the single read model (ADR-006) projected into docs / CLI
  / MCP / Studio. See the `architect-base` skill and `architect/decisions/`.

## Reporting Issues

- Use [GitHub Issues](https://github.com/libar-dev/architect/issues)
- For security vulnerabilities, see [SECURITY.md](SECURITY.md)

## Code of Conduct

Be respectful, constructive, and inclusive. We follow the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).
