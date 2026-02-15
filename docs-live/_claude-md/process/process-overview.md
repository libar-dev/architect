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

**Invariant:** Only these transitions are valid. All others are rejected by Process Guard. Completed is a terminal state. Modifications require `@libar-docs-unlock-reason` escape hatch.

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

=== BEHAVIOR SPECIFICATIONS ===

--- StepDefinitionCompletion ---

| Rule                                                                | Description                                                                                                        |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Generator-related specs need step definitions for output validation | **Invariant:** Step definitions test actual codec output against expected structure.<br> Factory functions from... |
| Renderable helper specs need step definitions for utility functions | **Invariant:** Helper functions are pure and easy to unit test.<br> Step definitions should test edge cases...     |
| Remaining specs in other directories need step definitions          | **Existing Specs:**<br> - `tests/features/generators/table-extraction.feature`<br> -...                            |
| Step definition implementation follows project patterns             | **Pattern:** All step definitions should follow the established patterns in<br> existing .steps.ts files for...    |

--- SessionFileCleanup ---

| Rule                                               | Description |
| -------------------------------------------------- | ----------- |
| Cleanup triggers during session-context generation |             |
| Only phase-\*.md files are candidates for cleanup  |             |
| Cleanup failures are non-fatal                     |             |

--- MvpWorkflowImplementation ---

| Rule                                 | Description |
| ------------------------------------ | ----------- |
| PDR-005 status values are recognized |             |
| Generators map statuses to documents |             |

--- LivingRoadmapCLI ---

--- EffortVarianceTracking ---

--- CliBehaviorTesting ---

| Rule                                                                    | Description                                                                                                             |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| generate-docs handles all argument combinations correctly               | **Invariant:** Invalid arguments produce clear error messages with usage hints.<br> Valid arguments produce expected... |
| lint-patterns validates annotation quality with configurable strictness | **Invariant:** Lint violations are reported with file, line, and severity.<br> Exit codes reflect violation presence... |
| validate-patterns performs cross-source validation with DoD checks      | **Invariant:** DoD and anti-pattern violations are reported per phase.<br> Exit codes reflect validation state....      |
| All CLIs handle errors consistently with DocError pattern               | **Invariant:** Errors include type, file, line (when applicable), and reason.<br> Unknown errors are caught and...      |

--- ADR003SourceFirstPatternArchitecture ---

| Rule                                         | Description                                                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| TypeScript source owns pattern identity      | **Invariant:** A pattern is defined by `@libar-docs-pattern` in a TypeScript<br> file — either a stub...                 |
| Tier 1 specs are ephemeral working documents | **Invariant:** Tier 1 roadmap specs serve planning and delivery tracking.<br> They are not the source of truth for...    |
| Three durable artifact types                 | **Invariant:** The delivery process produces three artifact types with<br> long-term value. All other artifacts are...   |
| Implements is UML Realization (many-to-one)  | **Invariant:** `@libar-docs-implements` declares a realization relationship.<br> Multiple files can implement the...     |
| Single-definition constraint                 | **Invariant:** `@libar-docs-pattern:X` may appear in exactly one file<br> across the entire codebase. The...             |
| Reverse links preferred over forward links   | **Invariant:** `@libar-docs-implements` (reverse: "I verify this pattern")<br> is the primary traceability mechanism.... |

--- ADR002GherkinOnlyTesting ---

| Rule                          | Description                                                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Source-driven process benefit | **Invariant:** Feature files serve as both executable specs and<br> documentation source. This dual purpose is the... |

--- ADR001TaxonomyCanonicalValues ---

| Rule                                    | Description                                                                                                                |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Product area canonical values           | **Invariant:** The product-area tag uses one of 7 canonical values.<br> Each value represents a reader-facing...           |
| ADR category canonical values           | **Invariant:** The adr-category tag uses one of 4 values.<br><br> \| Value \| Purpose \|<br> \| architecture \| System...  |
| FSM status values and protection levels | **Invariant:** Pattern status uses exactly 4 values with defined<br> protection levels. These are enforced by Process...   |
| Valid FSM transitions                   | **Invariant:** Only these transitions are valid. All others are<br> rejected by Process Guard.<br><br> \| From \| To \|... |
| Tag format types                        | **Invariant:** Every tag has one of 6 format types that determines<br> how its value is parsed.<br><br> \| Format \|...    |
| Source ownership                        | **Invariant:** Relationship tags have defined ownership by source type.<br> Anti-pattern detection enforces these...       |
| Quarter format convention               | **Invariant:** The quarter tag uses `YYYY-QN` format (e.g., `2026-Q1`).<br> ISO-year-first sorting works...                |
| Deliverable status canonical values     | **Invariant:** Deliverable status (distinct from pattern FSM status)<br> uses exactly 6 values, enforced by Zod...         |

--- SessionHandoffs ---

| Rule                                                          | Description                                                                                                             |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Handoff context generation captures session state             | **Invariant:** Active phases with handoff context enabled must include session handoff sections with template and...    |
| Handoff templates and checklists contain required sections    | **Invariant:** Session handoff template and retrospective checklist must exist and contain all required sections for... |
| PROCESS_SETUP.md documents handoff and coordination protocols | **Invariant:** PROCESS_SETUP.md must document both session handoff protocol and multi-developer coordination...         |
| Edge cases and acceptance criteria ensure robustness          | **Invariant:** Handoff context must degrade gracefully when no discoveries exist and must be disableable. Mid-phase...  |

--- SessionFileLifecycle ---
