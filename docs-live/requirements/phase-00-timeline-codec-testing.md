# ✅ Timeline Codec Testing

**Purpose:** Detailed requirements for the Timeline Codec Testing feature

---

## Overview

| Property     | Value     |
| ------------ | --------- |
| Status       | completed |
| Product Area | Codec     |

## Description

The timeline codecs (RoadmapDocumentCodec, CompletedMilestonesCodec, CurrentWorkCodec)
transform MasterDataset into RenderableDocuments for different timeline views.

**Problem:**

- Need to generate roadmap, milestones, and current work documents from patterns
- Each view requires different filtering and grouping logic

**Solution:**

- Three specialized codecs for different timeline perspectives
- Shared phase grouping with status-specific filtering

## Acceptance Criteria

**Decode empty dataset produces minimal roadmap**

- Given an empty MasterDataset
- When decoding with RoadmapDocumentCodec
- Then the document title is "Development Roadmap"
- And the document has a purpose
- And the overall progress shows 0 patterns

**Decode dataset with multiple phases**

- Given a MasterDataset with timeline patterns
- When decoding with RoadmapDocumentCodec
- Then the document title is "Development Roadmap"
- And the document contains sections:

| heading          |
| ---------------- |
| Overall Progress |
| Phase Navigation |
| Phases           |

**Progress section shows correct status counts**

- Given a MasterDataset with status distribution:
- When decoding with RoadmapDocumentCodec
- Then the overall progress table shows:
- And the overall progress shows "50%"

| status    | count |
| --------- | ----- |
| completed | 5     |
| active    | 3     |
| planned   | 2     |

| metric         | value |
| -------------- | ----- |
| Total Patterns | 10    |
| Completed      | 5     |
| Active         | 3     |
| Planned        | 2     |

**Phase navigation table with progress**

- Given a MasterDataset with timeline patterns
- When decoding with RoadmapDocumentCodec
- Then the phase navigation table has columns:
- And the phase navigation has 4 rows

| column   |
| -------- |
| Phase    |
| Progress |
| Complete |

**Phase sections show pattern tables**

- Given a MasterDataset with timeline patterns
- When decoding with RoadmapDocumentCodec
- Then phase 1 section shows "100% complete"
- And phase 3 section shows active patterns

**Generate phase detail files when enabled**

- Given a MasterDataset with timeline patterns
- When decoding with generateDetailFiles enabled for roadmap
- Then the document has phase detail files:

| path                                       |
| ------------------------------------------ |
| phases/phase-01-foundation-types.md        |
| phases/phase-02-cms-integration.md         |
| phases/phase-03-event-store-enhancement.md |
| phases/phase-04-advanced-projections.md    |

**No detail files when disabled**

- Given a MasterDataset with timeline patterns
- When decoding with generateDetailFiles disabled for roadmap
- Then the document has no additional files

**Quarterly timeline shown when quarters exist**

- Given a MasterDataset with timeline patterns
- When decoding with RoadmapDocumentCodec
- Then the document contains a "Quarterly Timeline" section
- And the quarterly timeline table has quarters:

| quarter |
| ------- |
| Q4-2025 |
| Q1-2026 |
| Q2-2026 |

**No completed patterns produces empty message**

- Given a MasterDataset with only planned patterns
- When decoding with CompletedMilestonesCodec
- Then the document title is "Completed Milestones"
- And the document contains "No Completed Milestones"

**Summary shows completed counts**

- Given a MasterDataset with timeline patterns
- When decoding with CompletedMilestonesCodec
- Then the document title is "Completed Milestones"
- And the summary table shows:

| metric             | value |
| ------------------ | ----- |
| Completed Patterns | 2     |

**Quarterly navigation with completed patterns**

- Given a MasterDataset with timeline patterns
- When decoding with CompletedMilestonesCodec
- Then the document contains a "Quarterly Navigation" section
- And the quarterly navigation shows quarters with completed counts

**Completed phases shown in collapsible sections**

- Given a MasterDataset with timeline patterns
- When decoding with CompletedMilestonesCodec
- Then the document contains a "Completed Phases" section
- And the completed phases are collapsible

**Recent completions section with limit**

- Given a MasterDataset with timeline patterns
- When decoding with CompletedMilestonesCodec
- Then the document contains a "Recent Completions" section
- And recent completions shows at most 10 patterns

**Generate quarterly detail files when enabled**

- Given a MasterDataset with timeline patterns
- When decoding with generateDetailFiles enabled for milestones
- Then the document has quarterly milestone files:

| path                  |
| --------------------- |
| milestones/Q4-2025.md |
| milestones/Q1-2026.md |

**No active work produces empty message**

- Given a MasterDataset with only completed patterns
- When decoding with CurrentWorkCodec
- Then the document title is "Current Work"
- And the document contains "No Active Work"

**Summary shows overall progress**

- Given a MasterDataset with timeline patterns
- When decoding with CurrentWorkCodec
- Then the document title is "Current Work"
- And the summary shows overall progress percentage
- And the summary shows active phases count

**Active phases with progress bars**

- Given a MasterDataset with timeline patterns
- When decoding with CurrentWorkCodec
- Then the document contains an "Active Phases" section
- And active phase 3 shows progress and status breakdown

**Deliverables rendered when configured**

- Given a MasterDataset with patterns with deliverables
- When decoding with includeDeliverables enabled for current work
- Then the active patterns show their deliverables

**All active patterns table**

- Given a MasterDataset with timeline patterns
- When decoding with CurrentWorkCodec
- Then the document contains an "All Active Patterns" section
- And the active patterns table has columns:

| column      |
| ----------- |
| Pattern     |
| Phase       |
| Effort      |
| Description |

**Generate current work detail files when enabled**

- Given a MasterDataset with timeline patterns
- When decoding with generateDetailFiles enabled for current work
- Then the document has current work detail files:

| path                                        |
| ------------------------------------------- |
| current/phase-03-event-store-enhancement.md |

## Business Rules

**RoadmapDocumentCodec groups patterns by phase with progress tracking**

_Verified by: Decode empty dataset produces minimal roadmap, Decode dataset with multiple phases, Progress section shows correct status counts, Phase navigation table with progress, Phase sections show pattern tables, Generate phase detail files when enabled, No detail files when disabled, Quarterly timeline shown when quarters exist_

**CompletedMilestonesCodec shows only completed patterns grouped by quarter**

_Verified by: No completed patterns produces empty message, Summary shows completed counts, Quarterly navigation with completed patterns, Completed phases shown in collapsible sections, Recent completions section with limit, Generate quarterly detail files when enabled_

**CurrentWorkCodec shows only active patterns with deliverables**

_Verified by: No active work produces empty message, Summary shows overall progress, Active phases with progress bars, Deliverables rendered when configured, All active patterns table, Generate current work detail files when enabled_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
