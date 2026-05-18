---
workflowType: epics
project_name: "@libar-dev/architect-* (architect package family)"
date: "2026-05-17"
synthesize_mode: "yolo"
inputDocuments:
  - docs/reverse-engineering/functional-specification.md
  - docs/reverse-engineering/business-context.md
  - docs/reverse-engineering/technical-debt-analysis.md
  - docs/reverse-engineering/integration-points.md
coverage_score: 72
---

# Architect — Epics & Stories

> **A note on shape.** Most of these FRs are **already shipped** in the current `2.0.0-pre.1` codebase. This epic breakdown reframes them as the work that *was* done — a useful planning artifact for new contributors orienting themselves, for the v1.0 release punch list, and as a forward-looking refactor / completion backlog. Story priorities reflect each FR's role in the platform's identity, not implementation order.

---

## Epic 1: PatternGraph & Read Model

**Priority:** P0
**Description:** Build the canonical typed read model from annotated TypeScript source + Gherkin features. This is the platform's core abstraction; everything else projects from it. ADRs: 003 (source-first), 006 (single read model).
**Bounded context:** `@libar-dev/architect-core`.

### Story 1.1: Scan annotated sources and build PatternGraph (FR1)

**As an** AI-augmented developer, **I want** the platform to scan my annotated TypeScript + Gherkin and produce a typed PatternGraph in memory, **so that** my AI agent has a stable model of "what this codebase is" without re-reading every file.
**Priority:** P0
**Acceptance Criteria:**
- [ ] `buildPatternGraph` ingests annotated `.ts` + Gherkin specs and produces a typed `PatternGraph`.
- [ ] Top-level `PatternGraph` exposes `patterns[]`, `tagRegistry`, `byStatus`, `byNormalizedStatus`, `byMaturity`, `byPhase`, `byQuarter`, `byRole`, `bySourceType`, `byProductArea`, `counts`, `relationshipIndex`, `archIndex`, `featureParseFailures`.
- [ ] PascalCase pattern names enforced via `PatternIdentifier` regex `^[A-Z][A-Za-z0-9]+$`.
- [ ] Pattern IDs match `pattern-[a-f0-9]{8}`.
- [ ] Malformed specs land in `featureParseFailures` rather than being silently dropped.

### Story 1.2: Validate inputs at the trust boundary (FR2)

**As an** AI coding agent, **I want** every CLI/MCP input validated at one trust boundary so I can rely on internal types being correct without re-validating.
**Priority:** P0
**Acceptance Criteria:**
- [ ] `parseAtBoundary` is the canonical input gate.
- [ ] Every cross-package contract is a `z.strictObject` — unknown keys fail validation.
- [ ] CLI/MCP boundaries parse exactly once; internal `project*` helpers do not re-validate.
- [ ] Failed validation surfaces a structured `BoundaryParseError` with Zod issue paths.

### Story 1.3: Expose the graph through `PatternGraphAPI` (FR3)

**As an** AI-augmented developer, **I want** a stable typed read API so my tooling can query patterns without coupling to the build pipeline.
**Priority:** P0
**Acceptance Criteria:**
- [ ] `createPatternGraphAPI` returns the read API surface.
- [ ] Helpers: `getPatternName`, `findPatternByName`, `findPatternParseFailure`, `getCanonicalRelationshipIndex`, `getRelationshipsForPattern`, `allPatternNames`, `resolveRoleDefinition`, `suggestPattern`.
- [ ] Architecture helpers: `computeNeighborhood`, `compareContexts`.
- [ ] Inventory: `aggregateTagUsage`, `buildSourceInventory`, `findOrphanPatterns`.

### Story 1.4: Tolerant ingestion of malformed specs (FR16)

**As an** AI-augmented developer, **I want** malformed specs to surface in `featureParseFailures` rather than disappearing, **so that** I can debug spec issues without re-scanning silently.
**Priority:** P1
**Acceptance Criteria:**
- [ ] Parse failures appear on `PatternGraph.featureParseFailures` with location + reason.
- [ ] The pipeline continues past a single malformed file (no fatal abort).
- [ ] `architect diagnostics` surfaces these failures.

---

## Epic 2: Projection Pipeline & Rendering

**Priority:** P0
**Description:** Project the PatternGraph into typed Zod-validated Fragments and render them as markdown / JSON / compact output. ADRs: 005 (codec/renderer separation), 009 (projection trust boundary).
**Bounded context:** `@libar-dev/architect-projection`.

### Story 2.1: Implement the fragment-based projection pipeline (FR4)

**As an** AI coding agent, **I want** every projection to produce a typed Fragment so I can consume canonical shapes rather than parsing markdown.
**Priority:** P0
**Acceptance Criteria:**
- [ ] Every Fragment is a `z.strictObject` with a `kind: z.literal('…')` discriminator.
- [ ] `project*` functions construct typed fragments directly; `parseAndProject*` is the raw-input boundary.
- [ ] Renderers transform fragments to markdown / JSON / compact without re-deriving from source.
- [ ] Codec/renderer separation enforced (ADR-005): codecs are pure functions of `(PatternGraph) → RenderableDocument`; renderers consume IR only.

### Story 2.2: Maintain perf budget against the canonical fixture (NFR4)

**As an** Architect maintainer, **I want** median projection latency to stay within `baseline × 1.5` on the 36-pattern / 108-rule fixture, **so that** drift fails the gate before it hits consumers.
**Priority:** P0
**Acceptance Criteria:**
- [ ] CI perf test runs on every PR.
- [ ] Fixture: 36 patterns, 108 rules.
- [ ] Drift over `baseline × 1.5` median latency fails the gate.
- [ ] Profiling instructions documented (Node `--prof` + `--prof-process`).

### Story 2.3: Enforce projection trust boundary (NFR2 / ADR-009)

**As an** Architect maintainer, **I want** `parseAndProject*` to be the only entrypoint that parses raw input, **so that** hot paths never re-walk Zod objects.
**Priority:** P0
**Acceptance Criteria:**
- [ ] Public projection entrypoints renamed so exported names match fragment kinds.
- [ ] Markdown renderers escape labels, validate URL schemes, reject protocol-relative targets.
- [ ] Contract-freeze tests protect canonical public entrypoints.

---

## Epic 3: CLI & MCP Surface (Parity)

**Priority:** P0
**Description:** Deliver every projection through both a CLI subcommand and an MCP tool, with matching semantics. Verbs use underscores end-to-end on the MCP side (`architect_scope_validate`).
**Bounded context:** `@libar-dev/architect-cli` + `@libar-dev/architect-mcp`.

### Story 3.1: Ship the 7 CLI bins with 24 `architect` subcommands (FR5)

**As an** AI-augmented developer, **I want** every projection callable as a CLI subcommand, **so that** my agent can shell out to a deterministic surface.
**Priority:** P0
**Acceptance Criteria:**
- [ ] 7 bins published: `architect`, `architect-generate`, `architect-guard`, `architect-lint-patterns`, `architect-lint-steps`, `architect-validate`, `architect-mcp`.
- [ ] `architect` exposes 24 subcommands covering query/context (`overview`, `status`, `context`, `dep-tree`, `files`, `pattern`, `list`, `search`), lifecycle (`scope-validate`, `handoff`), generation (`documentation`, `bundle`), architecture (`arch *`), introspection (`rules`, `diagnostics`, `tags`, `taxonomy`, `sources`, `unannotated`), and meta (`query`, `repl`, `help`, `version`).
- [ ] Every verb supports `--format compact|json`.
- [ ] Global flags work as documented (`--base-dir`, `--input`, `--feature`, `--session`, `--depth`, `--dry-run`, `--no-cache`).

### Story 3.2: Ship 21 MCP tools with CLI parity (FR6)

**As an** AI coding agent, **I want** every CLI verb available as an MCP tool with `z.strictObject` inputs, **so that** I can call the platform without spawning subprocesses.
**Priority:** P0
**Acceptance Criteria:**
- [ ] `ARCHITECT_MCP_TOOLS` registry exposes 21 tools.
- [ ] Every input schema is `z.strictObject(...).readonly()`.
- [ ] MCP names use underscores end-to-end (`architect_scope_validate`, not `architect_scope-validate`).
- [ ] Server instructions string directs first call to `architect_overview`, then `architect_scope_validate` and `architect_context`.
- [ ] `architect_rebuild` refreshes the cached PatternGraph on demand.

### Story 3.3: File-watch + rebuild on change (FR17)

**As an** AI coding agent, **I want** the MCP server to rebuild on filesystem changes so my session never sees stale data.
**Priority:** P2
**Acceptance Criteria:**
- [ ] `architect-mcp --watch` subscribes to filesystem changes.
- [ ] Rebuild debounce: 500 ms.
- [ ] Cold-start ≤ ~2 s on the dogfood workspace (329 files).

### Story 3.4: Lockstep version policy (FR18)

**As an** external consumer, **I want** all 6 publishable packages to version in lockstep, **so that** I can pin one version across the family.
**Priority:** P0
**Acceptance Criteria:**
- [ ] `.changeset/config.json` `fixed` group lists all 6 publishable packages.
- [ ] `@libar-dev/architect-spec` and `architect-self-host-example` in `ignore`.
- [ ] `updateInternalDependencies: patch` ensures `workspace:*` bumps emit patches.

---

## Epic 4: Lifecycle Enforcement (ProcessGuard)

**Priority:** P0
**Description:** Enforce the FSM lifecycle on patterns: `roadmap → active → completed; deferred`. Protect completed work, detect scope creep, gate sessions. ADRs: 001, 007, 008; PDR-001.
**Bounded context:** `@libar-dev/architect-guard`.

### Story 4.1: Enforce the FSM transition table (FR7)

**As an** Architect maintainer, **I want** invalid status transitions to be hard-rejected, **so that** patterns can't skip lifecycle states.
**Priority:** P0
**Acceptance Criteria:**
- [ ] Valid transitions: `roadmap → active | deferred`, `active → completed | roadmap`, `completed` terminal, `deferred → roadmap`.
- [ ] `invalid-status-transition` rule fires error severity on any other transition.
- [ ] `isValidTransition` is the canonical check, lives in `@libar-dev/architect-core`.

### Story 4.2: Protect completed patterns (FR8)

**As an** Architect maintainer, **I want** completed patterns hard-locked, **so that** they require explicit intent to re-open.
**Priority:** P0
**Acceptance Criteria:**
- [ ] `ProtectionLevel = 'hard'` on `completed`.
- [ ] Modifying a completed pattern fires `completed-protection` rule unless `@architect-unlock-reason "..."` is added.
- [ ] Unlock reason must be a quoted string.

### Story 4.3: Detect scope creep on active patterns (FR9)

**As an** Architect maintainer, **I want** active-pattern growth flagged, **so that** scope expansion is visible at PR time.
**Priority:** P1
**Acceptance Criteria:**
- [ ] `scope-creep` rule fires when an `active` pattern grows beyond declared scope.
- [ ] `ProtectionLevel = 'scope'` on `active`.
- [ ] Rule severity: error.

### Story 4.4: Deterministic readiness check `scope-validate` (FR10)

**As an** AI coding agent, **I want** a `PASS / BLOCKED / WARN` verdict before I begin design or implementation, **so that** I never start work the guard would reject.
**Priority:** P0
**Acceptance Criteria:**
- [ ] `projectScopeReadinessReport` returns a `ScopeReadinessReport` fragment.
- [ ] `checks[]` enumerate each readiness check with `severity` + `passed` + `details`.
- [ ] `verdict` is derived from the worst severity that failed.
- [ ] `--strict` promotes WARN → BLOCKED (PDR-001 DD-4).
- [ ] Domain logic invokes no shell calls (PDR-001 DD-2).

### Story 4.5: Session-handoff verb (FR11)

**As an** AI coding agent, **I want** a `handoff` verb that captures state for the next session, **so that** context survives across session boundaries.
**Priority:** P1
**Acceptance Criteria:**
- [ ] `architect handoff` and `architect_handoff` emit a `HandoffRecord` fragment.
- [ ] `--modified-file <path>` is repeatable; max 200 files per call.
- [ ] Session type inferred from FSM status; overridable via `--session`.

### Story 4.6: Pre-commit FSM gate (FR13)

**As an** AI-augmented developer, **I want** `pnpm architect:guard --staged` in my pre-commit hook, **so that** doctrine violations are blocked before they land.
**Priority:** P0
**Acceptance Criteria:**
- [ ] `architect-guard --staged` runs against staged files only.
- [ ] Exit code: 0 (clean / warn-only), 1 (errors or `--strict`+warnings).
- [ ] Rules: `completed-protection`, `invalid-status-transition`, `scope-creep`, `session-excluded` (errors); `session-scope`, `deliverable-removed` (warnings).
- [ ] Pretty / JSON output modes via `--format`.

### Story 4.7: Step-definition stubs (ADR-008)

**As an** AI coding agent, **I want** design-tier step stubs in `architect/step-stubs/`, **so that** the structural skeleton is in place before implementation.
**Priority:** P1
**Acceptance Criteria:**
- [ ] Stubs are TypeScript files with real vitest-cucumber structure and `throw new Error` bodies.
- [ ] On implementation, stubs move from `architect/step-stubs/{pattern}/` to `tests/steps/`.
- [ ] Stubs are excluded from TS compilation, ESLint, and vitest.
- [ ] Each stub carries `@architect-implements` and `@architect-target` annotations.

---

## Epic 5: Doctrine Enforcement & Quality Gates

**Priority:** P0
**Description:** Enforce the "no-suppressions" doctrine, dangling-reference checks, and the validate-all gate. Architecture-as-fitness-function in CI.

### Story 5.1: Reject all suppression comments in production code (FR14)

**As an** Architect maintainer, **I want** `// eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, and `@deprecated`-as-shim hard-rejected in `packages/*/src`, **so that** drift can't accumulate silently.
**Priority:** P0
**Acceptance Criteria:**
- [ ] Custom `architect-local/no-suppression-comments` ESLint rule fires error on any match in `packages/*/src/**/*.ts`.
- [ ] Out-of-band `scripts/guard-no-suppressions.mjs` runs as a CI step.
- [ ] Test files retain freedom — rule is scoped to `packages/*/src/**/*.ts` only.

### Story 5.2: Dangling-reference tracking (FR15)

**As an** AI-augmented developer, **I want** unresolved cross-references caught at PR time, **so that** typos and renames don't ship.
**Priority:** P2
**Acceptance Criteria:**
- [ ] `architect arch dangling` lists patterns referencing unresolved IDs.
- [ ] `--strict` exits non-zero on any dangling reference.
- [ ] `--baseline <path>` / `--write-baseline` support incremental adoption.

### Story 5.3: DoD + anti-pattern detection (`validate:all`)

**As an** Architect maintainer, **I want** a single `pnpm validate:all` command that runs DoD checks and anti-pattern detection, **so that** CI has one canonical "is everything okay" gate.
**Priority:** P0
**Acceptance Criteria:**
- [ ] `pnpm validate:all` = `pnpm exec architect-validate --base-dir . --dod --anti-patterns`.
- [ ] Output is `ValidatePatternsOutput`: `{ summary: { issues[], stats }, diagnostics[] }`.
- [ ] Anti-pattern detector and DoD validator run as separate engines but report through one output.

### Story 5.4: Acyclic dependency enforcement (NFR8)

**As an** Architect maintainer, **I want** the package dependency graph kept acyclic, **so that** the load-bearing architecture in AGENTS.md stays load-bearing.
**Priority:** P0
**Acceptance Criteria:**
- [ ] Allowed: `core ← projection`, `core ← guard ← cli`, `core, projection ← mcp`.
- [ ] ESLint `import/no-cycle` rule on across packages.
- [ ] `architect-cli` and `@libar-dev/architect` (meta) ship bins only — no JS API.

---

## Epic 6: Documentation Generation

**Priority:** P1
**Description:** Generate 8 categories of doc artifacts from the PatternGraph via `pnpm docs:all`. Output is byte-deterministic over the same source (ADR-005 codec/renderer split makes this possible).

### Story 6.1: Run the 8 default generators (FR12)

**As an** AI-augmented developer, **I want** `pnpm docs:all` to regenerate all 8 doc categories deterministically, **so that** docs never drift from code.
**Priority:** P1
**Acceptance Criteria:**
- [ ] Generators: `patterns`, `architecture`, `roadmap`, `changelog`, `requirements-executable`, `requirements-specs`, `decisions`, `taxonomy`.
- [ ] Output lands in `docs-live/` (gitignored).
- [ ] Re-running over the same source produces byte-identical output.
- [ ] Per-generator scripts: `docs:patterns`, `docs:architecture`, `docs:roadmap`, `docs:taxonomy`.

### Story 6.2: Per-generator source overrides

**As an** external consumer, **I want** to override `sources.typescript` / `sources.features` per generator, **so that** a specific doc only needs a subset.
**Priority:** P2
**Acceptance Criteria:**
- [ ] `generatorOverrides` config field accepts per-generator `additionalFeatures` or `replaceFeatures` (mutually exclusive).
- [ ] Per-generator `outputDirectory` overrides supported.

### Story 6.3: Documentation bundle composition

**As an** AI coding agent, **I want** to compose a single documentation bundle from the PatternGraph, **so that** I can pull a multi-section context with one MCP call.
**Priority:** P2
**Acceptance Criteria:**
- [ ] `projectDocumentationBundle` accepts `documentType`, optional `disclosure` level, optional `filter` (`status` whitelist).
- [ ] CLI: `architect documentation <type> [--disclosure <level>] [--filter <status=csv>]`.
- [ ] MCP: `architect_documentation` with `z.strictObject` input.

---

## Epic 7: Developer Experience & Onboarding

**Priority:** P1
**Description:** Make adoption frictionless. `defineConfig` typing, `--dry-run`, `repl`, debug verbosity, MCP setup docs.

### Story 7.1: `defineConfig` autocomplete

**As an** external consumer, **I want** `defineConfig(...)` to give me typed autocomplete in `architect.config.ts`, **so that** config errors surface in my editor.
**Priority:** P2
**Acceptance Criteria:**
- [ ] `defineConfig<T>()` exported from `@libar-dev/architect-core`.
- [ ] Returns its input unchanged but provides TS inference.

### Story 7.2: `--dry-run` config inspection

**As an** external consumer, **I want** `pnpm architect:query -- --dry-run` to print the resolved config, **so that** I can debug glob / source / role configuration without running the pipeline.
**Priority:** P2
**Acceptance Criteria:**
- [ ] `--dry-run` flag prints `ResolvedConfig` and exits.
- [ ] MCP tool `architect_config` returns the same shape as JSON.

### Story 7.3: Interactive REPL

**As an** AI-augmented developer, **I want** an interactive REPL to explore the PatternGraph, **so that** I can iterate on queries without re-spawning the CLI.
**Priority:** P3
**Acceptance Criteria:**
- [ ] `architect repl` (in `pattern-graph-cli.ts:166`) loads the graph once, then accepts verb invocations.
- [ ] All non-mutating verbs available.

### Story 7.4: MCP client setup documentation

**As an** AI-augmented developer, **I want** copy-pasteable MCP client config for Claude Code / Claude Desktop, **so that** wiring the server takes minutes, not hours.
**Priority:** P1
**Acceptance Criteria:**
- [ ] `docs/MCP-SETUP.md` documents Claude Code (`.mcp.json`), Claude Desktop (`claude_desktop_config.json`), and monorepo override patterns.
- [ ] Server flags documented: `--input`, `--features`, `--base-dir`, `--watch`.
- [ ] Note on `cwd:` precedence (current behavior, not the stale AGENTS.md claim).

---

## Epic 8: Technical Foundation & Debt Resolution

**Priority:** P1
**Description:** Close the worktree-visible debt before `1.0`. Items from `technical-debt-analysis.md` Migration Priority Matrix.

### Story 8.1: Quick-Win doc patch PR — 5 items in one go

**Priority:** P0 (Quick Win)
**Effort:** ≈1–2 hours
**As an** Architect maintainer, **I want** a single PR that closes #1, #2, #3, #6, #12, **so that** the doctrine docs match the shipped code.
**Acceptance Criteria:**
- [ ] AGENTS.md updated to describe actual `process.cwd()` precedence (#1). Remove the obsolete "strip `PWD`/`INIT_CWD`" guidance.
- [ ] Meta-package `description` and `docs/MCP-SETUP.md` enumerate the actual 21 MCP tools (#2, #12).
- [ ] AGENTS.md mentions all 7 relation kinds, or explicitly states "four edges" is a high-level abstraction (#3).
- [ ] `REMAINING-WORK.md` `PWD` note retired (#6).

### Story 8.2: Commit a `.github/workflows/` CI surface (#5)

**Priority:** P0 (Strategic)
**Effort:** ≈4–8 hours
**As an** Architect maintainer, **I want** the CI doctrine enforced by a committed workflow, **so that** the gates AGENTS.md describes actually run.
**Acceptance Criteria:**
- [ ] Workflow runs `pnpm typecheck`, `pnpm test`, `pnpm validate:all`, `pnpm format:check`, `pnpm guard:no-suppressions`, `pnpm exec architect-guard --all --strict`.
- [ ] Projection perf regression gate wired into the workflow.
- [ ] Workflow runs on PR + push to `main`.

### Story 8.3: Finish the W1.5 split-package migration (#7)

**Priority:** P0 (Strategic)
**Effort:** maintainer-tracked, see `REMAINING-WORK.md`
**As an** Architect maintainer, **I want** the W1.5 lift fully landed, **so that** `2.0.0-pre.1` can graduate.
**Acceptance Criteria:**
- [ ] Backlog items in `REMAINING-WORK.md` closed.
- [ ] No remaining v1→v2 collisions in the import graph.
- [ ] All 5 publishable packages cleanly importable from a fresh consumer project.

### Story 8.4: Graduate the v1→v2 collision map to standalone `MIGRATION.md` (#8)

**Priority:** P1 (Strategic — falls out of #7)
**Effort:** ≈1–2 hours
**As an** external consumer, **I want** the symbol-relocation map at a stable doc path, **so that** I can migrate without reading 57 KB of REMAINING-WORK.
**Acceptance Criteria:**
- [ ] At `2.0.0-pre.1` release, the collision map moves from `REMAINING-WORK.md` §W1.5.7 to standalone `MIGRATION.md`.
- [ ] `MIGRATION.md` lists every v1 symbol → v2 location.

### Story 8.5: Finish `@architect-usecase` retirement (#4)

**Priority:** P3 (Fill-in)
**Effort:** ≈30 min during taxonomy work
**Acceptance Criteria:**
- [ ] No references to `@architect-usecase` in source code or generated docs.

### Story 8.6: Document the two-undocumented-config-keys workaround (#11)

**Priority:** P3 (Fill-in)
**Effort:** <30 min
**Acceptance Criteria:**
- [ ] `config-loader.ts:189-195` workaround documented inline or in `docs/CONFIGURATION.md`.
- [ ] Decision recorded: silently strip vs. warn vs. reject the legacy keys.

### Story 8.7: WIP-commit hygiene check (#9)

**Priority:** P3 (Fill-in)
**Effort:** <30 min
**Acceptance Criteria:**
- [ ] `1abd4b1 WIP` commit message reviewed; either rewritten on history or accepted as part of the W1.5 record.

### Story 8.8: Document the two-Gherkin-parser footgun more prominently (#10)

**Priority:** P3 (Deprioritize — accept structural)
**Effort:** ≈1 hour
**Acceptance Criteria:**
- [ ] A "Trouble?" callout added to `docs/GHERKIN-PATTERNS.md` or equivalent.
- [ ] No attempt to collapse onto a single parser without an explicit design discussion.

---

## Epic 9: Methodology Publication

**Priority:** P1
**Description:** Promote `@libar-dev/architect-spec` (`formal-spec/`) from private v0.2 draft to public v1.0. The methodology is the durable artifact — the implementation can be rewritten.

### Story 9.1: Graduate `@libar-dev/architect-spec` to public

**Priority:** P1
**As a** methodology reader, **I want** `@libar-dev/architect-spec` as a citable standalone package, **so that** I can evaluate the underlying language independent of the reference implementation.
**Acceptance Criteria:**
- [ ] Spec promoted from `private: true` to public at v1.0 release.
- [ ] `.changeset/config.json` `ignore` list updated.
- [ ] Spec content covers the four-tier ladder, FSM states, annotation grammar, and `@architect-*` tag semantics.

---

## Epic Priority Summary

| Epic | Priority | Status | Notes |
| --- | --- | --- | --- |
| 1. PatternGraph & Read Model | P0 | Shipped | Core abstraction. |
| 2. Projection Pipeline & Rendering | P0 | Shipped | Codec/renderer split (ADR-005, ADR-009). |
| 3. CLI & MCP Surface | P0 | Shipped | 7 bins, 24 verbs, 21 MCP tools. |
| 4. Lifecycle Enforcement (ProcessGuard) | P0 | Shipped | FSM + 6 rules. |
| 5. Doctrine Enforcement & Quality Gates | P0 | Shipped | No-suppressions + arch boundaries. |
| 6. Documentation Generation | P1 | Shipped | 8 default generators. |
| 7. Developer Experience & Onboarding | P1 | Shipped | `defineConfig`, `--dry-run`, REPL, MCP setup. |
| 8. Technical Foundation & Debt Resolution | **P0 / Strategic** | **In flight** | The path to 1.0. |
| 9. Methodology Publication | P1 | Scheduled v1.0 | `formal-spec/` graduates with the release. |

---

## Cross-references

- **Functional + non-functional requirements:** `prd.md`.
- **Architecture deep-dive:** `architecture.md`.
- **Working backlog:** `REMAINING-WORK.md` (57 KB, maintainer-owned).
- **Doc gap analysis:** `docs/DOCS-GAP-ANALYSIS.md`.
- **Methodology source:** `formal-spec/` (`@libar-dev/architect-spec`, private v0.2 draft).
