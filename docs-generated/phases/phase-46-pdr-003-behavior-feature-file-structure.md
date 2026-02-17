# PDR003BehaviorFeatureFileStructure

**Purpose:** Detailed patterns for PDR003BehaviorFeatureFileStructure

---

## Summary

**Progress:** [████████████████████] 1/1 (100%)

| Status | Count |
| --- | --- |
| ✅ Completed | 1 |
| 🚧 Active | 0 |
| 📋 Planned | 0 |
| **Total** | 1 |

---

## ✅ Completed Patterns

### ✅ PDR 003 Behavior Feature File Structure

| Property | Value |
| --- | --- |
| Status | completed |

#### Acceptance Criteria

**Specs and TypeScript phase files are separate**

- Given the delivery-process/ directory structure
- Then specs/ contains only pure requirement feature files
- And src/phases/ contains TypeScript files with release annotations
- And specs have NO libar-process-* tags
- And TypeScript files reference specs by pattern name

**Spec files use semantic tags only**

- Given a feature file in delivery-process/specs/
- Then the file should have semantic tags (acceptance-criteria, opportunity-N, etc.)
- And the file should have Background with deliverables DataTable
- And the DataTable should NOT include Release column
- And the file should NOT have libar-process-* tags

**TypeScript phase files centralize release information**

- Given a TypeScript file in delivery-process/src/phases/vX.Y.Z/
- Then the file should have libar-docs-pattern annotation
- And the file should have libar-docs-phase annotation
- And the file should have libar-docs-status annotation
- And the file should reference the spec via comment or libar-docs-spec annotation

**Specs can evolve independently of phases**

- Given a spec file in delivery-process/specs/
- When the spec is refined, split, or combined
- Then only the TypeScript phase file needs updating
- And no phase/release metadata exists in the spec to update

**No release references in spec DataTables**

- Given a spec feature file with a DataTable
- When the DataTable includes a Release column
- Then this violates PDR-003 conventions
- And the Release column must be removed

**TypeScript phase files support process metadata**

- Given a TypeScript file in delivery-process/src/phases/
- Then the file may include libar-docs-effort for planned effort
- And the file may include libar-docs-effort-actual for variance tracking
- And the file may include libar-docs-workflow for time distribution analysis
- And the file may include libar-docs-priority for backlog ordering
- And the file may include libar-docs-risk for progressive governance

**TypeScript phase files support dependency tracking**

- Given a TypeScript file in delivery-process/src/phases/
- Then the file may include libar-docs-depends-on for dependencies
- And the file may include libar-docs-enables for downstream patterns
- And dependency information enables critical path analysis

#### Business Rules

**Context - Timeline feature files created maintenance problems**

The monorepo uses Gherkin feature files for requirements specification and
    behavioral acceptance tests. The original approach used "timeline .feature files"
    with libar-process-* tags for phase/release tracking, but this created problems:

    Problems with timeline .feature files:
    - DataTables for deliverables were hard to maintain
    - Phase/release metadata scattered across many files
    - Specs tightly coupled to specific phases (couldn't evolve independently)
    - Combining or splitting specs required updating process metadata everywhere
    - No centralized view of release contents

**Decision - Separate specs from release association using two complementary systems**

1. SPECS DIRECTORY (delivery-process/specs/)
       Pure Gherkin requirements that can evolve independently:
       - Focus on WHAT (requirements, acceptance criteria, deliverables)
       - Use semantic tags only (acceptance-criteria, opportunity-N, etc.)
       - NO libar-process-* tags (no phase numbers, no dates, no status)
       - Can be combined, split, or refined without affecting release tracking
       - Background tables list deliverables with Status/Tests/Location (no Release column)

    2. TYPESCRIPT PHASE FILES (delivery-process/src/phases/vX.Y.Z/)
       Centralized release association via code annotations:
       - Focus on WHEN (phase assignment, release association, dependencies)
       - Use libar-docs-* JSDoc annotations for process metadata
       - Reference specs by pattern name: "Spec: delivery-process/specs/name.feature"
       - Single location for all phase/release information
       - Enables dependency graphs, roadmap generation, earned-value tracking

    SEPARATION OF CONCERNS:
    - Specs answer: "What are we building?" (requirements that evolve)
    - TypeScript phase files answer: "When are we building it?" (release decisions)

    This separation allows:
    - Specs to mature through ideation, refinement, implementation
    - Release planning to happen independently of requirement evolution
    - Easy re-prioritization (just update TypeScript phase files)
    - Centralized roadmap generation from TypeScript annotations

    Tag Conventions for Spec files:
    - acceptance-criteria - Marks scenarios for requirements generation
    - Semantic grouping tags: epic, capstone, opportunity-N, foundation
    - Domain tags: orders, inventory, saga, etc.
    - Scenario tags: happy-path, validation, business-failure

    TypeScript Phase File Annotations (in libar-docs-* format):

    Core annotations (required):
    - libar-docs-pattern Name - Pattern identifier
    - libar-docs-status {roadmap|active|completed} - Phase status
    - libar-docs-phase N - Phase number
    - libar-docs-quarter QN-YYYY - Delivery quarter

    Completion annotations:
    - libar-docs-completed YYYY-MM-DD - Completion date
    - libar-docs-effort Nw - Planned effort (e.g., 4w, 2d, 8h)
    - libar-docs-effort-actual Nw - Actual effort (for variance tracking)

    Optional metadata:
    - libar-docs-workflow {design|implementation|documentation|testing|discovery}
    - libar-docs-priority {high|medium|low} - Backlog ordering (default: medium)
    - libar-docs-risk {low|medium|high} - Risk level (default: low)

    Relationship annotations:
    - libar-docs-depends-on PatternA,PatternB - Dependencies (CSV)
    - libar-docs-enables PatternC,PatternD - What this enables (CSV)

    Behavior Test Files (tests/features/behavior/):
    Same conventions as before:
    - libar-docs-pattern:Name - Links to pattern for traceability (optional)
    - acceptance-criteria - Marks scenarios for PRD generation
    - Semantic tags for organization
    - NO Release columns in DataTables

    CRITICAL: No Release References in Spec DataTables.
    Deliverable DataTables in spec files MUST NOT include Release column.
    Only TypeScript phase files may reference releases.
    Rationale: Specs describe WHAT the system does, not WHEN it was released.
    Release coupling prevents specs from evolving independently.

_Verified by: Specs and TypeScript phase files are separate, Spec files use semantic tags only, TypeScript phase files centralize release information, Specs can evolve independently of phases, No release references in spec DataTables_

**Consequences - Separated concerns with learning curve trade-off**

Positive outcomes:
    - Specs can evolve independently of release planning
    - Centralized release information in TypeScript files
    - Easy to re-prioritize and re-assign phases
    - TypeScript annotations enable IDE support, type checking
    - Dependency graphs can be computed from code
    - Single source of truth for roadmap generation

    Negative outcomes:
    - Requires maintaining two file types (specs + phase files)
    - Learning curve for new contributors
    - Phase files must manually reference spec files

_Verified by: TypeScript phase files support process metadata, TypeScript phase files support dependency tracking_

---

[← Back to Roadmap](../ROADMAP.md)
