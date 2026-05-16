# `examples/self-host`

This is the Libar Architect toolchain applied to itself — a working `architect.config.ts`, a real spec/decision/stub corpus, and the smoke + integration tests that exercise every CLI surface against that corpus. Treat it as the **reference for setting up Architect in your own project**.

> **Note:** This example is mid-migration from its original location (`packages/architect/` in the `architect-studio` monorepo). Several path references — in `architect.config.ts`, in `tsconfig.json`, in `scripts/`, in tests — still assume the old layout (`../architect-core/…`). Fixing these is part of the planned polish work; see [`REMAINING-WORK.md`](../../REMAINING-WORK.md) at the repo root.

## What's inside

| Path                     | Purpose                                                                 |
| ------------------------ | ----------------------------------------------------------------------- |
| `architect/`             | The content corpus — specs, decisions, releases, stubs, design reviews. |
| `architect.config.ts`    | The toolchain configuration.                                            |
| `scripts/`               | Smoke tests (`workspace-smoke.ts`), export verifier, lint scripts.       |
| `tests/`                 | Vitest BDD features, steps, fixtures, support.                          |
| `docs/`, `docs-sources/` | Generated and source documentation.                                     |
| `CHANGELOG.md`           | Historical changelog (carried from the v1 monolith).                    |

## When you'd reach for this

- You're setting up Architect in a new project and want a known-good `architect.config.ts` to copy.
- You want to see what an `architect/decisions/*.feature` looks like in practice (these are real ADRs).
- You're debugging a CLI / generator and want a non-trivial corpus to reproduce against.

## Quick start (post-polish)

```bash
pnpm install
pnpm --filter architect-self-host-example smoke
pnpm --filter architect-self-host-example test
```
