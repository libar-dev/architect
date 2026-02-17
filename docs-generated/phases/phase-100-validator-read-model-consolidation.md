# ValidatorReadModelConsolidation

**Purpose:** Detailed patterns for ValidatorReadModelConsolidation

---

## Summary

**Progress:** [███░░░░░░░░░░░░░░░░░] 2/15 (13%)

| Status | Count |
| --- | --- |
| ✅ Completed | 2 |
| 🚧 Active | 0 |
| 📋 Planned | 13 |
| **Total** | 15 |

---

## 📋 Planned Patterns

### 📋 Architecture Delta

| Property | Value |
| --- | --- |
| Status | planned |
| Effort | 2d |
| Business Value | document release changes automatically |

**Problem:**
  Architecture evolution is not visible between releases.
  Breaking changes are not clearly documented.
  New constraints introduced by phases are hard to track.
  No automated way to generate "what changed" for a release.

  **Solution:**
  Generate ARCH-DELTA.md showing changes since last release:
  - New patterns introduced (with ADR references)
  - Deprecated patterns (with replacement guidance)
  - New constraints (with rationale)
  - Breaking changes (with migration notes)

  Uses git tags to determine release boundaries.
  Uses @libar-docs-decision, @libar-docs-replaces annotations.

  Implements Convergence Opportunity 5: Architecture Change Control.

#### Acceptance Criteria

**Generate delta between releases**

- Given patterns annotated with decision tags
- And git tags marking release versions
- When running architecture delta generator for v0.2.0
- Then report shows new patterns since v0.1.0
- And deprecated patterns are listed with replacements
- And ADR references are included

**Highlight breaking changes**

- Given patterns with replaces annotations
- When generating architecture delta
- Then breaking changes section is populated
- And migration guidance is included where available

**Show new constraints by phase**

- Given phases introducing new constraints
- When generating architecture delta
- Then constraints are listed with introducing phase
- And rationale from ADRs is summarized

---

### 📋 Business Rules Generator

| Property | Value |
| --- | --- |
| Status | planned |
| Effort | 3d |

**Business Value:** Enable stakeholders to understand domain constraints without reading
  implementation details or full feature files.

  **How It Works:**
  - Extract `Rule:` blocks from feature files
  - Parse `**Invariant:**` and `**Rationale:**` annotations
  - Generate organized Business Rules document by domain/phase
  - Include traceability via `**Verified by:**` links to scenarios

  **Why It Matters:**
  | Benefit | How |
  | Domain knowledge capture | Invariants document what must always be true |
  | Onboarding acceleration | New developers understand constraints quickly |
  | Business alignment | Rationale explains why constraints exist |
  | Audit readiness | Traceability shows which tests verify each rule |

#### Acceptance Criteria

**Extracts annotated Rule with Invariant and Rationale**

- Given a feature file with a Rule block:
- When the business rules generator runs
- Then output should include rule "Reservations prevent race conditions"
- And output should include invariant "Only one reservation can exist..."
- And output should include rationale "Check-then-create patterns..."
- And output should include verification link to "Concurrent reservations scenario"

```gherkin
Rule: Reservations prevent race conditions

  **Invariant:** Only one reservation can exist for a given key at a time.

  **Rationale:** Check-then-create patterns have TOCTOU vulnerabilities.

  **Verified by:** Concurrent reservations scenario
```

**Extracts unannotated Rule with name only**

- Given a feature file with a Rule block without annotations:
- When the business rules generator runs
- Then output should include rule "Events are immutable"
- And output should include description "Events cannot be modified..."
- And invariant should be marked as "not specified"

```gherkin
Rule: Events are immutable
  Events cannot be modified after creation.
```

**Groups rules by domain category**

- Given feature files with these domain tags:
- When the business rules generator runs
- Then output should have section "## DDD Patterns"
- And output should have section "## Event Sourcing Patterns"
- And output should have section "## CQRS Patterns"

| Feature | Domain Tag | Rule |
| --- | --- | --- |
| reservation-pattern.feature | @libar-docs-ddd | Reservations prevent race conditions |
| event-store.feature | @libar-docs-event-sourcing | Events are immutable |
| projection-categories.feature | @libar-docs-cqrs | Projections must declare category |

**Orders rules by phase within domain**

- Given feature files with these phases:
- When the business rules generator runs
- Then Phase 16 rules should appear before Phase 20 rules

| Feature | Phase | Rule |
| --- | --- | --- |
| ecst-fat-events.feature | 20 | Events contain full context |
| reservation-pattern.feature | 20 | Reservations prevent race conditions |
| dynamic-consistency.feature | 16 | DCB enables cross-entity validation |

**Includes code examples from DocStrings**

- Given a Rule containing DocStrings with "Current State" and "Target State" code examples
- When the business rules generator runs
- Then output should include fenced TypeScript code block for current state
- And output should include fenced TypeScript code block for target state
- And code blocks should preserve syntax highlighting hints

**Includes comparison tables**

- Given a Rule containing a markdown table with columns "Category", "Query Pattern", "Client Exposed"
- And the table has rows for "Logic" and "View" categories
- When the business rules generator runs
- Then output should include the table with all columns
- And output should include all rows from the original table

**Generates scenario verification links**

- Given a Rule with Verified by annotation:
- When the business rules generator runs
- Then output should include "Verified by:" section
- And output should link to "Concurrent reservations" scenario
- And output should link to "Expired reservation cleanup" scenario

```gherkin
Rule: Reservations prevent race conditions
  **Verified by:** Concurrent reservations, Expired reservation cleanup
```

**Links include feature file locations**

- Given scenarios are in "reservation-pattern.feature"
- When the business rules generator generates links
- Then links should include file path "reservation-pattern.feature"
- And links should include line numbers if available

#### Business Rules

**Extracts Rule blocks with Invariant and Rationale**

**Invariant:** Every `Rule:` block with `**Invariant:**` annotation must be extracted.
    Rules without annotations are included with rule name only.

    **Rationale:** Business rules are the core domain constraints. Extracting them separately
    from acceptance criteria creates a focused reference document for domain understanding.

    **Verified by:** Extracts annotated Rule, Extracts unannotated Rule

_Verified by: Extracts annotated Rule with Invariant and Rationale, Extracts unannotated Rule with name only_

**Organizes rules by domain category and phase**

**Invariant:** Rules are grouped first by domain category (from `@libar-docs-*` flags),
    then by phase number for temporal ordering.

    **Rationale:** Domain-organized documentation helps stakeholders find rules relevant
    to their area of concern without scanning all rules.

    **Verified by:** Groups rules by domain, Orders by phase within domain

_Verified by: Groups rules by domain category, Orders rules by phase within domain_

**Preserves code examples and comparison tables**

**Invariant:** DocStrings (`"""typescript`) and tables in Rule descriptions are
    rendered in the business rules document.

    **Rationale:** Code examples and tables provide concrete understanding of abstract
    rules. Removing them loses critical context.

    **Verified by:** Includes code examples, Includes tables

_Verified by: Includes code examples from DocStrings, Includes comparison tables_

**Generates scenario traceability links**

**Invariant:** Each rule's `**Verified by:**` section generates links to the
    scenarios that verify the rule.

    **Rationale:** Traceability enables audit compliance and helps developers find
    relevant tests when modifying rules.

    **Verified by:** Generates scenario links, Links include file locations

_Verified by: Generates scenario verification links, Links include feature file locations_

---

### 📋 Cross Source Validation

| Property | Value |
| --- | --- |
| Status | planned |
| Effort | 4h |
| Business Value | detect inconsistencies between typescript and gherkin sources |

**Problem:**
  The delivery process uses dual sources (TypeScript phase files and Gherkin
  feature files) that must remain consistent. Currently there's no validation
  to detect:
  - Pattern name mismatches
  - Missing spec file references
  - Circular dependency chains
  - Orphaned deliverables (not linked to any phase)

  **Solution:**
  Implement cross-source validation that scans both source types and
  detects inconsistencies, broken references, and logical errors.

#### Acceptance Criteria

**Pattern name mismatch detected**

- Given TypeScript phase file with @libar-docs-pattern MyPattern
- And feature file with @libar-docs-pattern:MyPatern (typo)
- When validating pattern names
- Then warning suggests "Did you mean MyPattern? Found MyPatern"

**Pattern names match across sources**

- Given TypeScript phase file with @libar-docs-pattern SessionHandoffs
- And feature file with @libar-docs-pattern:SessionHandoffs
- When validating pattern names
- Then validation passes

**Direct circular dependency**

- Given Phase A with @depends-on:PhaseB
- And Phase B with @depends-on:PhaseA
- When validating dependencies
- Then error indicates "Circular dependency: PhaseA -> PhaseB -> PhaseA"

**Transitive circular dependency**

- Given Phase A with @depends-on:PhaseB
- And Phase B with @depends-on:PhaseC
- And Phase C with @depends-on:PhaseA
- When validating dependencies
- Then error indicates "Circular dependency: PhaseA -> PhaseB -> PhaseC -> PhaseA"

**Dependency references non-existent pattern**

- Given Phase A with @depends-on:NonExistentPattern
- When validating dependencies
- Then error indicates "Unresolved dependency: NonExistentPattern"
- And similar pattern names are suggested if available

**All dependencies resolve**

- Given Phase A with @depends-on:PhaseB
- And PhaseB exists
- When validating dependencies
- Then validation passes

#### Business Rules

**Pattern names must be consistent across sources**

_Verified by: Pattern name mismatch detected, Pattern names match across sources_

**Circular dependencies are detected**

_Verified by: Direct circular dependency, Transitive circular dependency_

**Dependency references must resolve**

_Verified by: Dependency references non-existent pattern, All dependencies resolve_

---

### 📋 DoD Validation

| Property | Value |
| --- | --- |
| Status | planned |
| Effort | 3d |
| Business Value | enable machine checkable phase completion |

**Problem:**
  Phase completion is currently subjective ("done when we feel it").
  No objective criteria validation, easy to miss deliverables.
  Cannot gate CI/releases on DoD compliance.

  **Solution:**
  Implement `pnpm validate:dod --phase N` CLI command that:
  - Checks all deliverables have status "Complete"/"Done"
  - Verifies at least one @acceptance-criteria scenario exists
  - Warns if effort-actual is missing for completed phases
  - Returns exit code for CI gating

  Implements Convergence Opportunity 2: DoD as Machine-Checkable.

  See: docs/ideation-convergence/01-delivery-process-opportunities.md

#### Acceptance Criteria

**Validate DoD for completed phase**

- Given a phase with all deliverables marked "Complete"
- And at least one @acceptance-criteria scenario exists
- When running pnpm validate:dod --phase N
- Then exit code is 0
- And report shows "DoD met"

**Detect incomplete DoD**

- Given a phase marked "completed" with incomplete deliverables
- When running pnpm validate:dod --phase N
- Then exit code is 1
- And report lists incomplete deliverables

**Warn on missing effort-actual**

- Given a completed phase without effort-actual metadata
- When running pnpm validate:dod --phase N
- Then warning is emitted for missing variance data
- But exit code is still 0 (warning, not error)

---

### 📋 Effort Variance Tracking

| Property | Value |
| --- | --- |
| Status | planned |
| Effort | 2d |
| Business Value | track planned vs actual effort variance |

**Problem:**
  No systematic way to track planned vs actual effort.
  Cannot learn from estimation accuracy patterns.
  No visibility into "where time goes" across workflows.

  **Solution:**
  Generate EFFORT-ANALYSIS.md report showing:
  - Phase burndown (planned vs actual per phase)
  - Estimation accuracy trends over time
  - Time distribution by workflow type (design, implementation, testing, docs)

  Uses effort and effort-actual metadata from TypeScript phase files.
  Uses workflow metadata for time distribution analysis.

  Implements Convergence Opportunity 3: Earned-Value Tracking (lightweight).

#### Dependencies

- Depends on: MvpWorkflowImplementation

#### Acceptance Criteria

**Generate phase variance report**

- Given TypeScript phase files with effort and effort-actual metadata
- When running effort analysis generator
- Then report shows variance per phase (planned - actual)
- And variance percentage is calculated
- And overall accuracy trend is shown

**Generate workflow time distribution**

- Given TypeScript phase files with workflow metadata
- When running effort analysis generator
- Then report shows effort breakdown by workflow type
- And percentages show where time is spent

---

### 📋 Living Roadmap CLI

| Property | Value |
| --- | --- |
| Status | planned |
| Effort | 5d |
| Business Value | query roadmap with natural language |

**Problem:**
  Roadmap is a static document that requires regeneration.
  No interactive way to answer "what's next?" or "what's blocked?"
  Critical path analysis requires manual inspection.

  **Solution:**
  Add interactive CLI commands for roadmap queries:
  - `pnpm roadmap:next` - Show next actionable phase
  - `pnpm roadmap:blocked` - Show phases waiting on dependencies
  - `pnpm roadmap:path-to --phase N` - Show critical path to target
  - `pnpm roadmap:status` - Quick summary (completed/active/roadmap counts)

  This is the capstone for Setup A (Framework Roadmap OS).
  Transforms roadmap from "document to maintain" to "queries over reality".

  Implements Convergence Opportunity 8: Living Roadmap That Compiles.

#### Dependencies

- Depends on: MvpWorkflowImplementation

#### Acceptance Criteria

**Query next actionable phase**

- Given TypeScript phase files with dependencies and status
- When running pnpm roadmap:next
- Then output shows the next phase that can be started
- And dependencies are verified as complete
- And estimated effort is shown

**Query blocked phases**

- Given TypeScript phase files with depends-on metadata
- When running pnpm roadmap:blocked
- Then output shows phases waiting on incomplete dependencies
- And blocking dependencies are listed per phase

**Calculate critical path to target**

- Given a target phase with transitive dependencies
- When running pnpm roadmap:path-to --phase N
- Then output shows all phases that must complete first
- And total estimated effort is calculated
- And phases are ordered by dependency graph

**Quick status summary**

- Given TypeScript phase files with completed, active, and roadmap status
- When running pnpm roadmap:status
- Then output shows counts per status
- And overall progress percentage is shown
- And active phase details are highlighted

---

### 📋 Phase Numbering Conventions

| Property | Value |
| --- | --- |
| Status | planned |
| Effort | 2h |
| Business Value | prevent phase number conflicts and ensure consistent ordering |

**Problem:**
  Phase numbers are assigned manually without validation, leading to
  potential conflicts (duplicate numbers), gaps that confuse ordering,
  and inconsistent conventions across sources.

  **Solution:**
  Define and validate phase numbering conventions:
  - Unique phase numbers per release version
  - Gap detection and warnings
  - Cross-source consistency validation
  - Suggested next phase number

#### Acceptance Criteria

**Duplicate phase numbers are detected**

- Given two phases both numbered 47
- When validating phase numbers
- Then error indicates "Duplicate phase number 47 found in files: ..."
- And both file paths are listed

**Same phase number in different releases is allowed**

- Given phase 14 in v0.2.0
- And phase 14 in v0.3.0
- When validating phase numbers
- Then validation passes (different releases)

**Large gaps trigger warnings**

- Given phases numbered 1, 2, 3, 10
- When validating phase numbers
- Then warning indicates "Gap detected: phases 4-9 missing"

**Small gaps are acceptable**

- Given phases numbered 1, 2, 4, 5
- When validating phase numbers
- Then validation passes (single gap acceptable)

**Suggest next phase number**

- Given existing phases 47, 48, 50
- When running "suggest-phase" command
- Then output suggests 49 (fills gap) or 51 (continues sequence)
- And output shows context of existing phases

#### Business Rules

**Phase numbers must be unique within a release**

_Verified by: Duplicate phase numbers are detected, Same phase number in different releases is allowed_

**Phase number gaps are detected**

_Verified by: Large gaps trigger warnings, Small gaps are acceptable_

**CLI suggests next available phase number**

_Verified by: Suggest next phase number_

---

### 📋 Process API Layered Extraction

| Property | Value |
| --- | --- |
| Status | planned |
| Effort | 5d |
| Business Value | separate cli shell from domain logic in process api |

**Problem:**
  `process-api.ts` is 1,700 lines containing three distinct responsibilities
  in one file: CLI shell (arg parsing, help, output formatting), pipeline
  orchestration (scan, extract, transform), and subcommand domain logic
  (rules grouping, stub resolution, scope validation).

  The subcommand handlers are feature consumers of the MasterDataset —
  per ADR-006 they belong in the API layer, not the CLI layer. Some already
  have API counterparts (`context-assembler.ts`, `arch-queries.ts`,
  `scope-validator.ts`), but others (`handleRules`, `handleStubs`,
  `handleDecisions`, `handlePdr`) do domain logic inline in the CLI file.

  This means:
  - Domain logic is only accessible via CLI (not programmatically testable)
  - `handleRules()` alone is 183 lines building its own Map hierarchies
  - Adding a new query requires modifying the CLI file
  - Pipeline orchestration is duplicated between process-api.ts,
    orchestrator.ts, and validate-patterns.ts (three consumers wiring
    the same scan-extract-transform sequence)

  **Solution:**
  Extract process-api.ts into three clean layers that mirror the project's
  own architecture (ADR-006 boundary: orchestration vs feature consumption):

  | Layer | Responsibility | Location |
  | CLI Shell | Arg parsing, help text, output formatting, error envelope | src/cli/process-api.ts (slim) |
  | Pipeline Factory | Shared scan-extract-transform sequence | src/generators/pipeline/ (reusable) |
  | Query Handlers | Domain logic consuming MasterDataset | src/api/ modules |

  The CLI becomes a thin routing layer: parse args, call pipeline factory,
  route subcommand to API module, format output. No domain logic in the CLI.

  This also enables the ValidatorReadModelConsolidation spec — once the
  pipeline factory exists, validate-patterns.ts can consume it instead of
  wiring its own mini-pipeline.

#### Dependencies

- Depends on: ValidatorReadModelConsolidation

#### Acceptance Criteria

**CLI routing shell**

- Given the refactored process-api.ts
- When inspecting the module
- Then no Map or Set construction exists in handler functions
- And each subcommand delegates to an src/api/ module
- And process-api.ts is under 500 lines

**Pipeline factory is shared**

- Given orchestrator.ts, process-api.ts, and validate-patterns.ts
- When each needs a MasterDataset
- Then each calls the shared pipeline factory
- And no consumer independently imports from scanner/ and extractor/

**No parallel pipelines**

- Given the codebase after refactoring
- When searching for scanPatterns imports outside pipeline/
- Then only the pipeline factory and lint-patterns.ts import it

**Domain logic in API modules**

- Given handleRules business rules grouping logic
- When extracted to src/api/rules-query.ts
- Then the module exports a pure function taking MasterDataset
- And the CLI handler calls it and formats the result
- And the function is independently testable

#### Business Rules

**CLI file contains only routing, no domain logic**

**Invariant:** `process-api.ts` parses arguments, calls a pipeline
    factory for the MasterDataset, routes subcommands to API modules, and
    formats output. It does not build Maps, filter patterns, group data,
    or resolve relationships.

    **Verified by:** CLI routing shell, Domain logic in API modules

_Verified by: CLI routing shell_

**Pipeline factory is shared across consumers**

**Invariant:** The scan-extract-transform sequence is defined once in a
    reusable factory. All consumers that need a MasterDataset — orchestrator,
    process-api, validate-patterns — call the same factory rather than wiring
    the pipeline independently.

    **Verified by:** Pipeline factory is shared, No parallel pipelines

_Verified by: Pipeline factory is shared, No parallel pipelines_

**Domain logic lives in API modules**

**Invariant:** Query logic that operates on MasterDataset lives in
    `src/api/` modules. This makes it programmatically testable, reusable
    by future consumers (e.g. MCP server, watch mode), and aligned with
    the feature-consumption layer defined in ADR-006.

_Verified by: Domain logic in API modules_

---

### 📋 Progressive Governance

| Property | Value |
| --- | --- |
| Status | planned |
| Effort | 2d |
| Business Value | filter work by risk and priority |

**Problem:**
  Enterprise governance patterns applied everywhere create overhead.
  Simple utility patterns don't need risk tables and stakeholder approvals.
  No way to filter views by governance level.

  **Solution:**
  Enable governance as a lens, not a mandate:
  - Default: Lightweight (no risk/compliance tags required)
  - Opt-in: Rich governance for high-risk patterns only

  Use risk metadata to:
  - Filter roadmap views by risk level
  - Require additional metadata only for high-risk patterns
  - Generate risk-focused dashboards when requested

  Implements Convergence Opportunity 6: Progressive Governance.

  Note: This is lower priority because simple --filter "risk=high" on
  existing generators achieves 80% of the value. This phase adds polish.

#### Acceptance Criteria

**Filter roadmap by risk level**

- Given TypeScript phase files with varying risk levels
- When generating roadmap with --filter "risk=high"
- Then only high-risk phases appear in output
- And risk level is prominently displayed

**Lint rules for high-risk patterns**

- Given a pattern with high risk level
- When running lint validation
- Then warning is emitted if risk mitigation is not documented
- And suggestion to add Background risk table is shown

**Generate risk summary view**

- Given phases with risk metadata across the roadmap
- When generating risk summary
- Then patterns are grouped by risk level
- And high-risk items show mitigation status

---

### 📋 Release Association Rules

| Property | Value |
| --- | --- |
| Status | planned |
| Effort | 3h |
| Business Value | enforce separation of specs from release metadata |

**Problem:**
  PDR-002 and PDR-003 define conventions for separating specs from release
  metadata, but there's no automated enforcement. Spec files may
  inadvertently include release columns, and TypeScript phase files may
  have incorrect structure.

  **Solution:**
  Implement validation rules for:
  - Spec file compliance (no release columns in DataTables)
  - TypeScript phase file structure
  - Cross-reference validation (spec references exist)
  - Release version format (semver pattern)

#### Acceptance Criteria

**Spec with release column is rejected**

- Given a feature file in delivery-process/specs/
- And the deliverables DataTable has a "Release" column
- When validating spec compliance
- Then error indicates "Spec files must not contain Release column (per PDR-003)"

**Spec without release column passes**

- Given a feature file in delivery-process/specs/
- And the deliverables DataTable has only Deliverable, Status, Tests, Location
- When validating spec compliance
- Then validation passes

**Phase file with missing required annotations**

- Given a TypeScript file in delivery-process/src/phases/
- When @libar-docs-pattern is missing
- Then validation fails with "Required: @libar-docs-pattern"

**Phase file required annotations**

- Given a TypeScript phase file
- When annotation "<annotation>" is missing
- Then validation <result>

**Valid release version formats**

- Given a release version "<version>"
- When validating release format
- Then validation <result>

#### Business Rules

**Spec files must not contain release columns**

_Verified by: Spec with release column is rejected, Spec without release column passes_

**TypeScript phase files must have required annotations**

_Verified by: Phase file with missing required annotations, Phase file required annotations_

**Release version follows semantic versioning**

_Verified by: Valid release version formats_

---

### 📋 Session File Cleanup

| Property | Value |
| --- | --- |
| Status | planned |
| Effort | 2h |
| Business Value | ensure session directory only contains active phase files |

**Problem:**
  Session files (docs-living/sessions/phase-*.md) are ephemeral working
  documents for active phases. When phases complete or are paused, orphaned
  session files should be cleaned up. The cleanup behavior is documented
  but not specified with acceptance criteria.

  **Solution:**
  Formalize cleanup behavior with specifications covering:
  - When cleanup triggers
  - What files are deleted vs preserved
  - Error handling
  - Logging/notification of cleanup actions

#### Dependencies

- Depends on: SessionFileLifecycle

#### Acceptance Criteria

**Cleanup runs after generating session files**

- Given session files exist for phases 31 and 33
- And only phase 33 is currently active
- When generating session context
- Then session file for phase 31 is deleted
- And session file for phase 33 is preserved
- And log message indicates "Cleaned up orphaned session file: sessions/phase-31.md"

**Non-session files are preserved**

- Given sessions/ directory contains:
- When cleanup runs
- Then only phase-31.md is deleted
- And .gitkeep is preserved
- And notes.md is preserved

| File | Type |
| --- | --- |
| phase-31.md | orphaned session |
| .gitkeep | infrastructure |
| notes.md | manual notes |

**Permission error during cleanup**

- Given orphaned session file with restricted permissions
- When cleanup attempts to delete the file
- Then warning is logged "Failed to cleanup session/phase-31.md: Permission denied"
- And generation continues successfully
- And exit code is 0 (not failure)

**Missing sessions directory**

- Given sessions/ directory does not exist
- When cleanup runs
- Then no error is thrown
- And cleanup is skipped gracefully

#### Business Rules

**Cleanup triggers during session-context generation**

_Verified by: Cleanup runs after generating session files_

**Only phase-*.md files are candidates for cleanup**

_Verified by: Non-session files are preserved_

**Cleanup failures are non-fatal**

_Verified by: Permission error during cleanup, Missing sessions directory_

---

### 📋 Traceability Enhancements

| Property | Value |
| --- | --- |
| Status | planned |
| Effort | 3d |
| Business Value | detect coverage gaps and requirements drift |

**Problem:**
  Current TRACEABILITY.md shows 15% coverage (timeline → behavior).
  No visibility into patterns without scenarios.
  No detection of orphaned scenarios referencing non-existent patterns.

  **Solution:**
  Enhance traceability generator to show:
  - Pattern coverage matrix (scenarios per pattern)
  - Orphaned scenarios report (scenarios without matching patterns)
  - Patterns missing acceptance criteria
  - Coverage gap trends over time

  Implements Convergence Opportunity 4: Requirements ↔ Tests Traceability.

  Existing: docs-living/TRACEABILITY.md

#### Acceptance Criteria

**Show pattern coverage matrix**

- Given patterns with associated behavior scenarios
- When generating traceability report
- Then matrix shows scenario count per pattern
- And coverage percentage is calculated

**Detect orphaned scenarios**

- Given behavior scenarios referencing non-existent patterns
- When generating traceability report
- Then orphaned scenarios are listed with warning
- And expected pattern names are shown

---

### 📋 Validator Read Model Consolidation

| Property | Value |
| --- | --- |
| Status | planned |
| Effort | 3d |
| Business Value | eliminate parallel pipeline and relationship blind spots in validator |

**Problem:**
  `validate-patterns.ts` is the only feature consumer that bypasses the
  MasterDataset. It wires its own mini-pipeline (scan + extract + ad-hoc
  matching), creates a lossy local type (`GherkinPatternInfo`) that discards
  relationship data, and then fails to resolve `@libar-docs-implements`
  links — producing 7 false-positive warnings.

  This is the Parallel Pipeline anti-pattern identified in ADR-006. The
  validator re-derives pattern identity and cross-source matching from raw
  scanner/extractor output, ignoring the relationship index that the
  MasterDataset already computes with full forward and reverse edges.

  **Current violations in validate-patterns.ts (lines refer to pre-refactor):**

  | Anti-Pattern | Location | Evidence |
  | Parallel Pipeline | Lines 32-35 | Imports scanPatterns, scanGherkinFiles, extractPatterns, extractProcessMetadata |
  | Lossy Local Type | Lines 82-88 | GherkinPatternInfo keeps 5 of 30+ ExtractedPattern fields |
  | Re-derived Relationship | Lines 373-384 | Builds Map by name-equality, cannot resolve implements links |

  **Current 7 warnings decomposed:**

  | Warning Pattern | Root Cause | Fix Category |
  | ShapeExtractor | Has @libar-docs-implements ShapeExtraction — only resolvable via relationshipIndex | Relationship-blind |
  | DecisionDocGenerator | Test feature DecisionDocGeneratorTesting has @libar-docs-implements:DecisionDocGenerator | Relationship-blind |
  | ContentDeduplicator | Utility with @libar-docs-phase 28 but no Gherkin spec | Spurious phase tag |
  | FileCache | Utility with @libar-docs-phase 27 but no Gherkin spec | Spurious phase tag |
  | WarningCollector | Utility with @libar-docs-phase 28 but no Gherkin spec | Spurious phase tag |
  | SourceMappingValidator | Utility with @libar-docs-phase 28 but no Gherkin spec | Spurious phase tag |
  | SourceMapper | Utility with @libar-docs-phase 27 but no Gherkin spec | Spurious phase tag |

  **Solution:**
  Refactor `validate-patterns.ts` to consume the MasterDataset as its
  data source for cross-source validation. The validator becomes a feature
  consumer like codecs and the ProcessStateAPI — querying pre-computed
  views and the relationship index instead of building its own maps from
  raw data.

  This eliminates:
  - `GherkinPatternInfo` (Lossy Local Type)
  - `extractGherkinPatternInfo()` (duplicate extractor)
  - Ad-hoc name-matching maps that miss implements relationships
  - The need for any `buildImplementsLookup()` helper

  The validator retains its own validation logic (what to check, what
  severity to assign). Only its data access changes — from raw state
  to the read model.

  **Design Decisions:**

  DD-1: Reuse the same pipeline as process-api.ts — not a shared factory yet.
  The validator will wire scan-extract-merge-transform inline, mirroring
  how process-api.ts does it today (lines 490-558). Extracting a shared
  pipeline factory is scoped to ProcessAPILayeredExtraction, not this spec.
  This keeps the refactoring focused on data-access only.

  DD-2: The validatePatterns() function signature changes from
  (tsPatterns, gherkinPatterns) to (dataset: RuntimeMasterDataset).
  All cross-source matching uses dataset.patterns + dataset.relationshipIndex.
  The function remains exported for testability.

  DD-3: Cross-source matching uses a two-phase approach:
  Phase 1 — Build a name-based Map from dataset.patterns (same as today).
  Phase 2 — For each TS pattern not matched by name, check if it appears
  in any relationshipIndex entry's implementedBy array. This resolves
  the ShapeExtractor and DecisionDocGenerator false positives.

  DD-4: The validator will import transformToMasterDatasetWithValidation
  from generators/pipeline/index.js, plus the merge and hierarchy helpers
  already used by process-api.ts. This is a temporary parallel pipeline
  (acknowledged) that will be replaced when the pipeline factory exists.

  DD-5: Phase tag removal from utility patterns is a separate atomic step
  done first — it reduces warnings from 7 to 2 and is independently
  verifiable before touching any validator code.

  **Implementation Order:**

  | Step | What | Verification |
  | 1 | Remove @libar-docs-phase from 5 utility files | pnpm build, warnings drop from 7 to 2 |
  | 2 | Wire MasterDataset pipeline in main() | pnpm typecheck |
  | 3 | Rewrite validatePatterns() to consume RuntimeMasterDataset | pnpm typecheck |
  | 4 | Delete GherkinPatternInfo, extractGherkinPatternInfo | pnpm typecheck, pnpm test |
  | 5 | Remove unused scanner/extractor imports | pnpm lint |
  | 6 | Run pnpm validate:patterns — verify 0 errors, 0 warnings | Full verification |

  **Files Modified:**

  | File | Change | Lines Affected |
  | src/cli/validate-patterns.ts | Major: rewrite pipeline + validatePatterns() | ~200 lines net reduction |
  | src/generators/content-deduplicator.ts | Remove @libar-docs-phase 28 | Line 6 |
  | src/cache/file-cache.ts | Remove @libar-docs-phase 27 | Line 5 |
  | src/generators/warning-collector.ts | Remove @libar-docs-phase 28 | Line 6 |
  | src/generators/source-mapping-validator.ts | Remove @libar-docs-phase 28 | Line 6 |
  | src/generators/source-mapper.ts | Remove @libar-docs-phase 27 | Line 6 |

  **What does NOT change:**

  - ValidationIssue, ValidationSummary, ValidateCLIConfig interfaces (stable API)
  - parseArgs(), printHelp(), formatPretty(), formatJson() (CLI shell — untouched)
  - DoD validation (already consumes scanned Gherkin files directly — correct for its purpose)
  - Anti-pattern detection (already consumes scanned files — correct for its purpose)
  - Exit code logic (unchanged)

#### Dependencies

- Depends on: ADR006SingleReadModelArchitecture

#### Acceptance Criteria

**Implements relationships resolve in both directions**

- Given a TS pattern "DecisionDocGenerator"
- And a Gherkin feature "DecisionDocGeneratorTesting" with @libar-docs-implements:DecisionDocGenerator
- When running cross-source validation
- Then no warning is produced for "DecisionDocGenerator"
- And the relationship is resolved via MasterDataset.relationshipIndex

**TS pattern implementing a Gherkin spec resolves**

- Given a TS pattern "ShapeExtractor" with @libar-docs-implements ShapeExtraction
- And a Gherkin feature "ShapeExtraction"
- When running cross-source validation
- Then no warning is produced for "ShapeExtractor"

**GherkinPatternInfo type is eliminated**

- Given the refactored validate-patterns.ts
- When inspecting the module
- Then no GherkinPatternInfo interface exists
- And no extractGherkinPatternInfo function exists
- And pattern data comes from MasterDataset.patterns

**Utility patterns do not trigger warnings**

- Given ContentDeduplicator and FileCache without phase tags
- When running cross-source validation
- Then no warning is produced for either pattern

**Full validation suite passes with zero warnings**

- Given the complete codebase with all annotated patterns
- When running pnpm validate:patterns
- Then exit code is 0
- And warning count is 0
- And error count is 0

#### Business Rules

**Validator queries the read model for cross-source matching**

**Invariant:** Pattern identity resolution — including implements
    relationships in both directions — uses `MasterDataset.relationshipIndex`
    rather than ad-hoc name-equality maps built from raw scanner output.

    **Rationale:** The MasterDataset computes implementedBy reverse lookups
    in transform-dataset.ts (second pass, lines 488-546). The validator's
    current name-equality Map cannot resolve ShapeExtractor -> ShapeExtraction
    or DecisionDocGeneratorTesting -> DecisionDocGenerator because these are
    implements relationships, not name matches.

    **Verified by:** Implements resolve bidirectionally, TS implementing Gherkin resolves

_Verified by: Implements relationships resolve in both directions, TS pattern implementing a Gherkin spec resolves_

**No lossy local types in the validator**

**Invariant:** The validator operates on `ExtractedPattern` from the
    MasterDataset, not a consumer-local DTO that discards fields.

    **Rationale:** GherkinPatternInfo keeps only name, phase, status, file,
    and deliverables — discarding uses, dependsOn, implementsPatterns,
    include, productArea, rules, and 20+ other fields. When the validator
    needs relationship data, it cannot access it through the lossy type.

    **Verified by:** GherkinPatternInfo type is eliminated

_Verified by: GherkinPatternInfo type is eliminated_

**Utility patterns without specs are not false positives**

**Invariant:** Internal utility patterns that have a `@libar-docs-phase`
    but will never have a Gherkin spec should not carry phase metadata.
    Phase tags signal roadmap participation.

    **Rationale:** Five utility patterns (ContentDeduplicator, FileCache,
    WarningCollector, SourceMappingValidator, SourceMapper) have phase tags
    from the phase when they were built. They are infrastructure, not roadmap
    features. The validator correctly reports missing Gherkin for patterns
    with phases — the fix is removing the phase tag, not suppressing the
    warning.

    **Verified by:** Utility patterns do not trigger warnings

_Verified by: Utility patterns do not trigger warnings, Full validation suite passes with zero warnings_

---

## ✅ Completed Patterns

### ✅ Gherkin Rules Support

| Property | Value |
| --- | --- |
| Status | completed |
| Effort | 4h |
| Business Value | enable human readable documentation from feature files |

**Problem:**
  Feature files were limited to flat scenario lists. Business rules, rationale,
  and rich descriptions could not be captured in a way that:
  - Tests ignore (vitest-cucumber skips descriptions)
  - Generators render (PRD shows business context)
  - Maintains single source of truth (one file, two purposes)

  The Gherkin `Rule:` keyword was parsed by @cucumber/gherkin but our pipeline
  dropped the data at scanner/extractor stages.

  **Solution:**
  Extended the documentation pipeline to capture and render:
  - `Rule:` keyword as Business Rules sections
  - Rule descriptions (rationale, exceptions, context)
  - DataTables in steps as Markdown tables
  - DocStrings in steps as code blocks

  Infrastructure changes (schema, scanner, extractor) are shared by all generators.
  Rendering was added to PRD generator as reference implementation.

  Confirmed vitest-cucumber supports Rules via `Rule()` + `RuleScenario()` syntax.
  No migration to alternative frameworks needed.

#### Acceptance Criteria

**Rules are captured by AST parser**

- Given a feature file with Rule: keyword
- When parsed by gherkin-ast-parser
- Then the ParsedFeatureFile contains rules array
- And each rule has name, description, tags, scenarios, line

**Rules pass through scanner**

- Given a parsed feature file with rules
- When processed by gherkin-scanner
- Then the ScannedGherkinFile includes rules
- And scenarios inside rules are also in flat scenarios array

**Rules are mapped to ExtractedPattern**

- Given a scanned feature file with rules
- When processed by gherkin-extractor
- Then the ExtractedPattern contains rules field
- And each rule has name, description, scenarioCount, scenarioNames

**PRD generator renders Business Rules section**

- Given an ExtractedPattern with rules
- When rendered by prd-features section
- Then output contains "Business Rules" heading
- And each rule name appears as bold text
- And rule descriptions appear as paragraphs
- And verification scenarios are listed

**DataTables render as Markdown tables**

- Given a scenario step with DataTable
- When rendered in acceptance criteria
- Then output contains Markdown table with headers and rows

**DocStrings render as code blocks**

- Given a scenario step with DocString
- When rendered in acceptance criteria
- Then output contains fenced code block with content

**Rule scenarios execute with vitest-cucumber**

- Given a feature file with scenarios inside Rule blocks
- When step definitions use Rule() and RuleScenario() syntax
- Then all scenarios execute and pass

#### Business Rules

**Rules flow through the entire pipeline without data loss**

The @cucumber/gherkin parser extracts Rules natively. Our pipeline must
    preserve this data through scanner, extractor, and into ExtractedPattern
    so generators can access rule names, descriptions, and nested scenarios.

_Verified by: Rules are captured by AST parser, Rules pass through scanner, Rules are mapped to ExtractedPattern_

**Generators can render rules as business documentation**

Business stakeholders see rule names and descriptions as "Business Rules"
    sections, not Given/When/Then syntax. This enables human-readable PRDs
    from the same files used for test execution.

_Verified by: PRD generator renders Business Rules section_

**Custom content blocks render in acceptance criteria**

DataTables and DocStrings in steps should appear in generated documentation,
    providing structured data and code examples alongside step descriptions.

_Verified by: DataTables render as Markdown tables, DocStrings render as code blocks_

**vitest-cucumber executes scenarios inside Rules**

Test execution must work for scenarios inside Rule blocks.
    Use Rule() function with RuleScenario() instead of Scenario().

_Verified by: Rule scenarios execute with vitest-cucumber_

---

### ✅ Phase State Machine Validation

| Property | Value |
| --- | --- |
| Status | completed |
| Effort | 4h |
| Business Value | ensure state machine rules are enforced programmatically |

**Problem:**
  Phase lifecycle state transitions are not enforced programmatically despite being documented in PROCESS_SETUP.md.
  Invalid transitions can occur silently, leading to inconsistent process state.

  **Solution:**
  Implement state machine validation that:
  - Validates all status transitions
  - Enforces required metadata for terminal states
  - Provides clear error messages for invalid transitions
  - Integrates with generators and linters

#### Acceptance Criteria

**Only valid status values are accepted**

- Given a feature file with status tag
- When the status value is "roadmap", "active", "completed", or "deferred"
- Then validation passes

**Invalid status values are rejected**

- Given a feature file with status tag
- When the status value is "done" or "in-progress"
- Then validation fails with "Invalid status: must be roadmap, active, completed, or deferred"

**Valid transitions are allowed**

- Given a phase with current status "<from>"
- When transitioning to status "<to>"
- Then the transition is valid

**Invalid transitions are rejected**

- Given a phase with current status "<from>"
- When transitioning to status "<to>"
- Then the transition is rejected
- And error message indicates valid transitions from "<from>"

**Completed status requires completion date**

- Given a phase transitioning to "completed" status
- When the @libar-docs-completed tag is missing
- Then validation warns "Completed phases should have @libar-docs-completed date"

**Completed phases should have effort-actual**

- Given a phase transitioning to "completed" status
- When the @libar-docs-effort-actual tag is missing
- Then validation warns "Completed phases should have @libar-docs-effort-actual for variance tracking"

#### Business Rules

**Valid status values are enforced**

_Verified by: Only valid status values are accepted, Invalid status values are rejected_

**Status transitions follow state machine rules**

_Verified by: Valid transitions are allowed, Invalid transitions are rejected_

**Terminal states require completion metadata**

_Verified by: Completed status requires completion date, Completed phases should have effort-actual_

---

[← Back to Roadmap](../ROADMAP.md)
