# Initial Analysis Report

**Date:** 2026-05-17
**Directory:** /Users/darkomijic/dev-projects/architect
**Analyst:** Claude Code (StackShift 2.5.1)

---

## Executive Summary

This is the **`@libar-dev/architect-*` package family** — a TypeScript monorepo (pnpm workspaces) that ships an "engineering lifecycle platform for AI-assisted development." It is not a web application. There is no frontend, no database, no cloud deployment target; the deliverables are six npm packages plus a formal specification document (`@libar-dev/architect-spec`). Each package is at `2.0.0-pre.1` (pre-1.0). The codebase is mature and shipped: 329 TypeScript source files across six packages, 128 Gherkin feature files driving the test suite (vitest-cucumber), and the test count reported by `pnpm test` is ~2828 across the five publishable packages.

The repo is unusual for StackShift in that **it is itself a meta-tool for spec-driven development.** The platform under analysis already runs its own delivery process (a "dogfood" Architect instance at the repo root: `architect.config.ts`, `architect/specs/`, `architect/decisions/`, etc.) and already produces 11+ generated documents via `pnpm docs:all`. The packages enforce their own engineering doctrine — Zod-first boundaries, no backward-compatibility shims, Gherkin-only testing (ADR-002), source-first pattern architecture (ADR-003) — via CI gates.

**Recommended next step:** because the project already has a comprehensive in-house spec system (Architect Spec + 9 ADRs/PDR + 128 executable Gherkin features + an MCP/CLI surface with 18+ verbs), running the full 6-gear StackShift reverse-engineering pipeline would **duplicate work already shipping in `architect/` and `docs/`.** A useful Gear 2 here would produce StackShift-shaped outputs targeted at external consumers who want to integrate or extend the packages — i.e., framing the platform from the **consumer perspective**, not the maintainer perspective. See "Recommended Next Steps" below.

---

## Application Metadata

- **Name:** `architect` (workspace root); meta-package is `@libar-dev/architect`
- **Version:** `0.0.0` (workspace root, private); publishable packages at `2.0.0-pre.1`
- **Description:** Libar Architect — engineering lifecycle platform for AI-assisted development.
- **Repository:** https://github.com/libar-dev/architect.git
- **License:** MIT (per `LICENSE` and individual package `package.json`)
- **Primary Language:** TypeScript 5.8+ (ESM-only, `verbatimModuleSyntax: true`)
- **Node:** `>=20.0.0`
- **Package Manager:** pnpm 10.4.1

---

## StackShift Configuration

- **Route:** Brownfield (chosen non-interactively per session policy)
- **Implementation Framework:** GitHub Spec Kit
- **Transmission:** Manual
- **Brownfield Mode:** Standard (document current state, no dependency upgrade pass)
- **Spec Output Location:** Current repository (`.`)

**What this means:** Gear 2 will extract business logic **plus** technical implementation details (TypeScript / pnpm / Zod / Gherkin / MCP) into `docs/reverse-engineering/`. Subsequent Spec Kit gears would write to `.specify/` — but see "Recommended Next Steps" below: this repo already manages itself with a stronger spec system, so Spec Kit's `.specify/` directory will collide conceptually with `architect/specs/`. The user should decide before Gear 2 whether StackShift docs are for **external consumers** or **internal duplication.**

---

## Technology Stack

### Primary Language

- **TypeScript** `^5.8.2`
  - Strict mode enforced via `tsconfig.base.json` + `tsconfig.architect-base.json`
  - `verbatimModuleSyntax: true`, `noUncheckedIndexedAccess: true`, `noPropertyAccessFromIndexSignature: true`, `exactOptionalPropertyTypes: true`
  - ESM-only (`"type": "module"` at root and all packages)

### Frontend Framework

- **None.** This is a CLI + library + MCP-server monorepo. No browser UI exists.

### Backend Framework

- **None in the traditional sense.** What ships is:
  - **CLI bins** (7 total, re-exported by the meta-package) — `architect`, `architect-generate`, `architect-guard`, `architect-validate`, `architect-lint-steps`, `architect-lint-patterns`, `architect-mcp`
  - **MCP server** (`@libar-dev/architect-mcp`) — exposes ~21 tools per CLAUDE.md, 18 per the package description. Built on `@modelcontextprotocol/sdk` (inferred from the package family's purpose).

### Database

- **None.** State is held in source-controlled files (annotated `.ts` + `.feature` files) and computed in-memory as the **PatternGraph** (`buildPatternGraph()` in `@libar-dev/architect-core`).

### Infrastructure & Deployment

- **Cloud Provider:** N/A (npm packages, not a hosted service)
- **IaC Tool:** None
- **CI/CD:** Not committed in this repo at the time of analysis — `.github/workflows/` does not exist. `.changeset/` is configured for npm publishing. CI gates referenced by `AGENTS.md` ("CI-enforced doctrine", "perf regression gate") appear to run in a downstream environment not visible from the worktree alone.
- **Distribution:** npm registry, via `pnpm changeset:publish`

### Key Dependencies

| Category           | Library                        | Version               | Purpose                                                                                           |
| ------------------ | ------------------------------ | --------------------- | ------------------------------------------------------------------------------------------------- |
| Schemas/Validation | `zod`                          | `^4.1.11`             | Cross-package contracts, CLI/MCP boundary validation                                              |
| Test runner        | `vitest`                       | `^4.1.4`              | All test execution                                                                                |
| Test framework     | `@amiceli/vitest-cucumber`     | `^6.3.0`              | Executable Gherkin (`tests/features/`)                                                            |
| Spec parser        | `@cucumber/gherkin`            | (transitive)          | Parses `architect/specs/` for doc-gen + PatternGraph                                              |
| Coverage           | `@vitest/coverage-v8`          | `^4.1.4`              | Coverage instrumentation                                                                          |
| Linter             | `eslint` + `typescript-eslint` | `^9.17.0` / `^8.18.2` | Linting (no-suppressions doctrine enforced via custom script `scripts/guard-no-suppressions.mjs`) |
| Formatter          | `prettier`                     | `^3.8.1`              | Code formatting                                                                                   |
| Build/runtime      | `tsx`                          | `^4.7.0`              | TS execution for CLI bins and dogfood scripts                                                     |
| Release tooling    | `@changesets/cli`              | `^2.27.0`             | Versioning & publishing                                                                           |

---

## Architecture Overview

### Application Type

**Library + CLI + MCP-server monorepo.** Distribution unit is npm; consumption surfaces are (a) JS API import from `@libar-dev/architect-core` / `-projection` / `-guard`, (b) CLI bins from `@libar-dev/architect-cli` or the meta `@libar-dev/architect`, (c) MCP tools from `@libar-dev/architect-mcp`.

### Directory Structure

```
architect/
├── architect.config.ts            # Dogfood config (the toolchain pointed at itself)
├── architect/                     # Dogfood spec lifecycle — parsed by @cucumber/gherkin, NOT compiled or tested
│   ├── specs/                     # .feature files in lifecycle: idea → candidate → plan → design → executable
│   │   ├── ideas/
│   │   ├── candidates/
│   │   ├── documentation-projection/
│   │   └── *.feature              # 28+ design-tier specs
│   ├── decisions/                 # 8 ADRs + 1 PDR (.feature files)
│   ├── stubs/                     # Design-level TS contract stubs (ephemeral)
│   ├── step-stubs/                # Stub step definitions for design-phase specs
│   ├── design-reviews/
│   ├── ideations/
│   ├── releases/
│   └── slices/
├── docs/                          # Manual documentation (15 .md files) — INDEX, ARCHITECTURE, CLI, METHODOLOGY, TAXONOMY, etc.
├── docs-sources/                  # Inputs for generated docs
├── docs-live/                     # gitignored — output of `pnpm docs:all`
├── formal-spec/                   # @libar-dev/architect-spec (private, v0.2 draft methodology RFC)
├── packages/
│   ├── architect/                 # Meta package (bin-only re-exports, no JS API)
│   ├── architect-core/            # PatternGraphAPI, buildPatternGraph, scanner, taxonomy, config
│   ├── architect-projection/      # Fragment pipeline (Zod), block types, renderers
│   ├── architect-guard/           # ProcessGuard FSM, policy, validation, anti-pattern detection
│   ├── architect-cli/             # Thin composition root for the 6 CLI bins
│   └── architect-mcp/             # MCP server (~18-21 tools), watcher, pipeline session
├── scripts/                       # Dogfood smoke, glue, regression scripts
├── tests/                         # Dogfood smoke + regression suite
│   ├── features/                  # Executable Gherkin (vitest-cucumber inputs)
│   ├── fixtures/
│   ├── planning-stubs/
│   ├── steps/
│   └── support/
├── .agents/skills/                # 9 Architect skills (single source of truth — symlinked into .claude/skills/)
├── .changeset/                    # Versioning & release config
├── AGENTS.md                      # Authoritative agent guidance (CLAUDE.md is a symlink)
├── REMAINING-WORK.md              # 57KB working doc, W1.5 migration backlog
├── MIGRATION.md                   # v1 → v2 split-package migration guide
├── package.json                   # Root workspace manifest
└── pnpm-workspace.yaml            # Workspaces: packages/*, formal-spec
```

### Key Components

#### Backend: Not applicable in the HTTP sense. The packages themselves are the "components":

| Package                           | Internal deps                     | Role                                                        |
| --------------------------------- | --------------------------------- | ----------------------------------------------------------- |
| `@libar-dev/architect-core`       | (none)                            | Canonical model, ingestion, graph build, PatternGraphAPI    |
| `@libar-dev/architect-projection` | core                              | Fragment-based projection pipeline (Zod-validated)          |
| `@libar-dev/architect-guard`      | core                              | Policy, ProcessGuard FSM, anti-pattern detection            |
| `@libar-dev/architect-cli`        | core, projection, guard           | Thin composition root for 6 CLI bins                        |
| `@libar-dev/architect-mcp`        | core, projection                  | MCP server (≈18–21 tools)                                   |
| `@libar-dev/architect` (meta)     | cli, core, guard, mcp, projection | Bin-only re-export — no JS API. The "kitchen-sink" install. |

Dependency direction is acyclic and documented as load-bearing: `core ← projection`, `core ← guard ← cli`, `core, projection ← mcp`.

#### Frontend: None.

#### Database: None. The "data store" is annotated source + Gherkin features, projected into the PatternGraph at build time.

#### API Architecture

- **CLI surface:** 7 bins, all exposed via `pnpm exec architect-*`. Documented in `docs/CLI.md`.
- **MCP surface:** `mcp__architect__*` tools (e.g., `architect_overview`, `architect_context`, `architect_scope_validate`, `architect_dep_tree`, `architect_files`, `architect_handoff`). Surface is documented as parity-with-CLI in `.agents/skills/architect-data-api/SKILL.md` (referenced in AGENTS.md as the canonical reference).
- **JS API:** Each split package exports a typed API; CLAUDE.md notes a v1→v2 collision map for consumers (in `REMAINING-WORK.md` §W1.5.7, to graduate to `MIGRATION.md` at `2.0.0-pre.1` release).

#### Infrastructure

- Not applicable. The release pipeline is `pnpm changeset:publish` to the npm registry.

---

## Existing Documentation

### README.md

- **Status:** Yes
- **Quality:** Good (60+ lines, complete)
- **Sections:**
  - [✓] Description
  - [✓] Package family table
  - [✓] Dependency direction
  - [✓] Workspace layout
  - [✓] Dogfood explanation
  - [✗] Quickstart for external consumers (partial)
  - [✗] Versioned migration pointer (lives in `MIGRATION.md`)
- **Last Updated:** 2026-05-17 (per `ls -la`)

### `docs/` — Manual Documentation

| File                            | Purpose                                             |
| ------------------------------- | --------------------------------------------------- |
| `INDEX.md`                      | Doc map / table of contents                         |
| `ARCHITECTURE.md`               | System architecture overview                        |
| `CLI.md`                        | CLI bin reference                                   |
| `CONFIGURATION.md`              | `architect.config.ts` reference                     |
| `METHODOLOGY.md`                | Methodology (four-tier ladder, FSM, value transfer) |
| `TAXONOMY.md`                   | Canonical taxonomy                                  |
| `GHERKIN-PATTERNS.md`           | Gherkin authoring patterns                          |
| `ANNOTATION-GUIDE.md`           | `@architect-*` annotation reference                 |
| `MCP-SETUP.md`                  | MCP server setup                                    |
| `PROCESS-GUARD.md`              | ProcessGuard FSM rules                              |
| `VALIDATION.md`                 | Validation & anti-pattern detection                 |
| `SESSION-GUIDES.md`             | Per-session skill workflows                         |
| `CROSS-INSTANCE-CONVENTIONS.md` | Conventions when architect manages another project  |
| `DOCS-GAP-ANALYSIS.md`          | Self-assessment of documentation completeness       |
| `PR-NOTE-TAXONOMY-CAMPAIGN.md`  | Campaign note for taxonomy redesign                 |

- **Status:** Yes — comprehensive (15 manual `.md` files + 50 generated artifacts under `architect/`)
- **Quality:** Good. There is also a self-authored `DOCS-GAP-ANALYSIS.md`.

### Architecture Decision Records (ADRs)

Located in `architect/decisions/` as `.feature` files (Gherkin-driven decisions):

- `adr-001` — Taxonomy canonical values
- `adr-002` — Gherkin-only testing
- `adr-003` — Source-first pattern architecture
- `adr-005` — Codec-based markdown rendering / codec-renderer separation
- `adr-006` — Single read model architecture
- `adr-007` — Coordinated taxonomy redesign
- `adr-008` — Step-definition stubs convention
- `adr-009` — Projection trust boundary
- `pdr-001` — Session workflow commands

**Notable:** ADR-004 is absent (skip-numbered).

### Setup / Deployment / Developer Docs

- **CONTRIBUTING.md:** Yes
- **MAINTAINERS.md:** Yes
- **MIGRATION.md:** Yes (v1 monolith → v2 split, ~8KB)
- **REMAINING-WORK.md:** 57KB working backlog (W1.5 lift)

### Generated Documentation

`pnpm docs:all` regenerates `docs-live/` from the PatternGraph, producing: `patterns`, `architecture`, `roadmap`, `changelog`, `requirements-executable`, `requirements-specs`, `decisions`, `taxonomy` — 8 generators. `docs-live/` is gitignored.

### Documentation Tools

- **Configured:** Custom in-house — `architect-generate` CLI bin drives all generated docs.
- **Output Location:** `docs-live/` (gitignored)

---

## Completeness Assessment

### Overall Completion: ~85%

This is a **pre-1.0 shipped package family with active polish work**. The split is functional (`2.0.0-pre.1`), tests pass (~2828), and CI doctrine is enforced. The remaining ~15% is migration finalization (W1.5 lift) and pre-1.0 hardening tracked in `REMAINING-WORK.md`.

### Component Breakdown

| Component              | Completion | Evidence                                                                                   |
| ---------------------- | ---------- | ------------------------------------------------------------------------------------------ |
| Core packages          | ~95%       | All 6 packages at `2.0.0-pre.1`, 329 source TS files, recent commits are polish/refactor   |
| Tests                  | ~90%       | 128 `.feature` files, ~2828 tests, perf regression gate in place                           |
| Documentation          | ~90%       | 15 manual `.md` + 9 ADRs + 8 doc generators + `DOCS-GAP-ANALYSIS.md` actively maintained   |
| CI / Release tooling   | ~60%       | `.changeset/` set up, but no `.github/workflows/` checked in (may be configured elsewhere) |
| Migration completeness | ~80%       | `MIGRATION.md` published, `REMAINING-WORK.md` (57KB) tracks W1.5 backlog                   |
| Public API stability   | Pre-1.0    | All packages `2.0.0-pre.1`; v1→v2 collision map exists                                     |

### Detailed Evidence

#### Core packages (~95%)

- All six packages publish at `2.0.0-pre.1` with consistent metadata (license, author, repo, bin entries).
- Dependency direction is acyclic and documented as load-bearing.
- Recent commits (last 20) are dominated by `refactor(projection):` and `style:` — polish, not green-field work.
- The meta-package successfully re-exports 7 bins.

#### Tests (~90%)

- **Test strategy:** Gherkin-only (ADR-002). Tests are `.feature` files executed via `@amiceli/vitest-cucumber`.
- **Count:** 128 `.feature` files across `packages/*/tests/features/` and `tests/features/`.
- **Aggregate count:** ~2828 tests (per CLAUDE.md).
- **Perf gate:** `architect-projection` ships a CI perf test with 36-pattern/108-rule fixture and `baseline × 1.5` regression budget.
- **Two parsers in play:** `@cucumber/gherkin` for design-time (parses `architect/specs/`), `@amiceli/vitest-cucumber` at test time (parses `tests/features/`). CLAUDE.md flags this as the most common debugging pitfall.

#### Documentation (~90%)

- 15 manual `.md` files in `docs/` cover architecture, CLI, MCP, methodology, taxonomy, configuration, validation, process-guard, annotation guide.
- 9 architectural decisions (ADR-001 through ADR-009, with ADR-004 skipped; plus PDR-001).
- Generator pipeline produces 8 categories of generated docs via `pnpm docs:all`.
- A self-authored `DOCS-GAP-ANALYSIS.md` exists — the maintainer is aware of documentation gaps and tracks them.
- 9 agent skills under `.agents/skills/` (kernel + 7 session skills) — these are themselves documentation of the intended workflow.

#### CI / Release tooling (~60%)

- `.changeset/` is configured (`config.json` present, `README.md` present, no pending changesets in worktree).
- `package.json` has `release` script: `pnpm build && pnpm changeset:publish`.
- **Gap:** No `.github/workflows/` directory committed. Either CI runs on a different surface (GitLab? a self-hosted system?) or hasn't been migrated yet post-split. CLAUDE.md references "CI-enforced doctrine" and a "perf regression gate" — these enforcement points need to live somewhere.

#### Migration / pre-1.0 completion (~80%)

- `MIGRATION.md` exists (8KB), covers v1 monolith → v2 split.
- `REMAINING-WORK.md` is 57KB — clearly the main worklist for getting to `1.0`.
- Recent commit history includes `revert: remove operational decision records`, `refactor(taxonomy): retire @architect-usecase` — visible signs of in-flight pre-1.0 simplification.

### Placeholder Files & TODOs

The maintainer's "no-BC" doctrine (AGENTS.md §Engineering doctrine) explicitly forbids `// eslint-disable*`, `@ts-ignore`, `@ts-expect-error`, `@deprecated` markers, and BC aliases in new code. A `scripts/guard-no-suppressions.mjs` enforces this. So traditional placeholder/TODO smells are deliberately _absent_ by policy — not because the code is finished, but because the doctrine forces delete-don't-defer.

Visible workspace state:

- `.full-review/` and `.pi/` directories exist (untracked) — likely transient agent / review artifacts.
- `1abd4b1 WIP` in recent commits — a real WIP marker in main history.

### Missing Components

**Not started:**

- `.github/workflows/` for CI — likely needed before `1.0`.

**Partially implemented (per `REMAINING-WORK.md` cross-reference):**

- W1.5 lift not fully landed. Specifics live in `REMAINING-WORK.md` (not enumerated here to avoid duplicating an active working document).

**Needs improvement:**

- The maintainer-authored `docs/DOCS-GAP-ANALYSIS.md` is the canonical answer here — defer to it rather than this report inventing a parallel list.

---

## Source Code Statistics

- **Packages:** 6 publishable (+ 1 private `@libar-dev/architect-spec`)
- **Source TypeScript files:** 329 (`packages/**/*.ts`, excluding `node_modules`, `dist`, `tests`)
- **Test framework:** Gherkin-only — `.test.ts` count is 0; `.feature` count is 128
- **Aggregate test count:** ~2828 (per CLAUDE.md)
- **Manual docs:** 15 `.md` files in `docs/`, plus README, AGENTS.md, CONTRIBUTING.md, MAINTAINERS.md, MIGRATION.md, REMAINING-WORK.md
- **ADRs:** 9
- **Skills:** 9 (kernel pair + 7 session skills)

### File Type Breakdown

| Type                          | Count  | Purpose                                                                                                                                  |
| ----------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript (`.ts`)            | 329    | Library code, CLI bins, MCP tools, scanner, projection, guard                                                                            |
| Gherkin features (`.feature`) | 128    | Executable specs + design specs + ADRs                                                                                                   |
| Markdown (`.md`) in `docs/`   | 15     | Manual documentation                                                                                                                     |
| Config (root)                 | ~10    | `tsconfig.*`, `eslint.config.mjs`, `.prettierrc`, `pnpm-workspace.yaml`, `architect.config.ts`, `lint-staged.config.mjs`, `package.json` |
| Scripts (`scripts/`)          | dozens | Dogfood smoke, glue, guard-no-suppressions                                                                                               |

---

## Technical Debt & Issues

The maintainer tracks this themselves in `REMAINING-WORK.md` and `docs/DOCS-GAP-ANALYSIS.md`. Highlights from this analysis (without duplicating those documents):

### Identified Issues

1. **No committed CI workflows.** `.github/workflows/` is absent. The doctrine claims "CI-enforced" gates exist, but the enforcement surface is invisible from the worktree. Either reconcile or document where CI lives.
2. **`architect-cli` PWD-vs-cwd quirk.** AGENTS.md flags this explicitly: the CLI resolves config via `process.env.PWD` before `process.cwd()`, which is fragile in subprocess embedding. Tracked in `REMAINING-WORK.md`.
3. **W1.5 lift not fully landed.** Live working backlog in `REMAINING-WORK.md` (57KB).
4. **Two Gherkin parsers easy to confuse.** `@cucumber/gherkin` (architect-state-time) vs `@amiceli/vitest-cucumber` (test-time). CLAUDE.md calls this "the most painful debugging in this repo." Currently mitigated by documentation; structurally it remains a footgun.
5. **`.full-review/` and `.pi/` untracked** — present in worktree, gitignored, likely agent scratch. Not a problem, just noting.

### Security Concerns

Not applicable in the traditional sense — no user-data path, no auth surface, no network listener for arbitrary clients. The MCP server exposes tools to a local agent, which is the intended trust model.

### Performance Concerns

Actively measured. `architect-projection` ships a perf gate (36 patterns / 108 rules, `baseline × 1.5` budget). No concerns flagged from outside.

### Code Quality

- **Linting:** Configured. `eslint.config.mjs` is 17KB — substantive ruleset, not boilerplate.
- **Type Checking:** Strict — `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax` all on.
- **Code Formatting:** Prettier + lint-staged + `format` / `format:check` scripts.
- **Pre-commit Hooks:** `architect-guard --staged` is the pre-commit gate (per AGENTS.md). `lint-staged.config.mjs` is configured.
- **No-suppressions doctrine:** Enforced by custom guard script.

---

## Recommended Next Steps

This is the **critical decision point** for Gear 2. The standard 6-gear StackShift pipeline assumes the target is an under-documented application. This repo is **the opposite extreme** — it is itself a spec-driven-development platform with comprehensive in-house spec system, generated docs, executable Gherkin, and an MCP/CLI surface dedicated to projecting its own state.

### Three viable paths forward

**Path A — External-consumer documentation (recommended for Gear 2).** Run Gear 2 with the framing: _"document this for an external developer who wants to install and use `@libar-dev/architect-_`in their own project."* Skip business-logic extraction (no business logic — it's a meta-tool) and focus the 11 reverse-eng docs on **integration points, configuration, the MCP/CLI contract, and decision rationale**. Output complements rather than duplicates`architect/specs/`.

**Path B — Skip Gear 2 entirely.** The existing `docs/` + `architect/decisions/` + generated `docs-live/` already covers what Gear 2 would produce, and at higher quality. Use the StackShift skills only when working on a **consumer project**, not on the platform itself.

**Path C — Run Gear 2 as written.** Produce 11 docs in `docs/reverse-engineering/`. Accept duplication with `architect/specs/`. Useful only if there's a downstream consumer (BMAD Auto-Pilot, a stack migration target) that specifically wants the StackShift doc shape.

### Immediate Priorities (if Path A or C is chosen)

1. **Decide the audience.** External consumers vs internal duplication — this determines whether Gear 2 is worth the 30–45 min.
2. **Reconcile with `architect/specs/`.** Establish a rule: when a Gear-2 doc and an architect spec disagree, the architect spec wins (the platform's own doctrine). Make sure Gear 2 outputs cite back to architect specs rather than re-derive them.
3. **Skip "Business Context" extraction.** There is no end-user persona; the user is another developer or an AI agent. Document that explicitly rather than fabricating personas.

### Reverse Engineering Focus Areas (for Gear 2)

- **Prioritize:** `integration-points.md`, `configuration-reference.md`, `decision-rationale.md`, `technical-debt-analysis.md`.
- **Pay special attention to:** the MCP-tool surface (parity with CLI), the PatternGraph data model, the `architect.config.ts` schema.
- **Can largely skip / defer to existing docs:**
  - `visual-design-system.md` (no visual surface)
  - `data-architecture.md` (no database; the PatternGraph data model belongs under integration-points)
  - `business-context.md` (no end-user persona; mark `[NEEDS USER INPUT]` and move on)
  - `operations-guide.md` (defer to `docs/CLI.md`, `docs/MCP-SETUP.md`, `docs/CONFIGURATION.md`)
  - `functional-specification.md` (defer to `docs/METHODOLOGY.md` + `formal-spec/`)

### Estimated Reverse Engineering Effort

- **Gear 2 (Reverse Engineer):** ~30 minutes if Path A is taken (4 focused docs + skip markers on the other 7); ~45 minutes if Path C is taken (full 11 docs).
- **Gears 3-6:** Likely not applicable. Spec Kit's `.specify/` would duplicate `architect/specs/`. If the user wants to dogfood Spec Kit alongside Architect, they need to decide which is canonical first.

---

## Notes & Observations

- **This repo is a meta-tool.** It IS a reverse-engineering / spec-driven platform. Running another reverse-engineering pipeline against it produces interesting circularity. The CLAUDE.md kernel-skill bootstrap is specifically designed to prevent agents from "scanning files" instead of using `pnpm architect:query` — running StackShift here intentionally bypasses that.
- **Recent commit history shows WIP work.** The `1abd4b1 WIP` commit and `revert: remove operational decision records` suggest active in-progress changes. Re-run analysis after the current campaign lands.
- **The `formal-spec/` package is private (`v0.2 draft`).** It will graduate to a standalone published package at `1.0`. Gear 2 docs should not reference internals of `formal-spec/` as if they are stable.
- **Architect-managed downstream consumers** would benefit more from the StackShift pipeline than this repo does. The skills under `.agents/skills/` already provide a coherent agent UX for working _with_ architect-managed projects.
- **Two CLAUDE.md files** are actually one: `CLAUDE.md` is a symlink to `AGENTS.md`. Harnesses look for either name.

---

## Appendices

### A. Dependency Tree (root-level direct)

```
runtime:
  @libar-dev/architect-core           workspace:*
  @libar-dev/architect-guard          workspace:*

dev:
  @amiceli/vitest-cucumber            ^6.3.0
  @changesets/cli                     ^2.27.0
  @libar-dev/architect-cli            workspace:*
  @libar-dev/architect-mcp            workspace:*
  @libar-dev/architect-projection     workspace:*
  @types/node                         ^24.12.0
  @vitest/coverage-v8                 ^4.1.4
  eslint                              ^9.17.0
  eslint-config-prettier              ^10.1.8
  eslint-import-resolver-typescript   ^3.7.0
  eslint-plugin-import                ^2.31.0
  prettier                            ^3.8.1
  tsx                                 ^4.7.0
  typescript                          ^5.8.2
  typescript-eslint                   ^8.18.2
  vitest                              ^4.1.4
  zod                                 ^4.1.11
```

### B. Configuration Files Inventory

```
architect.config.ts            # Dogfood Architect config — the toolchain pointed at itself
eslint.config.mjs              # ~17KB substantive ruleset (flat config)
.prettierrc / .prettierignore  # Formatter config
.npmrc                         # npm/pnpm registry config
.node-version                  # Node pin
pnpm-workspace.yaml            # packages/* + formal-spec
lint-staged.config.mjs         # Pre-commit file selection for guards
tsconfig.base.json             # Base TS config (referenced by AGENTS.md)
tsconfig.architect-base.json   # Architect-specific strict additions
.changeset/config.json         # Changesets versioning config
```

### C. Database Schema Summary

Not applicable. The "data store" is the **PatternGraph**, which is computed in-memory from annotated source + Gherkin features by `buildPatternGraph()` in `@libar-dev/architect-core`. Read access is via `createPatternGraphAPI()`, surfaced as `pnpm architect:query` (CLI) and `architect_*` (MCP tools).

---

**Report Generated:** 2026-05-17
**Toolkit Version:** StackShift 2.5.1
**Ready for Gear 2:** ⚠️ Conditional — see "Recommended Next Steps". The user should pick Path A (focused external-consumer docs), Path B (skip Gear 2), or Path C (full pipeline with duplication) before proceeding.
