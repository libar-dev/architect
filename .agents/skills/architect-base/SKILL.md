---
name: architect-base
description: MANDATORY first-load for any work in this Architect repo — the shared vocabulary every other surface assumes. Covers what Libar Architect is, the PatternGraph + `@architect-*` tag taxonomy, the four authored tiers plus executable/maintenance levels, the FSM lifecycle, value-transfer doctrine, and the key ADRs. Load it before any architect-scoped Read/Glob/Grep and before any other architect-* skill, whenever work touches Architect, the architect package family, specs/stubs, `pnpm architect:q`, an `architect_*` MCP tool, or a session-intent verb (plan/design/implement/review/refactor/handoff). Does NOT cover per-session execution detail — that routes to the session skills.
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
---

# Architect Base Context

Operational baseline for every session in this Architect repo. Self-contained — does not require any other architect-\* skill to be loaded first.

When you load this skill, state briefly that the **architect-base** context is loaded so the user can confirm it activated.

## 1. What Libar Architect is

A **source-first reliability layer for agentic engineering and end-to-end software delivery**. Architect manages the full lifecycle — requirements, design / architecture, implementation, maintenance — as a typed, queryable, managed-as-code process state.

Two things in one place:

- **The product** — the `@libar-dev/architect-*` package family lives in this repo.
- **The delivery process** — this repo runs the architect toolchain on itself (dogfood) to plan, design, implement, and review its own work.

Architect serves two audiences from the same source of truth:

- **AI agents and humans doing work** — the scriptable live graph handle (`pnpm architect:q`, ADR-014) plus `architect_*` MCP tools, task-oriented context, FSM-validated transitions.
- **Surfaces that consume the projection** — generated documentation, the Architect Studio web/desktop app's view state, architecture-review context, release notes, change logs.

The **canonical source of truth** is annotated production code + executable Gherkin (`tests/features/`). Everything else is a projection.

## 2. The delivery process in this repo

| Aspect           | Value                                                                                                                                                                                                                                                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Config           | `architect.config.ts` at the repo root                                                                                                                                                                                                                                                                                              |
| Working state    | `architect/` (specs, decisions, stubs, step-stubs)                                                                                                                                                                                                                                                                                  |
| Source of truth  | Annotated `packages/*/src/**/*.ts` + executable Gherkin under `tests/features/` and `packages/*/tests/features/`                                                                                                                                                                                                                    |
| CLI              | `pnpm architect:q '<js>'` (the graph handle, ADR-014) + `pnpm architect:graph <cmd>` (named demos + the dangling gate)                                                                                                                                                                                                              |
| MCP              | `architect` server → `mcp__architect__*` callable tools                                                                                                                                                                                                                                                                             |
| Validation entry | `pnpm typecheck`, `pnpm test`, `pnpm validate:all`, `pnpm architect:guard --staged`                                                                                                                                                                                                                                                 |
| Doc regeneration | `pnpm docs:all` → `docs-live/` (git-tracked, derived — determinism-gate diff target); `pnpm docs:check` verifies idempotency in place (re-renders, diffs the working tree, writes nothing, non-zero on drift) — usable mid-changeset where `git diff --exit-code` can't tell an uncommitted edit from a non-deterministic generator |

When this package family is consumed by another project, the consumer wires their own `architect.config.ts` and exposes their own `architect:q` / `architect:graph` scripts over the `architect` bin — the contracts above are stable across architect-managed repos.

## 3. Architect State — what lives where

`architect/` holds **working state**, not the source of truth. It is parsed by `@cucumber/gherkin` for projection / extraction and is explicitly **excluded from TypeScript compile, ESLint, vitest**.

| Folder                        | Role                                                                                                                        | Lifetime                                                        |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `architect/ideations/`        | Dated pre-idea ideation / context captures (`YYYY-MM-DD-*.feature`) — parsed working state, distilled into ideas/candidates | Until distilled                                                 |
| `architect/specs/ideas/`      | Idea-tier specs (lightest authored shape)                                                                                   | Until promotion                                                 |
| `architect/specs/candidates/` | Candidate-tier specs (open questions + 1-2 scenarios)                                                                       | Until promotion                                                 |
| `architect/slices/`           | Slice-tier multi-pattern lateral views (idea-tier structural variant; `@architect-level:slice`, no `@architect-parent`)     | Reference                                                       |
| `architect/specs/`            | Plan- and design-tier specs (deliverables + full scenarios + stubs)                                                         | **Until value transferred to executable Gherkin, then deleted** |
| `architect/stubs/`            | Design-tier TS contract scaffolds (one folder per pattern)                                                                  | Ephemeral                                                       |
| `architect/step-stubs/`       | Design-tier stub step definitions                                                                                           | Ephemeral                                                       |
| `architect/decisions/`        | ADRs / PDRs — compact, durable, decisions-only (no operational or temporal context)                                         | **Permanent**                                                   |

**Two Gherkin parsers, do not confuse them:**

- `@cucumber/gherkin` reads `architect/specs/`, `architect/decisions/`, `formal-spec/` at doc-gen + pattern-graph build time.
- `@amiceli/vitest-cucumber` reads executable specs (`tests/features/`, `packages/*/tests/features/`) at test time.

## 4. PatternGraph — the central abstraction

A **pattern** is a named architectural unit (a feature, service, component, contract, codec, spec). The graph nodes are patterns; the edges are typed relationships.

**Tag taxonomy** (canonical enumerated set: the generated `docs-live/TAXONOMY.md`):

- **Identity**: `@architect-pattern:<Name>` (one file owns identity)
- **State**: `@architect-status:<candidate|roadmap|active|completed|deferred>`; `@architect-maturity` derives from status (idea=consideration, plan=delivery) and an explicit value wins (§04) — explicit is **required only at the idea tier** (`@architect-maturity:idea`, the guard's opt-in), dropped on promotion to candidate, derived elsewhere
- **Structure**: `@architect-bounded-context:<context>`, `@architect-role:<closed-enum>`
- **Product**: `@architect-product-area:<area>` (PRD grouping; **required** at idea tier)
- **Edges**: `@architect-uses:<Pattern>` (dependency), `@architect-implements:<Pattern>` (realization, test → production), `@architect-parent:<Pattern>` (hierarchy)
- **Hierarchy axis**: `@architect-level:<epic|phase|task|slice>` (independent of maturity)
- **Implementation enrichment** (on production TS): `@architect-usecase`, `@architect-enforces-decision:<ADR>` (the structured pattern→ADR edge — distinct from `@architect-decision`, which is a doc-aggregation tag, not this), `@architect-target` (stub forward pointer)
- **Forward link**: `@architect-executable-specs:<path>` (design spec → executable feature)
- **Audit**: `@architect-unlock-reason:<reason>` (optional advisory-warning suppressor for completed reopen/edit and a required marker only for genuinely non-standard transitions)

> **Depth:** the categories above are the conceptual model. The three orthogonal classification axes (role · bounded-context · layer) and the csv-vs-colon authoring rules live in [`references/taxonomy.md`](references/taxonomy.md). The **complete enumerated set is generated, never hand-maintained** — read the generated `docs-live/TAXONOMY.md` (regenerate via `pnpm docs:all`). That is canonical; the categories here teach the shape, they do not enumerate it.

**Instances** of patterns live in two surfaces:

- `.feature` files (canonical for behavioral patterns) — tags at the feature level
- `.ts` files (canonical for code-originated patterns: codecs, contracts, utilities) — JSDoc `@architect-*` blocks

**Edges**: `depends-on` / `uses` / `implements` / `see-also` / `parent`.

**Projections** are Zod-validated **Named Domain Fragments** (`@libar-dev/architect-projection`). The same graph projects into markdown, JSON, context bundles, architecture views, release notes. Fragments are the trust boundary — anything outside a fragment is anecdote.

## 5. Entry points

- **`architect.config.ts`** — config loader; taxonomy customization, source globs, validation rules.
- **`pnpm architect:q '<js>'`** — the graph handle (ADR-014); script the live graph, get the conclusion. **This is the default; use it.**
- **`architect_*` MCP tools** — sub-ms per call, same verbs, **snake_case end-to-end** (`architect_scope_validate`, not `architect_scope-validate`). Reach for MCP only when bursting ≥5 verbs in close sequence.
- File scanning architect-scoped paths to learn pattern state is a smell — every "what's the status of X?" question is one `architect:q` script away.

## 6. Validation layers

| Layer                 | Command                                                    | What it checks                                                           |
| --------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| Type system           | `pnpm typecheck`                                           | Strict TS (see CLAUDE.md "TypeScript strictness")                        |
| Annotation lint + DoD | `pnpm validate:all`                                        | Definition-of-done, anti-patterns, dangling references                   |
| Process Guard (FSM)   | `pnpm architect:guard --staged`                            | FSM transitions, `@architect-unlock-reason` rules, structural invariants |
| Graph integrity       | `pnpm architect:graph dangling --baseline <path> --strict` | Cross-pattern reference drift                                            |

All of these are CI-enforced. Failing gates are stop-and-surface; never `--no-verify`.

## 7. Key decision records (load-bearing, decisions-only)

ADRs / PDRs in `architect/decisions/` are **permanent and decisions-only**. They record a _decision_ + its rationale and **only durable, non-execution-related facts**. Operational or temporal context — status, work-in-progress, ETAs, who is doing what this week — **never** belongs here; that is the difference between a decision record and a worklog. Decisions are amended via a **new** ADR, never by editing the old one — _except during bootstrap_ (pre-1.0, live-state), when records are consolidated **in place** (edit / slim / delete directly; no amend-chains and no supersedes / superseded-by edges — they manufacture the history the read model excludes; see [`references/decision-records.md`](references/decision-records.md) §"Amendment rule" and the repo bootstrap doctrine). Read the relevant record before changing anything in its area — the `.feature` file itself, or `pnpm architect:q 'g.pattern("ADR006SingleReadModelArchitecture")'` — never paraphrased from memory.

The load-bearing set:

- **ADR-003** — Source-First Pattern Architecture
- **ADR-005** — Codec / Renderer Separation
- **ADR-006** — Single Read Model
- **ADR-007** — Coordinated Taxonomy Redesign
- **ADR-009** — Projection Trust Boundary
- **ADR-014** — Scriptable Graph Handle as the Agent Read Surface

> **Not the same as a campaign `DECISIONS.md`.** `architect/decisions/` holds **durable** ADRs (permanent). A campaign's `.pr-coordination/DECISIONS.md` holds **ephemeral** judgment-calls for one active campaign (resolved-with-commit-sha, then archived). Both are called "decisions" but have opposite lifetimes — do not file durable architecture in the campaign log, or campaign bookkeeping in an ADR.
>
> **Depth:** [`references/decision-records.md`](references/decision-records.md).

## 8. Annotation ownership (operational)

**Split-ownership principle**:

- Feature files own **what + when** (planning surface).
- Production TS owns **how + with what** (implementation surface).
- Neither duplicates the other.

A pattern is **identified** by exactly one surface — the feature file for behavioral patterns, the `.ts` file for code-originated patterns (codecs, contracts, utilities). Production TS realizes a feature-owned pattern via `@architect-implements:<Pattern>` — a relation, not an identity claim. A code/contract **stub** in `architect/stubs/` is itself a code-originated surface, so it carries its **own** distinct `@architect-pattern` (plus `@architect-implements`/`@architect-target`) — that identity then travels with the code to `src/` (it is _not_ duplication: the names differ). The lone stub exception is a **step-definition** stub (`architect/step-stubs/`), which never carries `@architect-pattern` (ADR-008). Full split in [`references/annotation-ownership.md`](references/annotation-ownership.md).

**Production-TS `@architect-*` JSDoc is additive, not mandatory.** A pattern can be `@architect-status:completed` with zero `@architect-*` JSDoc on its source, provided the executable feature carries the full surface (identity, status, deps, invariants, scenarios). Annotations enrich discoverability; they do not gate completion.

A completed, **feature-identity-owned** pattern carries no `@architect-*` identity JSDoc on its realizing production `.ts` at all — identity, status, deps, and invariants live entirely on its `.feature`. Confirm the current set live rather than trusting a frozen name (samples rot — §16): `pnpm architect:q 'g.patterns.filter(p => p.status === "completed").map(p => [p.name, p.sourceFile])'` (a feature-owned pattern's `sourceFile` is its `.feature`). A reviewer flagging "no annotations on `<file.ts>`" as a value-transfer blocker is mistaken.

> **Depth:** the per-tag ownership tables (what feature files own vs what production TS owns) + the code-originated-identity rules live in [`references/annotation-ownership.md`](references/annotation-ownership.md).

## 9. Detail tiers and maturity levels

There are **six** levels along the detail/maturity axis. Four are authored in `architect/specs/`; two are post-spec.

| Level       | Where                                           | What it adds vs the level above                                                          |
| ----------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Idea        | `architect/specs/ideas/`                        | User story + 1-3 invariant-only rules; **≤30 lines soft cap**                            |
| Candidate   | `architect/specs/candidates/`                   | `**Open Questions:**` block + 1-2 happy-path scenarios                                   |
| Plan        | `architect/specs/`                              | Deliverables table, full scenario set, `**Rationale:**` / `**Verified by:**`             |
| Design      | `architect/specs/`                              | Stubs in `architect/stubs/<pattern>/`, error/edge/integration scenarios, ADR refs        |
| Executable  | `tests/features/`, `packages/*/tests/features/` | Realization (`@architect-implements:`) + executable scenarios that prove invariants hold |
| Maintenance | Shipped code + its executable feature           | Evolves in place; scenarios grow as behavior grows                                       |

**Promotion is linear**: `idea → candidate → plan → design → executable`. Skipping rungs is rejected. (The one non-spec-driven exception — backfilling shipped code that has no spec — lives in [`architect-refactor-session`](../architect-refactor-session/SKILL.md), not this spec-driven ladder.)

> **Depth:** the per-tier line budgets, mandatory-tag sets, epic/slice variants, and worked promotion examples live in [`references/four-tier-ladder.md`](references/four-tier-ladder.md). The 4-field `Rule:` block convention (`Invariant` / `Rationale` / `Verified by`) and its per-tier field requirements live in [`references/rule-block-template.md`](references/rule-block-template.md).

## 10. The detail-level doctrine — CRITICAL, easy to get wrong

**Tier line budgets and field requirements are floors and soft caps, NOT formulaic quotas.** The level of detail at idea / plan / design is **contextual** — it is up to the design judgment of the executor.

The two failure modes to refuse:

- **Bloat to satisfy the form.** Adding deliverables, stubs, full design scenarios, ADR refs for the 50th instance of an established pattern, a CRUD endpoint, an industry-standard piece of work. Detail you don't need is detail that will rot.
- **Strip context to match the tier.** Truncating real, hard-won session context at the end of planning or design because "we're only at idea / plan tier." Precious nuance gets destroyed in service of the form.

**Both fail the goal.** Author what is meaningful for THIS pattern in THIS context:

- **Invest detail** when the work is architecturally significant, non-routine, sensitive (security / data privacy / 3rd-party integration / public-facing), requires external approval, or is context-critical.
- **Skip detail** when the pattern is the Nth instance of a well-understood shape, a CRUD endpoint, or an industry-standard piece with no novel decisions.

Design-level specs do not always need stubs and full design details. Idea-tier specs are not required to be terse. Use judgment — too much content is worse than not enough; both extremes erode the signal.

**The skip-detail cases are a reviewable smell, not just a judgment cue.** The "skip detail" list above — the Nth instance of an established shape, a CRUD endpoint, an industry-standard piece with no novel decisions — is Architect's standing decision about where prose adds nothing. So re-explaining those shapes, or re-deriving a pattern already defined elsewhere, is a **flaggable redundancy** at spec review ([`../architect-sessions/references/review-spec.md`](../architect-sessions/references/review-spec.md)), not something left to per-session memory. This does **not** narrow the "invest detail" half: deliberate depth on architecturally significant, sensitive, or novel work is design judgment and is never trimmed by this rule. The gate enforces a decision §10 already made; it does not make a new one.

## 11. FSM lifecycle (high level)

```
            ┌─ (maturity flip, human acceptance gate, not process-guard)
            │
candidate ──┴──► roadmap ──► active ──► completed
                  │ ▲                    │      │
                  ▼ │                    │      └──► active   (advisory reopen)
               deferred                  └────────► roadmap  (advisory reopen)
```

`deferred` hangs off **`roadmap`**, not `active` — `roadmap ⇄ deferred` is the only deferred edge (`active → deferred` is rejected). `active → roadmap` is the back edge (see below).

- `candidate → roadmap` is a **maturity flip** (acceptance gate, human judgment). NOT a process-guard transition.
- `roadmap → active`, `active → completed`, `active → roadmap`, `roadmap → deferred`, `deferred → roadmap`, `completed → active`, and `completed → roadmap` are process-guard-validated. Invalid jumps are rejected.
- Reopening completed work is **advisory**, not blocked. `@architect-unlock-reason:<≥10 char, not a placeholder>` is optional and suppresses the warning.

Verify any transition before flipping:

```bash
pnpm architect:q 'g.api.isValidTransition("<from>", "<to>")'   # deterministic boolean
# scope-readiness (PASS/WARN/BLOCKED) remains available as the `architect_scope_validate` MCP tool
```

> **Depth:** the process-guard transition table, the maturity-flip-vs-FSM distinction, and the `@architect-unlock-reason:` authoring rules live in [`references/fsm-transitions.md`](references/fsm-transitions.md).

## 12. Spec ↔ Pattern relationships (bipartite)

Production patterns and test patterns are **two nodes** joined by `@architect-implements:`. A test feature carries two file-level tags:

```gherkin
@architect-pattern:DefineConfigExecutableTests
@architect-implements:DefineConfig
```

Two sanctioned suffix conventions:

- `<Name>Testing` — test pattern accompanying a deliberately designed pattern (flowed through plan / design).
- `<Name>ExecutableTests` — test pattern backfilling shipped code (the formal escape from retroactive plan-level specs).

Epics and slices are durable, edge-derived navigation nodes. Any prose `**Members:**` list is human-facing orientation only; the authoritative member set is derived from reverse `@architect-parent` edges and persists after member design specs are deleted.

The PatternGraph treats them identically; the suffix is human-facing.

> **Depth:** the forward/reverse link pair, the `*ExecutableTests` escape-hatch authoring flow, and the hierarchy axis (`@architect-level` / `@architect-parent`) live in [`references/spec-pattern-relationships.md`](references/spec-pattern-relationships.md).

## 13. Value transfer and design-spec deletion (high level)

**Deletion is not loss — it is cleanup of a redundant copy _after_ its value has moved.** A design-level spec is a **scaffold, not permanent documentation**: once implementation completes, every piece of its value has a durable home, and only then is the now-duplicated scaffold removed. Nothing valuable is destroyed — "what did we delete?" is a `git log` question, not information lost.

The three scaffolds and where each one's value goes:

- **Design-level `.feature` spec** → invariants move to **executable Gherkin** (`tests/features/`, canonical) + rationale to JSDoc; then the `.feature` is **deleted**.
- **Step-definition stubs** (`architect/step-stubs/`) → become the executable feature's real step wiring; then **deleted**.
- **Code/contract stubs** (`architect/stubs/`) → **promoted to `src/`** as a code-originated pattern: their `@architect-pattern` identity **persists** (it travels with the code per ADR-003; `@architect-status` advances `roadmap` → `completed`). The staging copy is removed — the pattern is **not** discarded.

Durable carriers (where the value lands):

- **Executable Gherkin** (canonical) — pattern identity, status, dependencies, invariants, scenarios that prove them.
- **Production code + its `@architect-*` JSDoc** (additive) — a promoted code/contract stub's contract shape and identity, plus rationale that doesn't fit in Gherkin (decisions, usecases, roles).

**Pre-deletion gate (high level)**: forward link present + resolves; reverse link present; all Rule blocks with invariants have counterparts in the executable feature.

**Default**: ask the user before deleting. Deferring to code review for batched deletion across a related set is more common than delete-immediately.

> **Depth:** the transfer checklist, the five-criterion pre-deletion gate, and deletion timing live in [`../architect-sessions/references/ephemeral-spec-deletion.md`](../architect-sessions/references/ephemeral-spec-deletion.md) — the central doctrine every session type should understand.

## 14. The read surface — essentials (ADR-014)

Default surface: **the graph handle** (`pnpm architect:q`) — script the live graph, get the
conclusion back. The full surface, recipes, and quirks live in the dedicated
`architect-graph-handle` skill; load it before real use. The essentials:

```bash
# Health / inventory / orientation
pnpm architect:q 'g.api.getStatusCounts()'                        # status distribution
pnpm architect:q 'g.api.getCurrentWork()'                         # active work
pnpm architect:graph census                                       # annotation coverage per package
pnpm architect:q 'g.findByConcept("taxonomy").slice(0,5)'         # fuzzy concept → patterns

# Per-pattern detail
pnpm architect:q 'g.pattern("<Name>")'                            # need-shaped node (status, edges, maturity)
pnpm architect:q 'g.api.getPattern("<Name>")'                     # full canonical record
pnpm architect:q 'g.invariantsOf("<Name>")'                       # what it guarantees, exec vs authored
pnpm architect:q 'g.specsReverifying(["<Name>"])'                 # what re-verifies if it changes

# Gates (deterministic)
pnpm architect:q 'g.api.isValidTransition("<from>","<to>")'       # FSM boolean
pnpm architect:graph dangling --baseline <path> --strict          # non-zero exit on drift (the CI gate)

# Impact / architecture cuts
pnpm architect:graph blast HEAD~8                                 # downstream + at-risk specs of a diff
pnpm architect:q 'g.byFile("packages/.../x.ts")'                  # file → owner + neighborhood
pnpm architect:q 'g.bySymbol("<Exported>")'                       # symbol → architectural usage
```

Generated documentation projections live in `docs-live/` (regenerate: `pnpm docs:all`); the
generated `docs-live/TAXONOMY.md` is the canonical enumerated tag set.

**MCP twins** (`architect_*`, snake_case end-to-end — `architect_overview`,
`architect_scope_validate`, `architect_bundle`, …) remain the stable typed surface for
burst-mode use and the Studio sink. The canonical inventory is
`packages/architect-mcp/src/tool-registry.ts` — read it for the current tool set rather than
trusting a count cached here.

**Quirks worth knowing now** (full list in the graph-handle skill):

- Never call `architect:q` bare in automation — with a non-TTY stdin and no argument it waits
  on stdin. Pass an argument or piped input (`… < /dev/null` is safe).
- q bodies are plain JS function bodies: no `import`/`export`, no TS-only syntax; end with
  `return <value>` (a single argv expression needs no `return`).
- `g.invariantsOf(x) === []` does NOT mean "guarantees nothing" — code-originated contracts
  carry their guarantee as a TS type, not a Gherkin Rule (the GUARANTEE recipe disambiguates).
- `g.pattern("<Name>") === undefined` can mean parse failure OR doesn't exist — cross-check
  with `g.findByConcept` and `g.api.getPatternParseFailure("<Name>")`.

## 15. Bootstrap discipline (every session)

Orient from the live graph, not from file scanning. A cheap first read:

```bash
pnpm architect:q 'return {counts: g.api.getStatusCounts(), active: g.api.getCurrentWork().map(p => p.patternName ?? p.name)}'
```

If a pattern name is in scope:

```bash
pnpm architect:q 'const p = g.pattern("<Name>"); return {p, invariants: g.invariantsOf("<Name>").length, reverifies: g.specsReverifying(["<Name>"]).length}'
```

The handle is faster and more accurate than file scanning (~2s per call, data stays
in-process), and the output is the canonical signal — file scanning gives you snapshots that
can lie.

## 16. Anti-anecdote — the live graph wins

When a sample-derived finding (an old session-handoff note, a snapshot folder with a SHA suffix, an n=2 "we tried this twice" worklog, or a skill body that has drifted) appears to contradict the live state:

- **The live PatternGraph is canonical.** `pnpm architect:q` output reflects the graph as it is right now; a skill paraphrase reflects the graph as it was when written. When they disagree, the live graph wins.
- **A sample is useful for _why_, not _what_.** It explains why a rule exists; it is not authoritative for what the rule currently is.
- **Silence is provisional, not permission.** If the live state is silent on a question a sample answers, treat the sample's finding as provisional and flag it (`FEEDBACK.md`) rather than encoding it as doctrine.

Surprises are signal — they feed the loop (`FEEDBACK.md`), they do not override the source of truth.

## 17. What this skill does NOT cover

This is the operational baseline (vocabulary + doctrine). Depth lives in [`references/`](references/); execution lives in two dedicated skills:

- **`architect-sessions`** — the spec-driven session lifecycle (idea/candidate authoring, design, implement, review-spec, review-implementation, handoff), each behind progressive disclosure. The detailed per-session workflows, the full pre-deletion gate, and the value-transfer execution detail are there.
- **`architect-refactor-session`** — the non-spec-driven carve-out (evolving shipped code in place) and the multi-session / PR coordination conventions for large campaigns.

If a session needs one of those, load the dedicated skill; do not paraphrase it from memory.
