# MethodologyReference

**Purpose:** Full documentation generated from decision document
**Detail Level:** detailed

---

**Problem:**
  The METHODOLOGY.md document explains the _why_ behind the delivery process.
  It describes the core thesis, dogfooding approach, workflow stages, annotation
  ownership strategy, and code stub patterns. Maintaining philosophy docs manually
  leads to drift from actual implementation patterns.

  **Solution:**
  Auto-generate methodology documentation from this annotated feature file.
  Key tables and conceptual frameworks are captured in Rule blocks.
  Approximately 10% of original content comes from structured tables.

  **Target Documents:**

| Output | Purpose | Detail Level |
| docs-generated/docs/METHODOLOGY-REFERENCE.md | Detailed human reference | detailed |
| docs-generated/_claude-md/methodology/methodology-reference.md | Compact AI context | summary |

  **Source Mapping:**

| Section | Source File | Extraction Method |
| --- | --- | --- |
| Core Thesis | THIS DECISION (Rule: Core Thesis) | Rule block table + narrative |
| Why Generated Documentation | THIS DECISION (Rule: Why Generated Documentation) | Rule block tables |
| Event Sourcing Insight | THIS DECISION (Rule: Event Sourcing Insight) | Rule block table |
| Dogfooding | THIS DECISION (Rule: Dogfooding) | Rule block with code examples |
| Four-Stage Workflow | THIS DECISION (Rule: Four-Stage Workflow) | Rule block table |
| Skip Conditions | THIS DECISION (Rule: Skip Conditions) | Rule block table |
| Annotation Ownership | THIS DECISION (Rule: Annotation Ownership) | Rule block tables |
| Example Annotation Split | THIS DECISION (Rule: Example Annotation Split) | Rule block code examples |
| Two-Tier Spec Architecture | THIS DECISION (Rule: Two-Tier Spec Architecture) | Rule block table |
| Code Stub Levels | THIS DECISION (Rule: Code Stub Levels) | Rule block table |
| Planning Stubs Architecture | THIS DECISION (Rule: Planning Stubs Architecture) | Rule block table |
| Pattern Extraction Workflow | THIS DECISION (Rule: Pattern Extraction Workflow) | Rule block tables |
| Related Documentation | THIS DECISION (Rule: Related Documentation) | Rule block table |

---

## Implementation Details

### Core Thesis

**Context:** Traditional documentation fails because it exists outside the code.
    Developers update code, forget to update docs, and the gap widens until docs become fiction.

    **Decision:** The USDP (Unified Software Delivery Process) inverts this:

| Traditional Approach | USDP Approach |
| --- | --- |
| Docs are written | Docs are generated |
| Status is tracked manually | Status is FSM-enforced |
| Requirements live in Jira | Requirements are Gherkin scenarios |
| AI agents parse stale Markdown | AI agents query typed APIs |

    **Principle:** Git is the event store. Documentation artifacts are projections.
    Annotated code is the single source of truth.

### Why Generated Documentation

**Context:** Generated documentation addresses fundamental problems with manual docs.

    **Manual Documentation Problems:**

| Problem | Impact |
| --- | --- |
| Docs exist outside code | Developers forget to update them |
| No validation | Stale docs become fiction |
| Duplicate information | Conflicts between sources |
| Status is opinion | No way to verify claims |
| Tribal knowledge | Information locked in heads |

    **Generated Documentation Benefits:**

| Benefit | How Achieved |
| --- | --- |
| Always current | Regenerated from source on every build |
| Single source of truth | Annotations in code ARE the docs |
| Machine-verifiable status | FSM enforces valid transitions |
| Typed queries | ProcessStateAPI provides structured access |
| No drift | Impossible for docs to diverge from code |

    **Cost-Benefit:**

| Investment | Return |
| --- | --- |
| Initial annotation setup | Elimination of all manual doc maintenance |
| Learning annotation syntax | Consistent documentation across team |
| Running generators | Always-accurate project state |
| FSM compliance | Prevented scope creep and invalid states |

    **When to Use Generated Docs:**

| Use Generated | Keep Manual |
| --- | --- |
| Pattern registry | Conceptual architecture guides |
| Roadmap status | Marketing materials |
| Business rules | Tutorials for external users |
| API reference | High-level overviews |
| Traceability | Changelog summaries |

### Event Sourcing Insight

**Context:** Event sourcing teaches us to derive state, not store it.
    Apply this to documentation.

    **Decision:** Documentation follows the event sourcing pattern:

| Event Sourcing Concept | Documentation Equivalent |
| --- | --- |
| Events | Git commits (changes to annotated code) |
| Projections | Generated docs (PATTERNS.md, ROADMAP.md) |
| Read Model | ProcessStateAPI (typed queries) |

    When you run generate-docs, you are rebuilding read models from the event stream.
    The source annotations are always authoritative.

### Dogfooding

**Context:** Every pattern in this package uses its own annotation system.

    **Decision:** Real examples from this codebase:

    **ProcessGuardDecider** (pure validation logic):

```typescript
/**
     * at-libar-docs
     * at-libar-docs-pattern ProcessGuardDecider
     * at-libar-docs-status completed
     * at-libar-docs-uses FSMTransitions, FSMStates
     * at-libar-docs-used-by LintModule
     */
    export function validateChanges(input: ValidationInput): ValidationOutput { ... }
```

**PatternScanner** (file discovery):

```typescript
/**
     * at-libar-docs
     * at-libar-docs-pattern PatternScanner
     * at-libar-docs-status completed
     * at-libar-docs-uses GherkinASTParser, TypeScriptASTParser
     * at-libar-docs-used-by Orchestrator, DualSourceExtractor
     */
    export async function scanPatterns(config: ScanConfig): Promise<ScannedFile[]> { ... }
```

Run pnpm docs:patterns and these annotations become a searchable pattern registry
    with dependency graphs.

### Four-Stage Workflow

**Context:** The delivery process follows four stages with clear inputs and outputs.

    **Decision:** The four stages are:

| Stage | Input | Output | FSM State |
| --- | --- | --- | --- |
| Ideation | Pattern brief | Roadmap spec (.feature) | roadmap |
| Design | Complex requirement | Decision specs + code stubs | roadmap |
| Planning | Roadmap spec | Implementation plan | roadmap |
| Coding | Implementation plan | Code + tests | roadmap to active to completed |

### Skip Conditions

**Invariant:** Stages may only be skipped when conditions below are met.
    **Rationale:** Prevents accidental omissions while allowing efficiency for simple tasks.
    **Verified by:** @acceptance-criteria Scenario: Reference generates Methodology documentation

    **Context:** Not all stages are required for every task.

    **Decision:** When to skip stages:

| Skip | When |
| --- | --- |
| Design | Single valid approach, straightforward implementation |
| Planning | Single-session work, clear scope |
| Neither | Multi-session work, architectural decisions |

### Annotation Ownership

**Context:** Feature files and code stubs serve different purposes.
    Split-Ownership Principle: Feature files own _what_ and _when_ (planning).
    Code stubs own _how_ and _with what_ (implementation). Neither duplicates the other.

    **Decision:** Feature files own planning metadata:

| Tag | Purpose |
| --- | --- |
| at-prefix-status | FSM state (roadmap, active, completed, deferred) |
| at-prefix-phase | Milestone sequencing |
| at-prefix-depends-on | Pattern-level roadmap dependencies |
| at-prefix-enables | What this unblocks |
| at-prefix-release | Version targeting |

    Code stubs own implementation metadata:

| Tag | Purpose |
| --- | --- |
| at-prefix-uses | Technical dependencies (what this calls) |
| at-prefix-used-by | Technical consumers (what calls this) |
| at-prefix-usecase | When/how to use |
| Category flags | Domain classification (core, api, infra, etc.) |

### Example Annotation Split

**Context:** Demonstrates the split between feature files and code stubs.

    **Decision:** Feature file (specs/my-pattern.feature):

```gherkin
at-libar-docs
    at-libar-docs-pattern:EventStoreDurability
    at-libar-docs-status:roadmap
    at-libar-docs-phase:18
    at-libar-docs-depends-on:EventStoreFoundation
    at-libar-docs-enables:SagaEngine
    Feature: Event Store Durability
```

Code stub (src/event-store/durability.ts):

```typescript
/**
     * at-libar-docs
     * at-libar-docs-status roadmap
     * at-libar-docs-event-sourcing
     * at-libar-docs-uses EventStoreFoundation, Workpool
     * at-libar-docs-used-by SagaEngine, CommandOrchestrator
     */
```

Note: Code stubs must NOT use at-prefix-pattern. The feature file is the canonical pattern definition.

### Two-Tier Spec Architecture

**Context:** Specifications are organized in two tiers for different purposes.

    **Decision:** The two tiers are:

| Tier | Location | Purpose | Executable |
| --- | --- | --- | --- |
| Roadmap | specs/area/ | Planning, deliverables, acceptance criteria | No |
| Package | pkg/tests/features/ | Implementation proof, regression testing | Yes |

    **Traceability:**
    - Roadmap spec: at-prefix-executable-specs:package/tests/features/behavior/feature
    - Package spec: at-prefix-implements:PatternName

    This separation keeps test output clean (no roadmap noise) while maintaining
    bidirectional traceability.

### Code Stub Levels

**Context:** Code is the source of truth. Feature files reference code, not duplicate it.

    **Decision:** Code stubs come in three levels:

| Level | Contains | When |
| --- | --- | --- |
| Minimal | JSDoc annotations only | Quick exploration |
| Interface | Types + stub functions | API contracts |
| Partial | Working code + some stubs | Progressive implementation |

    **Minimal Stub Example:**

```typescript
/**
     * at-libar-docs
     * at-libar-docs-status roadmap
     *
     * Reservation Pattern - TTL-Based Pre-Creation Uniqueness
     */
    export function reserve(ctx: MutationCtx, args: ReserveArgs): Promise<ReservationResult> {
      throw new Error('Not yet implemented - roadmap pattern');
    }
```

### Planning Stubs Architecture

**Context:** Step definitions created during Planning sessions need a separate location
    excluded from test execution.

    **Decision:** Directory structure:

```text
tests/
      steps/              Planning executable (included in test runner)
      planning-stubs/     Not yet implemented (excluded)
      features/           Feature files
```

Phase progression:

| Phase | Location | Status |
| --- | --- | --- |
| Planning | planning-stubs/ | throw new Error("Not implemented") |
| Implementation | Move to steps/ | Replace with real logic |
| Completed | steps/ | Fully executable |

    This avoids .skip() (forbidden by test safety policy) while preserving planning artifacts.

### Pattern Extraction Workflow

**Context:** Understanding how patterns flow from source to docs.

    **Extraction Pipeline:**

| Stage | Input | Output | Module |
| --- | --- | --- | --- |
| 1. Scan | File patterns | File list | src/scanner/ |
| 2. Parse | Files | AST nodes | TypeScript/Gherkin parsers |
| 3. Extract | AST nodes | Pattern objects | src/extractor/ |
| 4. Transform | Patterns | MasterDataset | src/generators/pipeline/ |
| 5. Render | MasterDataset | RenderableDocument | src/renderable/ |
| 6. Output | RenderableDocument | Markdown files | Codec system |

    **What Gets Extracted:**

| Source | Extracted Data |
| --- | --- |
| TypeScript JSDoc | Pattern name, status, uses, used-by, category flags |
| Feature file tags | Pattern name, status, phase, depends-on, enables |
| Feature description | Problem/Solution content, tables, lists |
| Rule blocks | Business constraints, invariants, rationale |
| Background tables | Deliverables with status |
| Scenarios | Acceptance criteria, test coverage |

    **Annotation Syntax:**

| Annotation Type | TypeScript Syntax | Gherkin Syntax |
| --- | --- | --- |
| Opt-in marker | at-libar-docs (JSDoc) | at-libar-docs (feature tag) |
| Pattern name | at-libar-docs-pattern Name | at-libar-docs-pattern:Name |
| Status | at-libar-docs-status active | at-libar-docs-status:active |
| Dependencies | at-libar-docs-uses A, B | at-libar-docs-depends-on:A |
| Category | at-libar-docs-core | at-libar-docs-core |

    **MasterDataset Structure:**

    The MasterDataset is the central data structure with pre-computed views:
    - byName: O(1) pattern lookup by name
    - byCategory: Patterns grouped by category
    - byStatus: Patterns grouped by FSM status
    - bySource: Patterns grouped by file type (typescript, gherkin)
    - dependencies: Computed dependency graph
    - metrics: Aggregate statistics

### Related Documentation

**Context:** This methodology document connects to other documentation.

    **Decision:** Related documents:

| Document | Purpose |
| --- | --- |
| README.md | Quick start, FSM diagram, ProcessStateAPI usage |
| PROCESS-GUARD.md | FSM validation rules, protection levels, CLI |
| CONFIGURATION.md | Tag prefixes, presets, customization |
| GHERKIN-PATTERNS.md | Writing effective specs |
| INSTRUCTIONS.md | Complete tag reference |
| ARCHITECTURE-REFERENCE.md | Four-stage pipeline details |
