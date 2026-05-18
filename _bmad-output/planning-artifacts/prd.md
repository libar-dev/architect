---
workflowType: prd
project_name: "@libar-dev/architect-* (architect package family)"
date: "2026-05-17"
synthesize_mode: "yolo"
inputDocuments:
  - docs/reverse-engineering/business-context.md
  - docs/reverse-engineering/functional-specification.md
  - docs/reverse-engineering/integration-points.md
  - docs/reverse-engineering/technical-debt-analysis.md
  - docs/reverse-engineering/decision-rationale.md
coverage_score: 78
---

# Architect — Product Requirements Document

> **A note on shape.** This is a developer-tool / meta-platform, not an end-user product. The standard PRD template is shaped around products with end-user personas, a revenue model, and a competitive market. The synthesis below honestly reframes those sections for a TypeScript library + CLI + MCP-server family whose customers are other developers and the AI coding agents acting on their behalf.

---

## Product Vision

> *"Engineering lifecycle platform for AI-assisted development — annotate your code, get structured AI context, enforced delivery workflows, and a design workbench that makes AI implementation near-deterministic."*
> — `README.md` line 3

- **Problem.** AI coding assistants produce non-deterministic, drift-prone implementations when given a free-form codebase. Reasoning that should flow from a stable model of "what this codebase actually is" instead flows from whatever the assistant happened to read into context.
- **Value proposition.** Annotate code with `@architect-*` JSDoc + Gherkin tags, project that into a typed **PatternGraph**, expose the graph to agents via a **CLI + MCP** surface, and gate the delivery workflow with a **finite state machine** (`ProcessGuard`). The platform turns ad-hoc code into AI-native context.
- **Differentiator.** The PatternGraph is built **from the source code itself** (ADR-003 source-first), not from a sidecar database. State lives where the implementation lives; generated docs and queryable models are projections. AI agents reason over the same nouns (`Pattern`, `depends-on`, `uses`, `implements`) the platform was trained to handle.

The repo also ships **`@libar-dev/architect-spec`** in `formal-spec/` — a `v0.2 draft` methodology RFC that promotes to a public package at v1.0. That formal spec defines **WHAT** to write; the `@libar-dev/architect-*` packages are the reference implementation of **HOW** to parse, validate, and project it.

---

## Target Users

There is no end-user persona in the conventional sense — the product is consumed by other developers and by AI coding agents acting on their behalf.

### Persona 1: AI-augmented developer (primary) `[INFERRED]`

- **Role:** TypeScript-fluent engineer using Claude Code, OpenCode, Cursor, or a similar AI coding harness on a serious project (≥10K LOC, multi-package, long-lived).
- **Goals:** Keep AI implementations on-spec across sessions; surface architectural drift early; have a single artifact (the design-tier `.feature` spec) that the agent and the human can both reason over.
- **Pain Points:** "Why did the agent re-derive that?" "Why did the spec drift from the code?" "How do I onboard a new agent session into a campaign that's already half-done?"
- **Technical sophistication:** High. Comfortable with breaking changes in pre-1.0 releases; values type safety over convenience.

### Persona 2: AI coding agent (secondary, non-human)

- **Role:** Claude Code, OpenCode, or any MCP-aware coding agent.
- **Goals:** Resolve current session intent (planning / design / implement / refactor / review / handoff); pull pattern context without scanning files; follow deterministic gates (`scope-validate`, `arch dangling --strict`) rather than guessing.
- **Pain Points:** No stable typed query surface; ambiguous session state; context drift between sessions.
- **What the platform gives them:** Stable, typed, queryable model of the project; nine purpose-built session skills; canonical verdict words (`PASS` / `BLOCKED` / `WARN`).

### Persona 3: Architect maintainer (tertiary)

- **Role:** CODEOWNER / committer on this repo.
- **Goals:** Land the W1.5 split-package migration; finish pre-1.0 polish; ship a clean v1.0 of both the implementation and `@libar-dev/architect-spec`.
- **Pain Points:** Tracked in `REMAINING-WORK.md` (57 KB) and `docs/DOCS-GAP-ANALYSIS.md`.

---

## Success Criteria

What "successful operation" looks like for an adoption (from `functional-specification.md` §Success Criteria):

1. **A consumer project that has annotated its TypeScript can run `pnpm architect:overview`** and see its patterns enumerated with correct FSM state, role, and edges.
2. **`pnpm architect:guard --staged` runs in pre-commit** and blocks doctrine violations before they land.
3. **`pnpm validate:all` runs in CI** and gates the merge on DoD + anti-pattern violations.
4. **An MCP-aware agent (Claude Code) connects to the architect MCP server** and can call `architect_overview`, `architect_context`, `architect_scope_validate`, `architect_handoff` against the consumer's project.
5. **`pnpm docs:all` regenerates `docs-live/`** from the current PatternGraph deterministically — re-running over the same source produces byte-identical output.
6. **The perf-regression gate passes** against the 36-pattern / 108-rule fixture on every PR.

### Business Goals & KPIs `[AUTO-INFERRED - review recommended]`

No revenue model, telemetry, or analytics surface exists. Inferred success signals:

- **v1.0 ships** with the W1.5 split completed and `@libar-dev/architect-spec` promoted to public.
- **Downstream projects adopt** the four-tier ladder and the `@architect-*` annotation grammar.
- **The PatternGraph becomes a standard input format** for AI coding agents (alongside `package.json`, `tsconfig.json`).
- **Test suite remains green:** ~2828 tests across 5 publishable packages.
- **Doctrine drift stays near zero:** the `no-suppressions` guard and ESLint rule reject `// eslint-disable*`, `@ts-ignore`, `@deprecated`-as-shim.

---

## Functional Requirements

Acceptance criteria for each FR live in the executable Gherkin features under `tests/features/` and `packages/*/tests/features/` (128 `.feature` files, ~2828 scenarios). They are not duplicated here.

### FR1: Build PatternGraph from annotated sources

- **Priority:** P0
- **Description:** Scan annotated TypeScript + Gherkin sources and build a typed PatternGraph in memory.
- **Canonical surface:** `buildPatternGraph` (`@libar-dev/architect-core`); CLI `architect overview`.

### FR2: Zod-validated trust boundary

- **Priority:** P0
- **Description:** Validate every CLI/MCP input at the trust boundary via Zod `strictObject` schemas.
- **Canonical surface:** `parseAtBoundary` (`architect-core`); ADR-009.

### FR3: Read-side PatternGraph API

- **Priority:** P0
- **Description:** Expose the graph through a stable read-side API (`PatternGraphAPI`).
- **Canonical surface:** `createPatternGraphAPI` (`architect-core`).

### FR4: Projection pipeline (fragments + renderers)

- **Priority:** P0
- **Description:** Project the graph into typed Fragments (markdown / JSON / compact).
- **Canonical surface:** `project*` and `parseAndProject*` functions in `@libar-dev/architect-projection`; ADR-005, ADR-009.

### FR5: CLI parity for every projection

- **Priority:** P0
- **Description:** Provide CLI parity for every projection (`overview`, `status`, `context`, `dep-tree`, `files`, `scope-validate`, `handoff`, etc.).
- **Canonical surface:** The 24 subcommands of `architect` bin.

### FR6: MCP parity for the same surface

- **Priority:** P0
- **Description:** Provide MCP parity for the same surface (21 tools).
- **Canonical surface:** `ARCHITECT_MCP_TOOLS` registry.

### FR7: FSM lifecycle enforcement

- **Priority:** P0
- **Description:** Enforce an FSM lifecycle on patterns: roadmap → active → completed; deferred branch.
- **Canonical surface:** `architect-core/validation/fsm/`; enforced by `architect-guard`.

### FR8: Completed-pattern protection

- **Priority:** P0
- **Description:** Protect `completed` patterns from modification without `@architect-unlock-reason`.
- **Canonical surface:** ProcessGuard rule `completed-protection`.

### FR9: Scope-creep detection

- **Priority:** P1
- **Description:** Detect scope creep on `active` patterns.
- **Canonical surface:** ProcessGuard rule `scope-creep`.

### FR10: Deterministic readiness check (`scope-validate`)

- **Priority:** P0
- **Description:** Provide a deterministic readiness check that returns `PASS` / `BLOCKED` / `WARN`.
- **Canonical surface:** `projectScopeReadinessReport` → `ScopeReadinessReport`; PDR-001 DD-4.

### FR11: Session-handoff verb

- **Priority:** P1
- **Description:** Provide a session-handoff verb that captures state for the next agent session.
- **Canonical surface:** `architect handoff` / `architect_handoff`.

### FR12: Doc generation (8 default generators)

- **Priority:** P1
- **Description:** Generate 8 categories of doc artifacts via `pnpm docs:all`.
- **Canonical surface:** `architect-generate`; `DEFAULT_GENERATORS`.

### FR13: Pre-commit FSM gate

- **Priority:** P0
- **Description:** Provide a pre-commit gate for FSM enforcement (`architect-guard --staged`).
- **Canonical surface:** `pnpm architect:guard` in `package.json`.

### FR14: No-suppressions doctrine enforcement

- **Priority:** P0
- **Description:** Reject all `// eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, and `@deprecated`-as-shim in production code.
- **Canonical surface:** `architect-local/no-suppression-comments` ESLint rule + `scripts/guard-no-suppressions.mjs`.

### FR15: Dangling-reference tracking

- **Priority:** P2
- **Description:** Track unresolved cross-references with `arch dangling [--strict]`.
- **Canonical surface:** `architect arch dangling` CLI verb.

### FR16: Tolerant ingestion of malformed specs

- **Priority:** P1
- **Description:** Tolerant ingestion of malformed specs (failures land in `featureParseFailures`, never silent drops).
- **Canonical surface:** `PatternGraph.featureParseFailures` field.

### FR17: File-watch + rebuild on change

- **Priority:** P2
- **Description:** Watch the file system and rebuild the graph on change (debounced 500 ms).
- **Canonical surface:** `architect-mcp --watch`.

### FR18: Lockstep versioning across publishable packages

- **Priority:** P0
- **Description:** Version all six publishable packages in lockstep via the `fixed` group.
- **Canonical surface:** `.changeset/config.json`.

---

## Non-Functional Requirements

### NFR1: TypeScript strictness throughout

- **Priority:** P0
- **Description:** Strict TypeScript with `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`.
- **Evidence:** `tsconfig.base.json` + `tsconfig.architect-base.json`.

### NFR2: Zod `strictObject` at every boundary

- **Priority:** P0
- **Description:** Zod `strictObject` at every cross-package and CLI/MCP boundary.
- **Evidence:** Engineering doctrine in `AGENTS.md`; ADR-009.

### NFR3: No backward-compatibility shims

- **Priority:** P0
- **Description:** No backward-compatibility shims, `@deprecated`-as-shim, or parallel implementations in production code.
- **Evidence:** `AGENTS.md` §No-BC; ESLint rule.

### NFR4: Projection-pipeline perf budget

- **Priority:** P0
- **Description:** Projection-pipeline median latency must stay within `baseline × 1.5` against the 36-pattern / 108-rule fixture.
- **Evidence:** Perf regression gate in `@libar-dev/architect-projection`.

### NFR5: MCP server cold-start latency

- **Priority:** P1
- **Description:** MCP server cold-start ≤ ~2 s on the dogfood workspace (329 source files). `[AUTO-INFERRED - review recommended — no committed budget]`
- **Evidence:** Measured implicitly; observed in agent sessions.

### NFR6: Pure-function domain logic

- **Priority:** P1
- **Description:** Pure-function domain logic in `scope-validate` / `handoff` (no shell calls inside the domain layer).
- **Evidence:** PDR-001 DD-2.

### NFR7: Deterministic verdict vocabulary

- **Priority:** P0
- **Description:** Deterministic verdict vocabulary (`PASS` / `BLOCKED` / `WARN`) consistent with ProcessGuard severity levels.
- **Evidence:** PDR-001 DD-4.

### NFR8: Acyclic package dependency graph

- **Priority:** P0
- **Description:** Acyclic package dependency graph: `core ← projection`, `core ← guard ← cli`, `core, projection ← mcp`.
- **Evidence:** `AGENTS.md` §"Dependency direction".

### NFR9: MIT license, public npm access

- **Priority:** P0
- **Description:** MIT license; npm `access: public`.
- **Evidence:** `LICENSE`; `.changeset/config.json`.

### NFR10: Lockstep version policy

- **Priority:** P0
- **Description:** All six publishable packages in lockstep via the `fixed` changesets group.
- **Evidence:** `.changeset/config.json` `fixed` array.

### NFR11: Security model — local-only trust boundary

- **Priority:** P0
- **Description:** No HTTP server, no user-data path, no authentication surface. Trust model = local user account; MCP transport is stdio between processes in the same user account. `parseAtBoundary` (Zod-validated) is the canonical input gate.
- **Evidence:** `technical-debt-analysis.md` §Security Concerns.

---

## Business Rules

The platform encodes a small set of load-bearing invariants. They are enforced by code, not by convention:

1. **PascalCase pattern names only** (`PatternIdentifier` regex `^[A-Z][A-Za-z0-9]+$`).
2. **FSM transitions follow the table in `validation/fsm/transitions.ts`** — anything else is rejected as `invalid-status-transition`.
3. **`completed` is hard-locked** (`ProtectionLevel = 'hard'`). Override requires `@architect-unlock-reason "..."`.
4. **One `@architect-pattern` per file** (ADR-003 §Key rules). `@architect-implements` is many-to-one (UML realization).
5. **Tier-1 specs are ephemeral** (ADR-003). Once a pattern is `executable`, the source-of-truth artifact is the annotated production code + the executable Gherkin; the design spec is deleted.
6. **`parseAndProject*` is the trust boundary** (ADR-009). Internal `project*` functions assume Zod-validated inputs and do not re-validate.
7. **All six publishable packages move together** (`.changeset/config.json` `fixed`).
8. **No suppressions / no BC aliases in `packages/*/src`** (AGENTS.md §No-BC; ESLint rule).
9. **Architect state (`architect/`) is parsed by `@cucumber/gherkin`, never compiled by TS or executed by vitest-cucumber.** Executable tier lives under `tests/features/` and `packages/*/tests/features/`.
10. **Two undocumented `architect.config.ts` keys (`codecOptions`, `referenceDocConfigs`) are silently stripped** before validation. See known issues.

---

## Scope

### In scope

- Parsing annotated TypeScript and Gherkin from a workspace.
- Building and serving the PatternGraph (in-memory, single read model).
- Projecting the graph into typed Fragments and rendering markdown / JSON / compact output.
- Enforcing the FSM lifecycle via ProcessGuard.
- Exposing the surface via CLI and MCP with parity.
- Generating the eight default doc artifacts via `pnpm docs:all`.

### Out of scope

- HTTP services, user authentication, multi-tenant hosting.
- Frontend / UI / mobile.
- Persistent storage (database, KV, object storage).
- Cloud infrastructure / IaC / deployment automation.
- Telemetry / analytics / usage tracking.
- Cross-language support — TypeScript only; consumer projects in other languages can adapt the methodology (see `formal-spec/`) but not import the implementation directly.

---

## External Dependencies

(From `integration-points.md` — no runtime external service dependencies; build-time and registry-time only.)

| Surface | Service | Purpose |
| --- | --- | --- |
| Distribution | **npm registry** | Six publishable packages via `@changesets/cli` (`access: public`). |
| MCP transport | **stdio (local)** | MCP server runs as a child process of the agent. No network. |
| Spec parsing (architect state) | `@cucumber/gherkin` | Parses `architect/specs/`, `architect/decisions/`, `formal-spec/`. |
| Spec parsing (executable) | `@amiceli/vitest-cucumber` `^6.3.0` | Parses `tests/features/` at test time. |
| Schema validation | `zod` `^4.1.11` | Every CLI/MCP input is `z.strictObject(...).readonly()`. |
| MCP SDK | `@modelcontextprotocol/sdk` | Used by `@libar-dev/architect-mcp` only. |
| Test runner | `vitest` `^4.1.4` | All test execution via the cucumber adapter. |
| Release tooling | `@changesets/cli` `^2.27.0` | Versioning and publishing (`fixed` group across the 6 publishables). |
| Build / TS execution | `tsx` `^4.7.0` | Direct TS execution. |

---

## Constraints & Assumptions

### Compliance & regulatory

Not applicable. No user data path, no PII handling, no HIPAA/GDPR/SOC2 surface. The MCP server runs locally as a developer tool — trust model is "local agent talking to local server" (same as a linter or build tool).

### Budget & team size `[AUTO-INFERRED - review recommended]`

- **Self-hosted nothing** — npm packages only. No cloud infra, no hosted service.
- **Small team signal** — the no-BC doctrine is a small-team-with-strong-opinions choice. Maintainer is choosing **velocity + cleanliness** over **stability + breadth** at the current stage.
- **Pre-1.0 signal** — versioning everything at `2.0.0-pre.1` with a published v1→v2 collision map shows the maintainer has already done one major break and is willing to do another.
- Recent commit history shows a single committer pattern; `MAINTAINERS.md` exists as formal acknowledgement of the role.

### Timeline pressure

- `REMAINING-WORK.md` is 57 KB. The W1.5 lift is in flight.
- The no-BC doctrine + active polish work suggest a **"finish the v2 split, ship 1.0"** trajectory rather than indefinite backward compatibility.
- Technical-debt density is **intentionally low** by policy.

### Technology constraints (committed)

- Node ≥ 20.0.0; pnpm 10.4.1.
- ESM-only (`"type": "module"`).
- TypeScript 5.8+ with all four strictness flags enabled.
- All consumer integration is via `architect.config.ts` at repo root.

---

## Known Issues

(From `technical-debt-analysis.md` Migration Priority Matrix.)

### High-impact, low-effort (Quick Wins — single PR)

- **#1 `PWD` / `cwd` doctrine drift.** AGENTS.md says `PWD` is checked first; runtime does the opposite. Fix the doc.
- **#2 MCP tool-count inconsistency.** CLAUDE.md says 21, meta-package description and `docs/MCP-SETUP.md` say 18. The shipped registry has 21; the others are stale.
- **#3 "Four edges" framing is incomplete.** The projection layer has **seven** relation kinds (`depends-on`, `uses`, `enables`, `implements`, `extends`, `see-also`, `api-ref`).
- **#6 `REMAINING-WORK.md` `PWD` note** — couples with #1.
- **#12 `docs/MCP-SETUP.md`** — same fix as #2.

### High-impact, medium/high-effort (Strategic)

- **#5 Missing CI workflow.** `.github/workflows/` is absent in this worktree. AGENTS.md claims "CI-enforced doctrine" but the surface is invisible.
- **#7 W1.5 split-package migration not fully landed.** Live working backlog in `REMAINING-WORK.md`.
- **#8 v1→v2 collision map graduation** to standalone `MIGRATION.md` at `2.0.0-pre.1` release.

### Lower priority (Fill-ins / Deprioritize)

- **#4 `@architect-usecase` retirement** still mid-flight.
- **#9 `1abd4b1 WIP` in main history** — hygiene smell.
- **#10 Two Gherkin parsers in play** — well-documented footgun; collapsing would be a multi-day refactor.
- **#11 Two undocumented config keys silently stripped** (`codecOptions`, `referenceDocConfigs`).

---

## Cross-references

- **Architecture details:** see `architecture.md` in this artifact set.
- **Epic / story breakdown:** see `epics.md`.
- **Design / UX (deliberately minimal — CLI + markdown only):** see `ux-design-specification.md`.
- **Source documents:** `docs/reverse-engineering/` (11 docs).
- **Methodology RFC:** `formal-spec/` (`@libar-dev/architect-spec`, private v0.2 draft).
- **Workflow doctrine:** `AGENTS.md` (symlinked from `CLAUDE.md`), `.agents/skills/` (nine skills).
