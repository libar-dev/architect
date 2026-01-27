# 📋 Codec Behavior Testing

**Purpose:** Detailed documentation for the Codec Behavior Testing pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | planned |
| Category | DDD |
| Phase | 102 |

## Description

**Problem:**
  Of 17 document codecs in src/renderable/codecs/, only 3 have behavior specs:
  - PatternsDocumentCodec (tested)
  - BusinessRulesCodec (tested)
  - ArchitectureDocumentCodec (tested)

  The remaining 14 codecs lack executable specs, meaning document generation
  correctness is unverified.

  **Solution:**
  Create behavior specs for each untested codec covering:
  - Input transformation (MasterDataset to RenderableDocument)
  - Output structure (correct sections, headings, content)
  - Edge cases (empty data, missing fields)

  **Business Value:**
  | Benefit | How |
  | Correctness | Generated docs match expected structure |
  | Regression Prevention | Changes to codecs don't break output |
  | Confidence | Safe to modify codec logic |

## Acceptance Criteria

**RoadmapDocumentCodec groups by phase**

- Given MasterDataset with patterns in phases 15, 16, 17
- When RoadmapDocumentCodec transforms dataset
- Then document has sections for each phase
- And patterns are grouped under their phase headings

**CompletedMilestonesCodec shows only completed**

- Given MasterDataset with completed and roadmap patterns
- When CompletedMilestonesCodec transforms dataset
- Then document only includes completed patterns
- And completion dates are shown

**CurrentWorkCodec shows only active**

- Given MasterDataset with active, roadmap, and completed patterns
- When CurrentWorkCodec transforms dataset
- Then document only includes active patterns
- And current progress is highlighted

**Empty dataset produces minimal output**

- Given MasterDataset with no patterns
- When RoadmapDocumentCodec transforms dataset
- Then document has title and purpose
- And content section indicates no planned work

**SessionContextCodec includes active pattern details**

- Given MasterDataset with active pattern "FeatureX"
- And pattern has 3 deliverables (2 complete, 1 pending)
- When SessionContextCodec transforms dataset
- Then document includes FeatureX with deliverable status
- And pending deliverables are highlighted

**RemainingWorkCodec aggregates by phase**

- Given MasterDataset with incomplete patterns in phases 15, 16
- When RemainingWorkCodec transforms dataset
- Then document groups remaining work by phase
- And total effort remaining is calculated

**RequirementsDocumentCodec includes full feature descriptions**

- Given MasterDataset with pattern having Problem/Solution description
- When RequirementsDocumentCodec transforms dataset
- Then document includes Problem and Solution sections
- And business value table is rendered

**Acceptance criteria have bold keywords**

- Given MasterDataset with pattern having acceptance scenarios
- When RequirementsDocumentCodec transforms dataset
- Then scenario steps have bold Given/When/Then keywords

**ChangelogCodec follows Keep a Changelog format**

- Given MasterDataset with patterns tagged to releases v0.1.0, v0.2.0
- When ChangelogCodec transforms dataset
- Then document has sections for each release version
- And Unreleased section shows untagged changes

**TraceabilityCodec maps rules to scenarios**

- Given MasterDataset with patterns having Rules and Verified by annotations
- When TraceabilityCodec transforms dataset
- Then document includes Rule-to-Scenario matrix
- And unverified rules are listed separately

**PlanningChecklistCodec includes deliverables**

- Given MasterDataset with active pattern having 5 deliverables
- When PlanningChecklistCodec transforms dataset
- Then document includes checklist with all deliverables
- And status checkboxes reflect completion state

**SessionFindingsCodec captures discoveries**

- Given MasterDataset with pattern having @discovered-gap annotations
- When SessionFindingsCodec transforms dataset
- Then document includes Discoveries section
- And gaps, improvements, and risks are categorized

## Business Rules

**Timeline codecs group patterns by phase and status**

**Invariant:** Roadmap shows planned work, Milestones shows completed work,
    CurrentWork shows active patterns only.

    **API:** See `src/renderable/codecs/timeline.ts`

    **Verified by:** RoadmapCodec grouping, MilestonesCodec filtering, CurrentWorkCodec filtering

_Verified by: RoadmapDocumentCodec groups by phase, CompletedMilestonesCodec shows only completed, CurrentWorkCodec shows only active, Empty dataset produces minimal output_

**Session codecs provide working context for AI sessions**

**Invariant:** SessionContext shows active patterns with deliverables.
    RemainingWork aggregates incomplete work by phase.

    **API:** See `src/renderable/codecs/session.ts`

    **Verified by:** SessionContext content, RemainingWork aggregation

_Verified by: SessionContextCodec includes active pattern details, RemainingWorkCodec aggregates by phase_

**Requirements codec produces PRD-style documentation**

**Invariant:** Features include problem, solution, business value.
    Acceptance criteria are formatted with bold keywords.

    **API:** See `src/renderable/codecs/requirements.ts`

    **Verified by:** PRD structure, Acceptance criteria formatting

_Verified by: RequirementsDocumentCodec includes full feature descriptions, Acceptance criteria have bold keywords_

**Reporting codecs support release management and auditing**

**Invariant:** Changelog follows Keep a Changelog format.
    Traceability maps rules to scenarios.

    **API:** See `src/renderable/codecs/reporting.ts`

    **Verified by:** Changelog format, Traceability matrix

_Verified by: ChangelogCodec follows Keep a Changelog format, TraceabilityCodec maps rules to scenarios_

**Planning codecs support implementation sessions**

**Invariant:** Planning checklist includes DoD items.
    Session plan shows implementation steps.

    **API:** See `src/renderable/codecs/planning.ts`

    **Verified by:** Checklist items, Session plan steps

_Verified by: PlanningChecklistCodec includes deliverables, SessionFindingsCodec captures discoveries_

---

[← Back to Pattern Registry](../PATTERNS.md)
