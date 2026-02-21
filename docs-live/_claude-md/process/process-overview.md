=== PROCESS OVERVIEW ===

Purpose: Process product area overview
Detail Level: Compact summary

**How does the session workflow work?** Process defines the USDP-inspired session workflow that governs how work moves through the delivery lifecycle. Three session types (planning, design, implementation) have fixed input/output contracts: planning creates roadmap specs from pattern briefs, design produces code stubs and decision records, and implementation writes code against scope-locked specs. Git is the event store — documentation artifacts are projections of annotated source code, not hand-maintained files. The FSM enforces state transitions (roadmap → active → completed) with escalating protection levels, while handoff templates preserve context across LLM session boundaries. ADR-003 established that TypeScript source owns pattern identity; tier 1 specs are ephemeral planning documents that lose value after completion.

=== KEY INVARIANTS ===

- TypeScript source owns pattern identity: `@libar-docs-pattern` in TypeScript defines the pattern. Tier 1 specs are ephemeral working documents
- 7 canonical product-area values: Annotation, Configuration, Generation, Validation, DataAPI, CoreTypes, Process — reader-facing sections, not source modules
- Two distinct status domains: Pattern FSM status (4 values) vs. deliverable status (6 values). Never cross domains
- Session types define capabilities: planning creates specs, design creates stubs, implementation writes code. Each session type has a fixed input/output contract enforced by convention

=== PRODUCT AREA CANONICAL VALUES ===

**Invariant:** The product-area tag uses one of 7 canonical values. Each value represents a reader-facing documentation section, not a source module.

| Value         | Reader Question                     | Covers                                          |
| ------------- | ----------------------------------- | ----------------------------------------------- |
| Annotation    | How do I annotate code?             | Scanning, extraction, tag parsing, dual-source  |
| Configuration | How do I configure the tool?        | Config loading, presets, resolution             |
| Generation    | How does code become docs?          | Codecs, generators, rendering, diagrams         |
| Validation    | How is the workflow enforced?       | FSM, DoD, anti-patterns, process guard, lint    |
| DataAPI       | How do I query process state?       | Process state API, stubs, context assembly, CLI |
| CoreTypes     | What foundational types exist?      | Result monad, error factories, string utils     |
| Process       | How does the session workflow work? | Session lifecycle, handoffs, conventions        |

=== ADR CATEGORY CANONICAL VALUES ===

**Invariant:** The adr-category tag uses one of 4 values.

| Value         | Purpose                                       |
| ------------- | --------------------------------------------- |
| architecture  | System structure, component design, data flow |
| process       | Workflow, conventions, annotation rules       |
| testing       | Test strategy, verification approach          |
| documentation | Documentation generation, content structure   |

=== FSM STATUS VALUES AND PROTECTION LEVELS ===

**Invariant:** Pattern status uses exactly 4 values with defined protection levels. These are enforced by Process Guard at commit time.

| Status    | Protection   | Can Add Deliverables | Allowed Actions                 |
| --------- | ------------ | -------------------- | ------------------------------- |
| roadmap   | None         | Yes                  | Full editing                    |
| active    | Scope-locked | No                   | Edit existing deliverables only |
| completed | Hard-locked  | No                   | Requires unlock-reason tag      |
| deferred  | None         | Yes                  | Full editing                    |

=== VALID FSM TRANSITIONS ===

**Invariant:** Only these transitions are valid. All others are rejected by Process Guard.

| From     | To        | Trigger               |
| -------- | --------- | --------------------- |
| roadmap  | active    | Start work            |
| roadmap  | deferred  | Postpone              |
| active   | completed | All deliverables done |
| active   | roadmap   | Blocked/regressed     |
| deferred | roadmap   | Resume planning       |

=== TAG FORMAT TYPES ===

**Invariant:** Every tag has one of 6 format types that determines how its value is parsed.

| Format       | Parsing                        | Example                        |
| ------------ | ------------------------------ | ------------------------------ |
| flag         | Boolean presence, no value     | @libar-docs-core               |
| value        | Simple string                  | @libar-docs-pattern MyPattern  |
| enum         | Constrained to predefined list | @libar-docs-status completed   |
| csv          | Comma-separated values         | @libar-docs-uses A, B, C       |
| number       | Numeric value                  | @libar-docs-phase 15           |
| quoted-value | Preserves spaces               | @libar-docs-brief:'Multi word' |

=== SOURCE OWNERSHIP ===

**Invariant:** Relationship tags have defined ownership by source type. Anti-pattern detection enforces these boundaries.

| Tag        | Correct Source | Wrong Source  | Rationale                          |
| ---------- | -------------- | ------------- | ---------------------------------- |
| uses       | TypeScript     | Feature files | TS owns runtime dependencies       |
| depends-on | Feature files  | TypeScript    | Gherkin owns planning dependencies |
| quarter    | Feature files  | TypeScript    | Gherkin owns timeline metadata     |
| team       | Feature files  | TypeScript    | Gherkin owns ownership metadata    |

=== QUARTER FORMAT CONVENTION ===

**Invariant:** The quarter tag uses `YYYY-QN` format (e.g., `2026-Q1`). ISO-year-first sorting works lexicographically.

=== CANONICAL PHASE DEFINITIONS (6-PHASE USDP STANDARD) ===

**Invariant:** The default workflow defines exactly 6 phases in fixed order. These are the canonical phase names and ordinals used by all generated documentation.

| Order | Phase         | Purpose                                        |
| ----- | ------------- | ---------------------------------------------- |
| 1     | Inception     | Problem framing, scope definition              |
| 2     | Elaboration   | Design decisions, architecture exploration     |
| 3     | Session       | Planning and design session work               |
| 4     | Construction  | Implementation, testing, integration           |
| 5     | Validation    | Verification, acceptance criteria confirmation |
| 6     | Retrospective | Review, lessons learned, documentation         |

=== DELIVERABLE STATUS CANONICAL VALUES ===

**Invariant:** Deliverable status (distinct from pattern FSM status) uses exactly 6 values, enforced by Zod schema at parse time.

| Value       | Meaning              |
| ----------- | -------------------- |
| complete    | Work is done         |
| in-progress | Work is ongoing      |
| pending     | Work has not started |
| deferred    | Work postponed       |
| superseded  | Replaced by another  |
| n/a         | Not applicable       |
