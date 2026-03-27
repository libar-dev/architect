### Reference Generation Sample

#### Product area canonical values

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

#### ADR category canonical values

**Invariant:** The adr-category tag uses one of 4 values.

| Value         | Purpose                                       |
| ------------- | --------------------------------------------- |
| architecture  | System structure, component design, data flow |
| process       | Workflow, conventions, annotation rules       |
| testing       | Test strategy, verification approach          |
| documentation | Documentation generation, content structure   |

#### FSM status values and protection levels

**Invariant:** Pattern status uses exactly 4 values with defined protection levels. These are enforced by Process Guard at commit time.

| Status    | Protection   | Can Add Deliverables | Allowed Actions                 |
| --------- | ------------ | -------------------- | ------------------------------- |
| roadmap   | None         | Yes                  | Full editing                    |
| active    | Scope-locked | No                   | Edit existing deliverables only |
| completed | Hard-locked  | No                   | Requires unlock-reason tag      |
| deferred  | None         | Yes                  | Full editing                    |

#### Valid FSM transitions

**Invariant:** Only these transitions are valid. All others are rejected by Process Guard.

| From     | To        | Trigger               |
| -------- | --------- | --------------------- |
| roadmap  | active    | Start work            |
| roadmap  | deferred  | Postpone              |
| active   | completed | All deliverables done |
| active   | roadmap   | Blocked/regressed     |
| deferred | roadmap   | Resume planning       |

#### Tag format types

**Invariant:** Every tag has one of 6 format types that determines how its value is parsed.

| Format       | Parsing                        | Example                       |
| ------------ | ------------------------------ | ----------------------------- |
| flag         | Boolean presence, no value     | @architect-core               |
| value        | Simple string                  | @architect-pattern MyPattern  |
| enum         | Constrained to predefined list | @architect-status completed   |
| csv          | Comma-separated values         | @architect-uses A, B, C       |
| number       | Numeric value                  | @architect-phase 15           |
| quoted-value | Preserves spaces               | @architect-brief:'Multi word' |

#### Source ownership

**Invariant:** Relationship tags have defined ownership by source type. Anti-pattern detection enforces these boundaries.

| Tag        | Correct Source | Wrong Source  | Rationale                          |
| ---------- | -------------- | ------------- | ---------------------------------- |
| uses       | TypeScript     | Feature files | TS owns runtime dependencies       |
| depends-on | Feature files  | TypeScript    | Gherkin owns planning dependencies |
| quarter    | Feature files  | TypeScript    | Gherkin owns timeline metadata     |
| team       | Feature files  | TypeScript    | Gherkin owns ownership metadata    |

#### Quarter format convention

**Invariant:** The quarter tag uses `YYYY-QN` format (e.g., `2026-Q1`). ISO-year-first sorting works lexicographically.

#### Canonical phase definitions (6-phase USDP standard)

**Invariant:** The default workflow defines exactly 6 phases in fixed order. These are the canonical phase names and ordinals used by all generated documentation.

| Order | Phase         | Purpose                                        |
| ----- | ------------- | ---------------------------------------------- |
| 1     | Inception     | Problem framing, scope definition              |
| 2     | Elaboration   | Design decisions, architecture exploration     |
| 3     | Session       | Planning and design session work               |
| 4     | Construction  | Implementation, testing, integration           |
| 5     | Validation    | Verification, acceptance criteria confirmation |
| 6     | Retrospective | Review, lessons learned, documentation         |

#### Deliverable status canonical values

**Invariant:** Deliverable status (distinct from pattern FSM status) uses exactly 6 values, enforced by Zod schema at parse time.

| Value       | Meaning              |
| ----------- | -------------------- |
| complete    | Work is done         |
| in-progress | Work is ongoing      |
| pending     | Work has not started |
| deferred    | Work postponed       |
| superseded  | Replaced by another  |
| n/a         | Not applicable       |

#### API Types

| Type                      | Kind      |
| ------------------------- | --------- |
| normalizeStatus           | function  |
| DELIVERABLE_STATUS_VALUES | const     |
| CategoryDefinition        | interface |
| SectionBlock              | type      |

#### Behavior Specifications

##### ArchitectFactory

##### DefineConfig

##### ConfigBasedWorkflowDefinition

| Rule                                                 | Description                                                                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Default workflow is built from an inline constant    | **Invariant:** `loadDefaultWorkflow()` returns a `LoadedWorkflow` without<br> file system access. It cannot fail. The... |
| Custom workflow files still work via --workflow flag | **Invariant:** `loadWorkflowFromPath()` remains available for projects<br> that need custom workflow definitions. The... |
| FSM validation and Process Guard are not affected    | **Invariant:** The FSM transition matrix, protection levels, and Process<br> Guard rules remain hardcoded in...          |
| Workflow as a configurable preset field is deferred  | **Invariant:** The inline default workflow constant is the only workflow source until preset integration is...           |

##### ADR005CodecBasedMarkdownRendering

| Rule                                                              | Description                                                                                                           |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Codecs implement a decode-only contract                           | **Invariant:** Every codec is a pure function that accepts a MasterDataset<br> and returns a RenderableDocument....   |
| RenderableDocument is a typed intermediate representation         | **Invariant:** RenderableDocument contains a title, an ordered array of<br> SectionBlock elements, and an optional... |
| CompositeCodec assembles documents from child codecs              | **Invariant:** CompositeCodec accepts an array of child codecs and<br> produces a single RenderableDocument by...     |
| ADR content comes from both Feature description and Rule prefixes | **Invariant:** ADR structured content (Context, Decision, Consequences)<br> can appear in two locations within a...   |
| The markdown renderer is codec-agnostic                           | **Invariant:** The renderer accepts any RenderableDocument regardless of<br> which codec produced it. Rendering...    |

##### ADR001TaxonomyCanonicalValues

| Rule                                                | Description                                                                                                              |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Product area canonical values                       | **Invariant:** The product-area tag uses one of 7 canonical values.<br> Each value represents a reader-facing...         |
| ADR category canonical values                       | **Invariant:** The adr-category tag uses one of 4 values.<br> **Rationale:** Unbounded category values prevent...        |
| FSM status values and protection levels             | **Invariant:** Pattern status uses exactly 4 values with defined<br> protection levels. These are enforced by Process... |
| Valid FSM transitions                               | **Invariant:** Only these transitions are valid. All others are<br> rejected by Process Guard.<br> **Rationale:**...     |
| Tag format types                                    | **Invariant:** Every tag has one of 6 format types that determines<br> how its value is parsed.<br> **Rationale:**...    |
| Source ownership                                    | **Invariant:** Relationship tags have defined ownership by source type.<br> Anti-pattern detection enforces these...     |
| Quarter format convention                           | **Invariant:** The quarter tag uses `YYYY-QN` format (e.g., `2026-Q1`).<br> ISO-year-first sorting works...              |
| Canonical phase definitions (6-phase USDP standard) | **Invariant:** The default workflow defines exactly 6 phases in fixed<br> order. These are the canonical phase names...  |
| Deliverable status canonical values                 | **Invariant:** Deliverable status (distinct from pattern FSM status)<br> uses exactly 6 values, enforced by Zod...       |

##### ProcessGuardTesting

| Rule                                                | Description                                                                                                            |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Completed files require unlock-reason to modify     | **Invariant:** A completed spec file cannot be modified unless it carries an @architect-unlock-reason tag....          |
| Status transitions must follow PDR-005 FSM          | **Invariant:** Status changes must follow the directed graph: roadmap->active->completed, roadmap<->deferred,...       |
| Active specs cannot add new deliverables            | **Invariant:** A spec in active status cannot have deliverables added that were not present when it entered active.... |
| Files outside active session scope trigger warnings | **Invariant:** Files modified outside the active session's declared scope produce a session-scope warning....          |
| Explicitly excluded files trigger errors            | **Invariant:** Files explicitly excluded from a session cannot be modified, producing a session-excluded error....     |
| Multiple rules validate independently               | **Invariant:** Each validation rule evaluates independently — a single file can produce violations from multiple...    |
