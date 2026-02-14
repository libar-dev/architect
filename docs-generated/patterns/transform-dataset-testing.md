# ✅ Transform Dataset Testing

**Purpose:** Detailed documentation for the Transform Dataset Testing pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Behavior |

## Description

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

## Acceptance Criteria

**Transform empty dataset**

- Given an empty raw dataset
- When transforming to MasterDataset
- Then the dataset has 0 patterns
- And all status counts are 0
- And the phase count is 0
- And the category count is 0

**Group patterns by status**

- Given a raw dataset with status distribution:
- When transforming to MasterDataset
- Then byStatus.completed has 5 patterns
- And byStatus.active has 3 patterns
- And byStatus.planned has 2 patterns
- And counts.total is 10

| status | count |
| --- | --- |
| completed | 5 |
| active | 3 |
| planned | 2 |

**Normalize status variants to canonical values**

- Given patterns with various status values:
- When transforming to MasterDataset
- Then each pattern is grouped in the expected status bucket

| status | expected |
| --- | --- |
| completed | completed |
| active | active |
| roadmap | planned |
| deferred | planned |

**Group patterns by phase**

- Given patterns in multiple phases:
- When transforming to MasterDataset
- Then byPhase has 3 phase groups with counts:

| phase | count |
| --- | --- |
| 1 | 2 |
| 2 | 3 |
| 3 | 1 |

| phase | count |
| --- | --- |
| 1 | 2 |
| 2 | 3 |
| 3 | 1 |

**Sort phases by phase number**

- Given patterns in phases 3, 1, 2 (out of order)
- When transforming to MasterDataset
- Then byPhase is sorted as [1, 2, 3]

**Compute per-phase status counts**

- Given phase 1 with 2 completed and 1 active patterns
- When transforming to MasterDataset
- Then phase 1 counts are:

| field | value |
| --- | --- |
| completed | 2 |
| active | 1 |
| planned | 0 |
| total | 3 |

**Patterns without phase are not in byPhase**

- Given 3 patterns without phase metadata
- And 2 patterns in phase 1
- When transforming to MasterDataset
- Then byPhase has 1 phase group
- And phaseCount is 1

**Group patterns by quarter**

- Given patterns in multiple quarters:
- When transforming to MasterDataset
- Then byQuarter has 3 quarters with counts:

| quarter | count |
| --- | --- |
| Q1-2024 | 2 |
| Q2-2024 | 3 |
| Q4-2024 | 1 |

| quarter | count |
| --- | --- |
| Q1-2024 | 2 |
| Q2-2024 | 3 |
| Q4-2024 | 1 |

**Patterns without quarter are not in byQuarter**

- Given 3 patterns without quarter
- And 2 patterns in quarter "Q1-2024"
- When transforming to MasterDataset
- Then byQuarter has 1 quarter

**Group patterns by category**

- Given patterns in categories:
- When transforming to MasterDataset
- Then byCategory has 3 categories with counts:
- And categoryCount is 3

| category | count |
| --- | --- |
| core | 3 |
| ddd | 2 |
| saga | 1 |

| category | count |
| --- | --- |
| core | 3 |
| ddd | 2 |
| saga | 1 |

**Group patterns by source file type**

- Given patterns from different sources:
- When transforming to MasterDataset
- Then bySource.typescript has 2 patterns
- And bySource.gherkin has 1 pattern

| source | expectedView |
| --- | --- |
| src/patterns/core.ts | typescript |
| src/patterns/ddd.ts | typescript |
| tests/features/saga.feature | gherkin |

**Patterns with phase are also in roadmap view**

- Given 3 patterns with phase metadata
- And 2 patterns without phase
- When transforming to MasterDataset
- Then bySource.roadmap has 3 patterns

**Build relationship index from patterns**

- Given a pattern "Core" that uses "Base"
- And a pattern "Base" that is used by "Core"
- When transforming to MasterDataset
- Then the relationship index for "Core" uses contains "Base"
- And the relationship index for "Base" usedBy contains "Core"

**Build relationship index with all relationship types**

- Given a pattern "Feature" with relationships:
- When transforming to MasterDataset
- Then the relationship index for "Feature" contains:

| type | targets |
| --- | --- |
| uses | Utility |
| usedBy | Application |
| dependsOn | Infrastructure |
| enables | Extension |

| field | value |
| --- | --- |
| uses | Utility |
| usedBy | Application |
| dependsOn | Infrastructure |
| enables | Extension |

**Reverse lookup computes enables from dependsOn**

- Given a pattern "Infra" with no relationships
- And a pattern "App" that depends on "Infra"
- When transforming to MasterDataset
- Then the relationship index for "Infra" enables contains "App"

**Reverse lookup computes usedBy from uses**

- Given a pattern "Lib" with no relationships
- And a pattern "Consumer" that uses "Lib"
- When transforming to MasterDataset
- Then the relationship index for "Lib" usedBy contains "Consumer"

**Reverse lookup merges with explicit annotations without duplicates**

- Given a pattern "Base" that enables "Feature" explicitly
- And a pattern "Feature" that depends on "Base"
- When transforming to MasterDataset
- Then the relationship index for "Base" enables contains "Feature"
- And the relationship index for "Base" enables has exactly 1 entry

**Calculate completion percentage**

- Given status counts with completed "<completed>" of total "<total>"
- When calculating completion percentage
- Then the result is "<percentage>" percent

**Check if fully completed**

- Given status counts "<completed>" completed "<active>" active "<planned>" planned of "<total>" total
- When checking if fully completed
- Then the result is "<expected>"

**Include workflow in result when provided**

- Given a workflow with phases:
- And patterns in phases 1 and 2
- When transforming with the workflow
- Then the result includes the workflow with phase names:

| order | name |
| --- | --- |
| 1 | Foundation |
| 2 | Core Patterns |
| 3 | Advanced Integration |

| phase | name |
| --- | --- |
| 1 | Foundation |
| 2 | Core Patterns |

**Result omits workflow when not provided**

- Given patterns without a workflow
- When transforming to MasterDataset
- Then the result does not include workflow

---

[← Back to Pattern Registry](../PATTERNS.md)
