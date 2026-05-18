# Project Constitution: `@libar-dev/architect-*`

**Project**: Engineering-lifecycle platform for AI-assisted development
**Generated**: 2026-05-17
**Source**: `docs/reverse-engineering/` + `AGENTS.md` + `architect/decisions/`

This constitution captures the load-bearing principles, doctrine, and invariants that govern every change to the codebase. It is the supreme law of the repository — every spec, plan, and implementation must conform to it. Decisions that conflict with this constitution require a new ADR before any code change.

---

## I. Mission

`@libar-dev/architect-*` is an **engineering-lifecycle platform for AI-assisted development**. It does three things:

1. **Annotates** TypeScript source and Gherkin features with the `@architect-*` JSDoc + tag grammar.
2. **Projects** those annotations into a typed, in-memory `PatternGraph` plus on-disk documentation artifacts.
3. **Enforces** a four-tier delivery lifecycle (idea → candidate → plan → design → executable) via an FSM-aware ProcessGuard and deterministic CI gates.

The platform's **users are developers and the AI coding agents acting on their behalf**. There is no end-user product, no UI, no hosted service, no database.

The complementary methodology — `@libar-dev/architect-spec` (`formal-spec/`) — graduates to a citable v1.0 package separate from this reference implementation.

---

## II. Core Principles

### Principle 1 — Source-First (ADR-003)

Pattern identity travels with the code, **not** a sidecar database. Annotations (`@architect-pattern`, `@architect-implements`, Gherkin `@architect-*` tags) are colocated with the implementation and change in the same commit. Generated docs and queryable models are projections of the same single source: annotated production code + executable Gherkin.

**Implication**: The PatternGraph is rebuildable from source alone. No state of record lives in `docs-live/`, in JSON dumps, or in CI caches.

### Principle 2 — Architect State Is Code

Annotations ARE code. Executable specs (Gherkin features wired to step definitions) ARE code. The single source of truth for "what this codebase actually is" is:

- `@architect-*` JSDoc on production TypeScript files
- `@architect-*` tags on Gherkin features in `tests/features/` and `packages/*/tests/features/`
- Step definitions that execute those features under `@amiceli/vitest-cucumber`

Generated `docs-live/`, CLI `--json` output, and MCP tool responses are **projections** — never the source.

### Principle 3 — Single Read Model (ADR-006)

There is exactly one `PatternGraphAPI` (`createPatternGraphAPI()`). Every read-side consumer — CLI bins, MCP tools, the projection pipeline, ProcessGuard — reads through it. No parallel read paths. No "fast path" caches that bypass the API.

### Principle 4 — Trust Boundary Discipline (ADR-009)

**Parse once at the trust boundary.** Every CLI / MCP input and every cross-package contract is a Zod `strictObject` schema. Once parsed via `parseAtBoundary()`, internal code uses cheap shape checks; it does **not** re-parse.

Inside the projection pipeline, `parseAndProject*` is the only entry point that validates. Internal `project*` functions assume Zod-validated inputs.

### Principle 5 — Deterministic Verdicts (PDR-001)

The platform speaks three verdict words and no others: **`PASS`**, **`BLOCKED`**, **`WARN`**.

- `scope-validate` returns one of these three.
- ProcessGuard severity levels align with these three.
- `arch dangling --strict` exits non-zero on any unresolved reference.

Verdicts must be deterministic: re-running the same gate against the same source produces the same verdict, byte-identical.

### Principle 6 — FSM Lifecycle Enforcement

Patterns flow through a finite state machine: **roadmap → active → completed** (with a deferred branch). Transitions are defined in `validation/fsm/transitions.ts` and enforced by `architect-guard`. The lifecycle is **not** advisory:

- You cannot skip states (no `roadmap → completed` shortcut).
- `completed` patterns are **hard-locked** (`ProtectionLevel = 'hard'`). Modification requires `@architect-unlock-reason "<reason>"`.
- Scope creep on `active` patterns is detected and blocked.

### Principle 7 — Pure-Function Domain Logic

`scope-validate`, `handoff`, and the projection pipeline never invoke the shell, the filesystem, or the network from their domain layer. Git integration is opt-in via `--git` and lives in an adapter layer. This keeps the domain testable and deterministic.

---

## III. Engineering Doctrine (CI-Enforced)

These are non-negotiable; treat as load-bearing.

### A. No-BC (No Backward Compatibility)

Breaking changes are acceptable; backward compatibility is unwanted. The repo is pre-1.0 and accumulated shims become permanent cost.

**Forbidden in production code** (`packages/*/src/`):

- `// eslint-disable*` of any flavour
- `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`
- `@deprecated` markers used as removal-softeners
- Backward-compatibility aliases (re-exporting an old name from a new location)
- Parallel implementations behind feature flags
- Renaming an internal `_var` to silence a warning — delete it instead

Enforced by `architect-local/no-suppression-comments` ESLint rule + `scripts/guard-no-suppressions.mjs`.

If a change breaks consumers, the right move is to **break them and document the migration**, not ship a half-finished compatibility shim.

### B. Zod-First Boundaries

- Every cross-package contract is a Zod schema.
- Every CLI / MCP input is a Zod schema.
- Use **`z.strictObject(...)`** for closed records — never `z.object()` (which is open). Extra properties must fail validation, not silently pass.
- Types flow from schemas: `type X = z.infer<typeof XSchema>` is canonical. Hand-written type aliases that diverge from a schema are bugs.

### C. TypeScript Strictness

Enforced by `tsconfig.base.json` + `tsconfig.architect-base.json`:

- `verbatimModuleSyntax: true` — every type-only import uses `import type`.
- `noUncheckedIndexedAccess: true` — index access returns `T | undefined`.
- `noPropertyAccessFromIndexSignature: true` — use `obj['key']` for index-signature lookups.
- `exactOptionalPropertyTypes: true` — optional properties don't silently accept `undefined`.

No circular imports across packages or within a package's `src/`.

### D. Dependency Direction (Acyclic)

```
architect-core ← architect-projection
architect-core ← architect-guard ← architect-cli
architect-core, architect-projection ← architect-mcp
```

No runtime package depends on the meta package (`@libar-dev/architect`). The meta package has no JS exports — only bin re-exports.

### E. Perf Regression Gate

`architect-projection` ships a CI perf test with a 36-pattern / 108-rule fixture. Drift over `baseline × 1.5` fails the gate. **Profile changes that move the needle; do not suppress the test.**

### F. Coordinated Versioning

All six publishable packages move together via the `fixed` group in `.changeset/config.json`. No package is versioned independently.

---

## IV. Workflow Doctrine

### A. Four-Tier Lifecycle (Minimum Gherkin by Tier)

Specs are minimal at the bottom of the ladder and grow as they mature:

| Tier         | Location           | Soft budget | Required content                                      |
| ------------ | ------------------ | ----------- | ----------------------------------------------------- |
| `idea`       | `architect/specs/` | ≤30 lines   | Invariant-only rules, 6 tags                          |
| `candidate`  | `architect/specs/` | small       | Open questions + single happy-path scenario           |
| `plan`       | `architect/specs/` | medium      | Plan-level scope and dependencies                     |
| `design`     | `architect/specs/` | larger      | Deliverables table, stubs, exhaustive scenarios, ADRs |
| `executable` | `tests/features/`  | as needed   | Wired step definitions; the source of truth           |

When a pattern reaches `executable`, the design spec is **deleted** (Tier-1 specs are ephemeral, ADR-003). Its value transfers to JSDoc annotations + executable Gherkin.

### B. One `@architect-pattern` Per File

Each TypeScript file declares **at most one** `@architect-pattern`. `@architect-implements` is many-to-one (UML realization) — many files can implement one pattern.

### C. Architect State Folders Are Not Compiled

The `architect/` directory holds design artifacts:

- `architect/specs/` — feature specs in tier progression
- `architect/decisions/` — ADRs and PDRs
- `architect/stubs/` — design-level TypeScript stubs (contracts, not implementations)
- `architect/step-stubs/` — stub step definitions
- `architect/releases/` — release notes and roadmap
- `architect/design-reviews/` — design review notes
- `architect/ideations/` — early-stage idea notes

These are parsed by **`@cucumber/gherkin`** at doc-gen + pattern-graph-build time. They are **NOT** compiled by TypeScript, **NOT** linted by step-lint, and **NOT** executed by `@amiceli/vitest-cucumber`. The `tsconfig.json` and `eslint.config.mjs` explicitly exclude them.

### D. Two Gherkin Parsers — Distinguish Them

| Parser                     | What it reads                                             | When it runs                     |
| -------------------------- | --------------------------------------------------------- | -------------------------------- |
| `@cucumber/gherkin`        | Architect state (`architect/specs/`, `formal-spec/`)      | At doc-gen + pattern-graph-build |
| `@amiceli/vitest-cucumber` | Executable specs (`tests/features/`, `packages/*/tests/`) | At test time via vitest          |

Mixing them up causes the most painful "why doesn't my spec work?" debugging in this repo.

### E. Default to CLI; Reach for MCP Only for Bursts

The CLI (`pnpm architect:query -- <verb>`) and MCP server (`mcp__architect__*`) have full parity across verbs (`overview`, `context`, `scope-validate`, `dep-tree`, `files`, `rules`, `handoff`, etc.). MCP names use underscores end-to-end. **Default to the CLI; reach for MCP only when bursting ≥5 verbs in close sequence.**

---

## V. Quality Gates

A change cannot land unless **all** of these pass:

1. **`pnpm typecheck`** — strict TypeScript across the workspace.
2. **`pnpm test`** — 2828+ tests across the 5 publishable packages.
3. **`pnpm validate:all`** — DoD + anti-pattern detection.
4. **`pnpm architect:guard --staged`** — FSM enforcement at pre-commit.
5. **`pnpm format:check`** — Prettier.
6. **`pnpm guard:no-suppressions`** — no `// eslint-disable*`, no `@ts-*ignore`, no BC shims.
7. **Perf regression gate** — `architect-projection` latency within `baseline × 1.5` on the 36-pattern / 108-rule fixture.

CI workflow files (`.github/workflows/`) are currently absent in this worktree — committing them is tracked as Phase B in `technical-debt-analysis.md` (Item #5).

---

## VI. Decision Records

Substantive architectural decisions live in `architect/decisions/`. Particularly load-bearing:

- **ADR-003** — Source-First Pattern Architecture
- **ADR-005** — Codec / Renderer Separation
- **ADR-006** — Single Read Model
- **ADR-007** — Coordinated Taxonomy Redesign
- **ADR-009** — Projection Trust Boundary
- **PDR-001** — Session Workflow Commands

Read the relevant ADR before changing anything in its area. Decisions are amended via a **new** ADR, never by editing the old one.

---

## VII. Out of Scope (Permanently)

The platform deliberately does not address:

- HTTP services, user authentication, multi-tenant hosting.
- Frontend / UI / mobile.
- Persistent storage (database, KV, object storage).
- Cloud infrastructure / IaC / deployment automation.
- Telemetry / analytics / usage tracking.
- Cross-language support — TypeScript only. Other-language projects can adopt the methodology via `formal-spec/`; they cannot import this implementation.

Proposals that require any of the above must first amend Section VII via a new ADR.

---

## VIII. Operating Procedure for AI Agents

Every architect-scoped session in this repo **MUST** load two kernel skills before any other work:

1. **`architect-session-router`** — resolves session intent (planning / design / implement / refactor / review / handoff) and routes to the matching session skill.
2. **`architect-data-api`** — canonical reference for the CLI + MCP surface: verb shapes, deterministic gates (`scope-validate`, `query isValidTransition`, `arch dangling --strict`), JSON shapes, parity table, and known quirks.

Load both before running any architect-scoped `Read` / `Glob` / `Grep`, before invoking any other architect-_ session skill, and before calling `pnpm architect:query` or any `architect\__` MCP tool. **The Data API (CLI / MCP) is the canonical source of truth about patterns, specs, FSM state, and executable features — file scanning is not.**

---

## IX. Amendment Process

This constitution is amended via:

1. A new ADR in `architect/decisions/` describing the change and rationale.
2. A PR that updates this file and references the ADR.
3. Maintainer approval (CODEOWNERS).

Sections I (Mission) and II (Core Principles) require **two** approving maintainers. Other sections require one.

The constitution is **never** edited silently. Every line is load-bearing.
