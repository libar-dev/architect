# TraceabilityEnhancements - Remaining Work

**Purpose:** Detailed remaining work for TraceabilityEnhancements

---

## Summary

**Progress:** [███░░░░░░░░░░░░░░░░░] 2/13 (15%)

**Remaining:** 11 patterns (0 active, 11 planned)

---

## ✅ Ready to Start

These patterns can be started immediately:

| Pattern | Effort | Business Value |
| --- | --- | --- |
| 📋 Architecture Delta | 2d | document release changes automatically |
| 📋 Business Rules Generator | 3d | - |
| 📋 Cross Source Validation | 4h | detect inconsistencies between typescript and gherkin sources |
| 📋 DoD Validation | 3d | enable machine checkable phase completion |
| 📋 Effort Variance Tracking | 2d | track planned vs actual effort variance |
| 📋 Living Roadmap CLI | 5d | query roadmap with natural language |
| 📋 Phase Numbering Conventions | 2h | prevent phase number conflicts and ensure consistent ordering |
| 📋 Progressive Governance | 2d | filter work by risk and priority |
| 📋 Release Association Rules | 3h | enforce separation of specs from release metadata |
| 📋 Session File Cleanup | 2h | ensure session directory only contains active phase files |
| 📋 Traceability Enhancements | 3d | detect coverage gaps and requirements drift |

---

## All Remaining Patterns

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

### 📋 Effort Variance Tracking

| Property | Value |
| --- | --- |
| Status | planned |
| Effort | 2d |
| Business Value | track planned vs actual effort variance |
| Dependencies | MvpWorkflowImplementation |

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

### 📋 Living Roadmap CLI

| Property | Value |
| --- | --- |
| Status | planned |
| Effort | 5d |
| Business Value | query roadmap with natural language |
| Dependencies | MvpWorkflowImplementation |

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

### 📋 Session File Cleanup

| Property | Value |
| --- | --- |
| Status | planned |
| Effort | 2h |
| Business Value | ensure session directory only contains active phase files |
| Dependencies | SessionFileLifecycle |

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

[← Back to Remaining Work](../REMAINING-WORK.md)
