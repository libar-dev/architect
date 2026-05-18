# Review Scope

## Target

Full multi-phase code review of the `@libar-dev/architect` package family — a six-package monorepo for an AI-assisted engineering lifecycle platform (canonical model, projection pipeline, policy/process guard, CLI, MCP server, and meta-package).

Repository root: `/Users/darkomijic/dev-projects/architect/`
Workspace manifest: `pnpm-workspace.yaml` (`packages/*`, `formal-spec/`)
Status: v2.0 pre-release (each split package at `2.0.0-pre.1`; root is `private: true` at `0.0.0`).

## Package family (review order — architecturally significant)

Dependency direction (acyclic): `core ← projection`, `core ← guard ← cli`, `core, projection ← mcp`. The meta package re-exports all bins and depends on every split.

| #   | Package                           | SLOC src/ | Files | Tests | Purpose                                                                                                                                                         |
| --- | --------------------------------- | --------- | ----- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `@libar-dev/architect-core`       | 12,360    | 106   | 51    | Canonical model, ingestion, graph build, scanner/extractor, taxonomy, config, read API (`PatternGraphAPI`), utils.                                              |
| 2   | `@libar-dev/architect-projection` | 15,238    | 145   | 83    | Fragment-based projection pipeline — Named Domain Fragments (Zod), block types, renderers (compact-text, json, markdown, ui). **Has a CI perf gate.**           |
| 3   | `@libar-dev/architect-guard`      | 9,135     | 38    | 5     | Policy, validation, process guard, step-lint, DoD, anti-pattern detection, git helpers.                                                                         |
| 4   | `@libar-dev/architect-cli`        | 3,870     | 26    | 9     | Thin composition root — bins for `architect`, `architect-generate`, `architect-guard`, `architect-validate`, `architect-lint-steps`, `architect-lint-patterns`. |
| 5   | `@libar-dev/architect-mcp`        | 1,630     | 9     | 5     | MCP server (18 tools per package.json description / 21 per AGENTS.md), tool registry, file watcher, pipeline session. Bin: `architect-mcp`.                     |
| 6   | `@libar-dev/architect`            | ~7        | 0     | 0     | Meta-package — bin-only re-export (no JS exports).                                                                                                              |

Total: ~42,000 source SLOC; 153 test files across the family.

## Engineering doctrine (CI-enforced — load-bearing for review judgments)

These are not "best practices, take them or leave them"; they are the standards review findings must respect.

- **No-BC (no backward compatibility).** Pre-1.0; breaking changes are preferred over compat shims. New code may not introduce `// eslint-disable*`, `@ts-ignore`, `@ts-expect-error`, `@deprecated`-as-soft-removal, BC aliases, or `_var` rename hacks. The repo ships a `guard:no-suppressions` script that enforces this. **Reviewer note:** Findings that recommend deprecation aliases or "for backwards compatibility" shims are bad recommendations for this codebase. Recommend deletion, not soft-removal.
- **Zod-first boundaries.** Every cross-package contract and CLI/MCP input boundary is a Zod schema using `z.strictObject(...)` (not `z.object()`). Types flow from schemas via `z.infer`. Parse once at the trust boundary.
- **TypeScript strictness.** `verbatimModuleSyntax`, `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature` (architect-base), `exactOptionalPropertyTypes`. No circular imports across or within packages.
- **Perf regression gate** in `architect-projection` (36-pattern / 108-rule fixture, `baseline × 1.5`). Performance findings here have a concrete budget to measure against.
- **Architect State is Code.** `@architect-*` JSDoc annotations + executable Gherkin tags are the single source of truth; generated docs and pattern graphs are projections.

## Phase plan (per package, sequential)

For each package, in order:

1. **Phase 1 — Code Quality & Architecture** (parallel: `code-reviewer` + `architect-review`) → consolidate.
2. **Phase 2 — Simplification & Cleanup** (parallel: `code-simplifier:code-simplifier` + `codebase-cleanup:code-reviewer`) → consolidate. _(Replaces the orchestrator's default Security+Performance phase per user instruction.)_
3. **Phase 3 — Testing & Documentation** (parallel: test-coverage + documentation-architect agents) → consolidate.
4. **Phase 4 — Best Practices & Standards** (parallel: framework/language + CI/DevOps agents) → consolidate.
5. **Phase 5 — Per-package consolidated report** with severity-ranked findings and recommended action plan.

After all six packages complete, produce a **master aggregate report** spanning the family.

## Output file layout

```
.full-review/
├── 00-scope.md                             # this file
├── state.json                              # orchestrator state
├── architect-core/
│   ├── 01-quality-architecture.md
│   ├── 02-simplification-cleanup.md
│   ├── 03-testing-documentation.md
│   ├── 04-best-practices.md
│   └── 05-package-report.md
├── architect-projection/
│   └── ... (same five files)
├── architect-guard/
├── architect-cli/
├── architect-mcp/
├── architect/
└── 99-master-report.md                     # aggregated family-wide synthesis
```

## Flags

- Security Focus: no (Phase 2 has been swapped from security/perf to simplification/cleanup per user instruction; security/perf concerns surface incidentally via the other phases)
- Performance Critical: no (with one exception — `architect-projection` has a CI perf gate and any perf finding there must reference the `baseline × 1.5` budget)
- Strict Mode: no
- Framework: Node.js 20+ / TypeScript 5.8 / pnpm workspace / Vitest 4 / Zod 4 / pure ESM (`"type": "module"`)
