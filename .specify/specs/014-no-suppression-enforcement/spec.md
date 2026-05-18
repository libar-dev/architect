# Feature: No-Suppression / No-BC Enforcement

## Status
✅ COMPLETE — Custom ESLint rule + guard script reject every form of suppression and backward-compatibility shim in `packages/*/src/`; doctrine documented in AGENTS.md §"No-BC".

## Overview

The platform's pre-1.0 doctrine is **No-BC** (no backward compatibility): breaking changes are acceptable, accumulated shims become permanent cost, and any mechanism that "softens" a removal is forbidden in production code. This spec captures the runtime enforcement of FR-014 — a custom ESLint rule (`architect-local/no-suppression-comments`) plus a guard script (`scripts/guard-no-suppressions.mjs`) that together reject every form of suppression: `// eslint-disable*`, `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, and `@deprecated`-as-shim. Backward-compatibility aliases (re-exporting an old name from a new location, parallel implementations behind feature flags) are forbidden by the same doctrine; the rule plus reviewer discipline catch them.

The enforcement surface is invisible to the user when nothing is wrong, and produces a single clear error at PR time when something is. The constitution treats this as a quality gate (Section V item #6: `pnpm guard:no-suppressions`).

The rule scope is **production code only**: `packages/*/src/**`. Test files, design stubs, and tooling scripts are intentionally exempt — the doctrine targets shipping shims, not testing scaffolds.

## User Stories

- As an architect maintainer, I want a custom ESLint rule to reject `// eslint-disable` so engineers cannot silence other rules without an ADR.
- As an AI-augmented developer, I want the guard script to fail my PR if I add `@ts-expect-error` so I am forced to fix the type instead of papering over it.
- As an AI coding agent, I want a clear, machine-readable error so I do not silently introduce a shim while completing a task.
- As an architect maintainer, I want `@deprecated`-as-shim to be flagged so the codebase keeps its no-shim posture (legitimate `@deprecated` notices in evolving public APIs go through a different review path).
- As a CI maintainer, I want a single command (`pnpm guard:no-suppressions`) that returns non-zero on any violation so this gates merges.

## Acceptance Criteria

- [x] ESLint rule `architect-local/no-suppression-comments` is registered in `eslint.config.mjs` (434 lines).
- [x] Rule rejects `// eslint-disable`, `// eslint-disable-line`, `// eslint-disable-next-line`, and any variant.
- [x] Rule rejects `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck` JSDoc / line comments.
- [x] Rule rejects `@deprecated` JSDoc when used as a removal-softener (paired with no actual removal plan).
- [x] Rule scope is exactly `packages/*/src/**`; test files and stubs are exempt.
- [x] Guard script `scripts/guard-no-suppressions.mjs` produces non-zero exit code on any violation.
- [x] `pnpm guard:no-suppressions` is wired in root `package.json` and listed as a quality gate.
- [x] Doctrine is documented in AGENTS.md §"No-BC" so the rule's "why" is discoverable.
- [x] Renaming an internal `_var` to silence an unused-variable warning is flagged; doctrine says delete instead.
- [x] Re-exporting an old name from a new location (BC alias) is forbidden by review discipline backed by the rule.

## Technical Requirements

- **Surface**: custom ESLint plugin `architect-local` (workspace-local) + Node script `scripts/guard-no-suppressions.mjs`.
- **Rule shape**: AST visitor over `Comment` nodes; pattern match on suppression prefixes; report at the comment's location.
- **Scope filter**: `files: ['packages/*/src/**']` in `eslint.config.mjs`.
- **Exit semantics**: 0 on clean; 1 on any violation. JSON output via standard ESLint `--format json`.
- **Performance budget**: runs as part of `pnpm lint`; no additional budget — AST traversal is linear in source size.
- **Invariants**:
  - Suppression comments produce **errors**, never warnings.
  - Test directories (`tests/**`, `**/__tests__/**`, `**/*.test.ts`) are exempt.
  - The rule is **never** disabled with `// eslint-disable architect-local/no-suppression-comments` — that is itself a violation.

## Implementation Status

**Completed:**
- ✅ Custom ESLint rule registered in `eslint.config.mjs`.
- ✅ Guard script at `scripts/guard-no-suppressions.mjs`.
- ✅ Doctrine documented in AGENTS.md §"Engineering doctrine" → "No-BC".
- ✅ Wired as a quality gate in the constitution.
- ✅ Re-enforced at every PR via the `tech-debt-analysis.md` doctrinal posture: *"the code base 'deletes don't defers.'"*

## Dependencies

- ESLint (workspace lint runner).
- Node.js runtime (for the guard script).
- No runtime dependency on `architect-core` — this is tooling, not graph logic.

## Related Specifications

- AGENTS.md §"No-BC".
- Constitution §III.A (No-BC) — this spec is the runtime realization of that section.
- `technical-debt-analysis.md` doctrine note: traditional placeholder/TODO smells are deliberately *absent* by policy.
- `functional-specification.md` FR-014, NFR-003.
- Spec 013 (`pre-commit-guard`) — the process-guard runs alongside this in pre-commit but addresses a different surface (FSM, not source-level suppression).
