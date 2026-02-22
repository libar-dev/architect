@libar-docs
@libar-docs-pattern:TransformDatasetTesting
@libar-docs-implements:TransformDataset
@libar-docs-status:completed
@libar-docs-product-area:Generation
@behavior @transform-dataset
Feature: Transform Dataset Pipeline
  The transformToMasterDataset function transforms raw extracted patterns
  into a MasterDataset with all pre-computed views in a single pass.
  This is the core of the unified transformation pipeline.

  **Problem:**
  - Generators need multiple views of the same pattern data
  - Computing views lazily leads to O(n*v) complexity
  - Views must be consistent with each other

  **Solution:**
  - Single-pass transformation computes all views in O(n)
  - All views are immutable and pre-computed
  - MasterDataset is the source of truth for all generators

  Background:
    Given a transform dataset test context

  Rule: Empty dataset produces valid zero-state views

    **Invariant:** An empty input produces a MasterDataset with all counts at zero and no groupings.
    **Rationale:** Generators must handle the zero-state gracefully; a missing or malformed empty dataset would cause null-reference errors across all rendering codecs.

    **Verified by:** Transform empty dataset

    @happy-path @edge-case
    Scenario: Transform empty dataset
      Given an empty raw dataset
      When transforming to MasterDataset
      Then the dataset has 0 patterns
      And all status counts are 0
      And the phase count is 0
      And the category count is 0

  Rule: Status and phase grouping creates navigable views

    **Invariant:** Patterns are grouped by canonical status and sorted by phase number, with per-phase status counts computed.

    **Rationale:** Generators need O(1) access to status-filtered and phase-ordered views without recomputing on each render pass.

    **Verified by:** Group patterns by status, Normalize status variants to canonical values, Group patterns by phase, Sort phases by phase number, Compute per-phase status counts, Patterns without phase are not in byPhase

    @happy-path @status-grouping
    Scenario: Group patterns by status
      Given a raw dataset with status distribution:
        | status    | count |
        | completed | 5     |
        | active    | 3     |
        | planned   | 2     |
      When transforming to MasterDataset
      Then byStatus.completed has 5 patterns
      And byStatus.active has 3 patterns
      And byStatus.planned has 2 patterns
      And counts.total is 10

    Scenario: Normalize status variants to canonical values
      Given patterns with various status values:
        | status    | expected     |
        | completed | completed    |
        | active    | active       |
        | roadmap   | planned      |
        | deferred  | planned      |
      When transforming to MasterDataset
      Then each pattern is grouped in the expected status bucket

    @happy-path @phase-grouping
    Scenario: Group patterns by phase
      Given patterns in multiple phases:
        | phase | count |
        | 1     | 2     |
        | 2     | 3     |
        | 3     | 1     |
      When transforming to MasterDataset
      Then byPhase has 3 phase groups with counts:
        | phase | count |
        | 1     | 2     |
        | 2     | 3     |
        | 3     | 1     |

    Scenario: Sort phases by phase number
      Given patterns in phases 3, 1, 2 (out of order)
      When transforming to MasterDataset
      Then byPhase is sorted as [1, 2, 3]

    Scenario: Compute per-phase status counts
      Given phase 1 with 2 completed and 1 active patterns
      When transforming to MasterDataset
      Then phase 1 counts are:
        | field     | value |
        | completed | 2     |
        | active    | 1     |
        | planned   | 0     |
        | total     | 3     |

    Scenario: Patterns without phase are not in byPhase
      Given 3 patterns without phase metadata
      And 2 patterns in phase 1
      When transforming to MasterDataset
      Then byPhase has 1 phase group
      And phaseCount is 1

  Rule: Quarter and category grouping organizes by timeline and domain

    **Invariant:** Patterns are grouped by quarter and category, with only patterns bearing the relevant metadata included in each view.
    **Rationale:** Timeline and domain views must exclude patterns without the relevant metadata to prevent misleading counts and empty groupings in generated documentation.

    **Verified by:** Group patterns by quarter, Patterns without quarter are not in byQuarter, Group patterns by category

    @happy-path @quarter-grouping
    Scenario: Group patterns by quarter
      Given patterns in multiple quarters:
        | quarter | count |
        | Q1-2024 | 2     |
        | Q2-2024 | 3     |
        | Q4-2024 | 1     |
      When transforming to MasterDataset
      Then byQuarter has 3 quarters with counts:
        | quarter | count |
        | Q1-2024 | 2     |
        | Q2-2024 | 3     |
        | Q4-2024 | 1     |

    Scenario: Patterns without quarter are not in byQuarter
      Given 3 patterns without quarter
      And 2 patterns in quarter "Q1-2024"
      When transforming to MasterDataset
      Then byQuarter has 1 quarter

    @happy-path @category-grouping
    Scenario: Group patterns by category
      Given patterns in categories:
        | category | count |
        | core     | 3     |
        | ddd      | 2     |
        | saga     | 1     |
      When transforming to MasterDataset
      Then byCategory has 3 categories with counts:
        | category | count |
        | core     | 3     |
        | ddd      | 2     |
        | saga     | 1     |
      And categoryCount is 3

  Rule: Source grouping separates TypeScript and Gherkin origins

    **Invariant:** Patterns are partitioned by source file type, and patterns with phase metadata appear in the roadmap view.
    **Rationale:** Codecs that render TypeScript-specific or Gherkin-specific views depend on pre-partitioned sources; mixing sources would produce incorrect per-origin statistics and broken cross-references.

    **Verified by:** Group patterns by source file type, Patterns with phase are also in roadmap view

    @happy-path @source-grouping
    Scenario: Group patterns by source file type
      Given patterns from different sources:
        | source                          | expectedView |
        | src/patterns/core.ts            | typescript   |
        | src/patterns/ddd.ts             | typescript   |
        | tests/features/saga.feature     | gherkin      |
      When transforming to MasterDataset
      Then bySource.typescript has 2 patterns
      And bySource.gherkin has 1 pattern

    Scenario: Patterns with phase are also in roadmap view
      Given 3 patterns with phase metadata
      And 2 patterns without phase
      When transforming to MasterDataset
      Then bySource.roadmap has 3 patterns

  Rule: Relationship index builds bidirectional dependency graph

    **Invariant:** The relationship index contains forward and reverse lookups, with reverse lookups merged and deduplicated against explicit annotations.

    **Rationale:** Bidirectional navigation is required for dependency tree queries without O(n) scans per lookup.

    **Verified by:** Build relationship index from patterns, Build relationship index with all relationship types, Reverse lookup computes enables from dependsOn, Reverse lookup computes usedBy from uses, Reverse lookup merges with explicit annotations without duplicates

    @happy-path @relationships
    Scenario: Build relationship index from patterns
      Given a pattern "Core" that uses "Base"
      And a pattern "Base" that is used by "Core"
      When transforming to MasterDataset
      Then the relationship index for "Core" uses contains "Base"
      And the relationship index for "Base" usedBy contains "Core"

    Scenario: Build relationship index with all relationship types
      Given a pattern "Feature" with relationships:
        | type      | targets        |
        | uses      | Utility        |
        | usedBy    | Application    |
        | dependsOn | Infrastructure |
        | enables   | Extension      |
      When transforming to MasterDataset
      Then the relationship index for "Feature" contains:
        | field     | value          |
        | uses      | Utility        |
        | usedBy    | Application    |
        | dependsOn | Infrastructure |
        | enables   | Extension      |

    @happy-path @relationships
    Scenario: Reverse lookup computes enables from dependsOn
      Given a pattern "Infra" with no relationships
      And a pattern "App" that depends on "Infra"
      When transforming to MasterDataset
      Then the relationship index for "Infra" enables contains "App"

    @happy-path @relationships
    Scenario: Reverse lookup computes usedBy from uses
      Given a pattern "Lib" with no relationships
      And a pattern "Consumer" that uses "Lib"
      When transforming to MasterDataset
      Then the relationship index for "Lib" usedBy contains "Consumer"

    @happy-path @relationships
    Scenario: Reverse lookup merges with explicit annotations without duplicates
      Given a pattern "Base" that enables "Feature" explicitly
      And a pattern "Feature" that depends on "Base"
      When transforming to MasterDataset
      Then the relationship index for "Base" enables contains "Feature"
      And the relationship index for "Base" enables has exactly 1 entry

  Rule: Completion tracking computes project progress

    **Invariant:** Completion percentage is rounded to the nearest integer, and fully-completed requires all patterns in completed status with a non-zero total.
    **Rationale:** Inconsistent rounding or a false-positive fully-completed signal on an empty dataset would misrepresent project health in dashboards and generated progress reports.

    **Verified by:** Calculate completion percentage, Check if fully completed

    @function:completionPercentage
    Scenario Outline: Calculate completion percentage
      Given status counts with completed "<completed>" of total "<total>"
      When calculating completion percentage
      Then the result is "<percentage>" percent

      Examples:
        | completed | total | percentage |
        | 0         | 0     | 0          |
        | 0         | 10    | 0          |
        | 5         | 10    | 50         |
        | 10        | 10    | 100        |
        | 3         | 7     | 43         |
        | 1         | 3     | 33         |
        | 2         | 3     | 67         |

    @function:isFullyCompleted
    Scenario Outline: Check if fully completed
      Given status counts "<completed>" completed "<active>" active "<planned>" planned of "<total>" total
      When checking if fully completed
      Then the result is "<expected>"

      Examples:
        | completed | active | planned | total | expected |
        | 0         | 0      | 0       | 0     | false    |
        | 10        | 0      | 0       | 10    | true     |
        | 9         | 1      | 0       | 10    | false    |
        | 9         | 0      | 1       | 10    | false    |
        | 5         | 3      | 2       | 10    | false    |

  Rule: Workflow integration conditionally includes delivery process data

    **Invariant:** The workflow is included in the MasterDataset only when provided, and phase names are resolved from the workflow configuration.
    **Rationale:** Projects without a delivery workflow must still produce valid datasets; unconditionally requiring workflow data would break standalone documentation generation.

    **Verified by:** Include workflow in result when provided, Result omits workflow when not provided

    Scenario: Include workflow in result when provided
      Given a workflow with phases:
        | order | name                 |
        | 1     | Foundation           |
        | 2     | Core Patterns        |
        | 3     | Advanced Integration |
      And patterns in phases 1 and 2
      When transforming with the workflow
      Then the result includes the workflow with phase names:
        | phase | name          |
        | 1     | Foundation    |
        | 2     | Core Patterns |

    Scenario: Result omits workflow when not provided
      Given patterns without a workflow
      When transforming to MasterDataset
      Then the result does not include workflow
