# ✅ Remaining Work Enhancement

**Purpose:** Detailed documentation for the Remaining Work Enhancement pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Behavior |

## Description

Enhanced REMAINING-WORK.md generation with priority-based sorting,
  quarter grouping, and progressive disclosure for better session planning.

  **Problem:**
  - Flat phase lists make it hard to identify what to work on next
  - No visibility into relative urgency or importance of phases
  - Large backlogs overwhelm planners with too much information at once
  - Quarter-based planning requires manual grouping of phases
  - Effort estimates are not factored into prioritization decisions

  **Solution:**
  - Priority-based sorting surfaces critical/high-priority work first
  - Quarter grouping organizes planned work into time-based buckets
  - Progressive disclosure shows summary with link to full backlog details
  - Effort parsing enables sorting by estimated work duration
  - Visual priority icons provide at-a-glance urgency indicators

## Acceptance Criteria

**Next Actionable sorted by priority**

- Given phases with the following priorities:
- When generating remaining work with sortBy: priority
- Then the Next Actionable section shows phases in priority order:

| Phase | Name | Priority | Status |
| --- | --- | --- | --- |
| 10 | Low Priority | low | roadmap |
| 11 | High Priority | high | roadmap |
| 12 | Critical Work | critical | roadmap |
| 13 | Medium Task | medium | roadmap |

| Order | Name | Priority |
| --- | --- | --- |
| 1 | Critical Work | critical |
| 2 | High Priority | high |
| 3 | Medium Task | medium |
| 4 | Low Priority | low |

**Undefined priority sorts last**

- Given phases with mixed priorities:
- When generating remaining work with sortBy: priority
- Then "Has Priority" appears before "No Priority" in Next Actionable

| Phase | Name | Priority | Status |
| --- | --- | --- | --- |
| 20 | Has Priority | medium | roadmap |
| 21 | No Priority |  | roadmap |

**Priority icons displayed in table**

- Given a phase with critical priority:
- When generating remaining work with sortBy: priority
- Then the table includes priority icons

| Phase | Name | Priority | Status |
| --- | --- | --- | --- |
| 30 | Critical Task | critical | roadmap |

**Phases sorted by effort ascending**

- Given phases with the following efforts:
- When generating remaining work with sortBy: effort
- Then phases appear in effort order: "Quick Task, Medium Task, Long Task"

| Phase | Name | Effort | Status |
| --- | --- | --- | --- |
| 30 | Quick Task | 2h | roadmap |
| 31 | Medium Task | 3d | roadmap |
| 32 | Long Task | 1w | roadmap |

**Effort parsing handles hours**

- Given a phase with effort "2h"
- When parsing effort to hours
- Then the result is 2 hours

**Effort parsing handles days**

- Given a phase with effort "3d"
- When parsing effort to hours
- Then the result is 24 hours

**Effort parsing handles weeks**

- Given a phase with effort "1w"
- When parsing effort to hours
- Then the result is 40 hours

**Effort parsing handles months**

- Given a phase with effort "2m"
- When parsing effort to hours
- Then the result is 320 hours

**Planned phases grouped by quarter**

- Given roadmap phases spanning multiple quarters:
- And all phases have incomplete deliverables
- When generating remaining work with groupPlannedBy: quarter
- Then phases are organized under quarter headings
- And "Unplanned" appears under "Unscheduled" heading

| Phase | Name | Quarter | Status |
| --- | --- | --- | --- |
| 40 | Q1 Work | Q1-2026 | roadmap |
| 41 | Q2 Work | Q2-2026 | roadmap |
| 42 | Q4 Work | Q4-2026 | roadmap |
| 43 | Unplanned |  | roadmap |

**Quarters sorted chronologically**

- Given phases in different quarters:
- And all phases have incomplete deliverables
- When generating remaining work with groupPlannedBy: quarter
- Then quarters appear in order: "Q4-2025, Q1-2026, Q2-2026"

| Phase | Name | Quarter | Status |
| --- | --- | --- | --- |
| 50 | Q2 Work | Q2-2026 | roadmap |
| 51 | Q1 Work | Q1-2026 | roadmap |
| 52 | Q4 Work | Q4-2025 | roadmap |

**Planned phases grouped by priority**

- Given roadmap phases with different priorities:
- And all phases have incomplete deliverables
- When generating remaining work with groupPlannedBy: priority
- Then phases are organized under priority headings
- And "No Priority" appears under "Unprioritized" heading

| Phase | Name | Priority | Status |
| --- | --- | --- | --- |
| 60 | Low Task | low | roadmap |
| 61 | High Task | high | roadmap |
| 62 | No Priority |  | roadmap |

**Large backlog uses progressive disclosure**

- Given 25 actionable roadmap phases
- And maxPlannedToShow is 20
- And maxNextActionable is 5
- And outputDir is "remaining-work/"
- When generating remaining work
- Then the summary shows first 5 phases
- And the output includes link to "backlog-detail.md"
- And a detail file is generated with all 25 phases

**Moderate backlog shows count without link**

- Given 10 actionable roadmap phases
- And maxNextActionable is 5
- And maxPlannedToShow is 20
- When generating remaining work
- Then the summary shows 5 phases
- And shows "...and 5 more actionable phases."
- But does not include a detail file link

**Empty backlog handling**

- Given no roadmap phases
- When generating remaining work with sortBy: priority
- Then shows "No actionable phases" message

**All phases blocked**

- Given roadmap phases with unmet dependencies:
- When generating remaining work
- Then Next Actionable section shows no phases
- And Blocked Phases section shows all phases

| Phase | Name | Status | DependsOn |
| --- | --- | --- | --- |
| 70 | Phase A | roadmap | Missing Dep |
| 71 | Phase B | roadmap | Also Missing |

**Default sorting is by phase number**

- Given phases in non-sequential order:
- When generating remaining work with default config
- Then phases appear in phase number order: "Phase A, Phase B, Phase C"

| Phase | Name | Status |
| --- | --- | --- |
| 100 | Phase C | roadmap |
| 80 | Phase A | roadmap |
| 90 | Phase B | roadmap |

**Default grouping is none (flat list)**

- Given phases with different quarters:
- And all phases have incomplete deliverables
- When generating remaining work with default config
- Then planned phases appear in flat list without quarter headings

| Phase | Name | Quarter | Status |
| --- | --- | --- | --- |
| 110 | Q1 Work | Q1-2026 | roadmap |
| 111 | Q2 Work | Q2-2026 | roadmap |

## Business Rules

**Priority-based sorting surfaces critical work first**

**Invariant:** Phases with higher priority always appear before lower-priority phases when sorting by priority.
    **Verified by:** Next Actionable sorted by priority, Undefined priority sorts last, Priority icons displayed in table

_Verified by: Next Actionable sorted by priority, Undefined priority sorts last, Priority icons displayed in table_

**Effort parsing converts duration strings to comparable hours**

**Invariant:** Effort strings must be parsed to a common unit (hours) for accurate sorting across different time scales.
    **Verified by:** Phases sorted by effort ascending, Effort parsing handles hours, Effort parsing handles days, Effort parsing handles weeks, Effort parsing handles months

_Verified by: Phases sorted by effort ascending, Effort parsing handles hours, Effort parsing handles days, Effort parsing handles weeks, Effort parsing handles months_

**Quarter grouping organizes planned work into time-based buckets**

**Invariant:** Phases with a quarter tag are grouped under their quarter heading; phases without a quarter appear under Unscheduled.
    **Verified by:** Planned phases grouped by quarter, Quarters sorted chronologically

_Verified by: Planned phases grouped by quarter, Quarters sorted chronologically_

**Priority grouping organizes phases by urgency level**

**Invariant:** Phases are grouped under their priority heading; phases without priority appear under Unprioritized.
    **Verified by:** Planned phases grouped by priority

_Verified by: Planned phases grouped by priority_

**Progressive disclosure prevents information overload in large backlogs**

**Invariant:** When the backlog exceeds maxNextActionable, only the top N phases are shown with a link or count for the remainder.
    **Verified by:** Large backlog uses progressive disclosure, Moderate backlog shows count without link

_Verified by: Large backlog uses progressive disclosure, Moderate backlog shows count without link_

**Edge cases are handled gracefully**

**Invariant:** Empty or fully-blocked backlogs produce meaningful output instead of errors or blank sections.
    **Verified by:** Empty backlog handling, All phases blocked

_Verified by: Empty backlog handling, All phases blocked_

**Default behavior preserves backward compatibility**

**Invariant:** Without explicit sortBy or groupPlannedBy options, phases are sorted by phase number in a flat list.
    **Verified by:** Default sorting is by phase number, Default grouping is none (flat list)

_Verified by: Default sorting is by phase number, Default grouping is none (flat list)_

---

[← Back to Pattern Registry](../PATTERNS.md)
