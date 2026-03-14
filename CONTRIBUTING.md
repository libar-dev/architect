# Contributing to @libar-dev/architect

We welcome contributions! This guide covers how to get started.

## Prerequisites

- **Node.js** >= 18.0.0
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

## Pre-commit Hooks

The project uses Husky with lint-staged. On every commit:

- ESLint + Prettier auto-fix on staged `.ts` files
- Prettier on staged `.json`, `.md`, `.yml` files

These run automatically — no manual setup needed after `pnpm install`.

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
- CI runs on Node.js 18, 20, and 22
- All checks (build, test, typecheck, lint, format) must pass
- We review for consistency with the four-stage pipeline architecture (Scanner, Extractor, Transformer, Codec)

## Reporting Issues

- Use [GitHub Issues](https://github.com/libar-dev/architect/issues)
- For security vulnerabilities, see [SECURITY.md](SECURITY.md)

## Code of Conduct

Be respectful, constructive, and inclusive. We follow the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).
