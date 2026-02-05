@libar-docs
@libar-docs-pattern:MethodologyReference
@libar-docs-status:roadmap
@libar-docs-phase:99
@libar-docs-core
@libar-docs-claude-md-section:methodology
Feature: Methodology Reference - Auto-Generated Documentation

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
| Event Sourcing Insight | THIS DECISION (Rule: Event Sourcing Insight) | Rule block table |
| Dogfooding | THIS DECISION (Rule: Dogfooding) | Rule block with code examples |
| Four-Stage Workflow | THIS DECISION (Rule: Four-Stage Workflow) | Rule block table |
| Skip Conditions | THIS DECISION (Rule: Skip Conditions) | Rule block table |
| Annotation Ownership | THIS DECISION (Rule: Annotation Ownership) | Rule block tables |
| Example Annotation Split | THIS DECISION (Rule: Example Annotation Split) | Rule block code examples |
| Two-Tier Spec Architecture | THIS DECISION (Rule: Two-Tier Spec Architecture) | Rule block table |
| Code Stub Levels | THIS DECISION (Rule: Code Stub Levels) | Rule block table |
| Planning Stubs Architecture | THIS DECISION (Rule: Planning Stubs Architecture) | Rule block table |
| Related Documentation | THIS DECISION (Rule: Related Documentation) | Rule block table |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Methodology reference feature file | Complete | specs/docs/methodology-reference.feature |
      | Generated detailed docs | Pending | docs-generated/docs/METHODOLOGY-REFERENCE.md |
      | Generated compact docs | Pending | docs-generated/_claude-md/methodology/methodology-reference.md |

  Rule: Core Thesis

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

  Rule: Event Sourcing Insight

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

  Rule: Dogfooding

    **Context:** Every pattern in this package uses its own annotation system.

    **Decision:** Real examples from this codebase:

    **ProcessGuardDecider** (pure validation logic):

    """typescript
    /**
     * at-libar-docs
     * at-libar-docs-pattern ProcessGuardDecider
     * at-libar-docs-status completed
     * at-libar-docs-uses FSMTransitions, FSMStates
     * at-libar-docs-used-by LintModule
     */
    export function validateChanges(input: ValidationInput): ValidationOutput { ... }
    """

    **PatternScanner** (file discovery):

    """typescript
    /**
     * at-libar-docs
     * at-libar-docs-pattern PatternScanner
     * at-libar-docs-status completed
     * at-libar-docs-uses GherkinASTParser, TypeScriptASTParser
     * at-libar-docs-used-by Orchestrator, DualSourceExtractor
     */
    export async function scanPatterns(config: ScanConfig): Promise<ScannedFile[]> { ... }
    """

    Run pnpm docs:patterns and these annotations become a searchable pattern registry
    with dependency graphs.

  Rule: Four-Stage Workflow

    **Context:** The delivery process follows four stages with clear inputs and outputs.

    **Decision:** The four stages are:

| Stage | Input | Output | FSM State |
| --- | --- | --- | --- |
| Ideation | Pattern brief | Roadmap spec (.feature) | roadmap |
| Design | Complex requirement | Design document | roadmap |
| Planning | Roadmap spec | Implementation plan | roadmap |
| Coding | Implementation plan | Code + tests | roadmap to active to completed |

  Rule: Skip Conditions

    **Context:** Not all stages are required for every task.

    **Decision:** When to skip stages:

| Skip | When |
| --- | --- |
| Design | Single valid approach, straightforward implementation |
| Planning | Single-session work, clear scope |
| Neither | Multi-session work, architectural decisions |

  Rule: Annotation Ownership

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

  Rule: Example Annotation Split

    **Context:** Demonstrates the split between feature files and code stubs.

    **Decision:** Feature file (specs/my-pattern.feature):

    """gherkin
    at-libar-docs
    at-libar-docs-pattern:EventStoreDurability
    at-libar-docs-status:roadmap
    at-libar-docs-phase:18
    at-libar-docs-depends-on:EventStoreFoundation
    at-libar-docs-enables:SagaEngine
    Feature: Event Store Durability
    """

    Code stub (src/event-store/durability.ts):

    """typescript
    /**
     * at-libar-docs
     * at-libar-docs-status roadmap
     * at-libar-docs-event-sourcing
     * at-libar-docs-uses EventStoreFoundation, Workpool
     * at-libar-docs-used-by SagaEngine, CommandOrchestrator
     */
    """

    Note: Code stubs must NOT use at-prefix-pattern. The feature file is the canonical pattern definition.

  Rule: Two-Tier Spec Architecture

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

  Rule: Code Stub Levels

    **Context:** Code is the source of truth. Feature files reference code, not duplicate it.

    **Decision:** Code stubs come in three levels:

| Level | Contains | When |
| --- | --- | --- |
| Minimal | JSDoc annotations only | Quick exploration |
| Interface | Types + stub functions | API contracts |
| Partial | Working code + some stubs | Progressive implementation |

    **Minimal Stub Example:**

    """typescript
    /**
     * at-libar-docs
     * at-libar-docs-status roadmap
     *
     * Reservation Pattern - TTL-Based Pre-Creation Uniqueness
     */
    export function reserve(ctx: MutationCtx, args: ReserveArgs): Promise<ReservationResult> {
      throw new Error('Not yet implemented - roadmap pattern');
    }
    """

  Rule: Planning Stubs Architecture

    **Context:** Step definitions created during Planning sessions need a separate location
    excluded from test execution.

    **Decision:** Directory structure:

    """
    tests/
      steps/              Planning executable (included in test runner)
      planning-stubs/     Not yet implemented (excluded)
      features/           Feature files
    """

    Phase progression:

| Phase | Location | Status |
| --- | --- | --- |
| Planning | planning-stubs/ | throw new Error("Not implemented") |
| Implementation | Move to steps/ | Replace with real logic |
| Completed | steps/ | Fully executable |

    This avoids .skip() (forbidden by test safety policy) while preserving planning artifacts.

  Rule: Related Documentation

    **Context:** This methodology document connects to other documentation.

    **Decision:** Related documents:

| Document | Purpose |
| --- | --- |
| README.md | Quick start, FSM diagram, ProcessStateAPI usage |
| PROCESS-GUARD.md | FSM validation rules, protection levels, CLI |
| CONFIGURATION.md | Tag prefixes, presets, customization |
| GHERKIN-PATTERNS.md | Writing effective specs |
| INSTRUCTIONS.md | Complete tag reference |

  @acceptance-criteria
  Scenario: Reference generates Methodology documentation
    Given this decision document with source mapping table
    When running doc-from-decision generator
    Then detailed docs are generated with core thesis
    And compact docs are generated with essential reference
    And four-stage workflow table is present
    And annotation ownership tables are present
    And two-tier spec architecture table is present
    And code stub levels table is present
    And planning stubs architecture is documented
