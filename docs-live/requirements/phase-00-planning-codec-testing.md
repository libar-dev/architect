# ✅ Planning Codec Testing

**Purpose:** Detailed requirements for the Planning Codec Testing feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Generation |

## Description

The planning codecs (PlanningChecklistCodec, SessionPlanCodec, SessionFindingsCodec)
transform MasterDataset into RenderableDocuments for planning and retrospective views.

**Problem:**

- Need to generate planning checklists, session plans, and findings documents from patterns
- Each view requires different filtering, grouping, and content rendering

**Solution:**

- Three specialized codecs for different planning perspectives
- PlanningChecklistCodec prepares for implementation sessions
- SessionPlanCodec generates structured implementation plans
- SessionFindingsCodec captures retrospective discoveries

## Acceptance Criteria

**No actionable phases produces empty message**

- Given a MasterDataset with no actionable phases
- When decoding with PlanningChecklistCodec
- Then the document title is "Planning Checklist"
- And the document contains "No active or actionable phases"

**Summary shows phases to plan count**

- Given a MasterDataset with planning patterns
- When decoding with PlanningChecklistCodec
- Then the document title is "Planning Checklist"
- And the summary table shows:

| metric          | value |
| --------------- | ----- |
| Phases to Plan  | 2     |
| Active          | 1     |
| Next Actionable | 1     |

**Pre-planning questions section**

- Given a MasterDataset with planning patterns
- When decoding with PlanningChecklistCodec
- Then the document contains a "Pre-Planning" section
- And the pre-planning section contains checklist items:

| item                                  |
| ------------------------------------- |
| Context and requirements understood?  |
| Dependencies identified and verified? |
| Implementation approach chosen?       |
| Risks assessed and mitigated?         |

**Definition of Done with deliverables**

- Given a MasterDataset with patterns with deliverables
- When decoding with PlanningChecklistCodec
- Then the document contains a "Definition of Done" section
- And the DoD section shows deliverable items

**Acceptance criteria from scenarios**

- Given a MasterDataset with patterns with scenarios
- When decoding with PlanningChecklistCodec
- Then the document contains a "Definition of Done" section
- And the DoD section shows acceptance criteria from scenarios

**Risk assessment section**

- Given a MasterDataset with planning patterns
- When decoding with includeRiskAssessment enabled
- Then the document contains a "Risk Assessment" section
- And the risk assessment contains checklist items:

| item                           |
| ------------------------------ |
| Technical risks identified?    |
| Scope creep controls in place? |
| Fallback options available?    |

**Dependency status shows met vs unmet**

- Given a MasterDataset with patterns with dependencies
- When decoding with PlanningChecklistCodec
- Then the document shows dependency status
- And met dependencies show completed marker
- And unmet dependencies show pending marker

**forActivePhases option**

- Given a MasterDataset with active and planned patterns
- When decoding with forActivePhases enabled and forNextActionable disabled
- Then only active phases are shown in checklist

**forNextActionable option**

- Given a MasterDataset with active and planned patterns
- When decoding with forActivePhases disabled and forNextActionable enabled
- Then only next actionable phases are shown in checklist

**No phases to plan produces empty message**

- Given a MasterDataset with only completed patterns
- When decoding with SessionPlanCodec
- Then the document title is "Session Implementation Plan"
- And the document contains "No phases match the status filter"

**Summary shows status counts**

- Given a MasterDataset with planning patterns
- When decoding with SessionPlanCodec
- Then the document title is "Session Implementation Plan"
- And the summary table shows:

| status  | count |
| ------- | ----- |
| Active  | 1     |
| Planned | 1     |
| Total   | 2     |

**Implementation approach from useCases**

- Given a MasterDataset with patterns with useCases
- When decoding with SessionPlanCodec
- Then the document contains an "Implementation Approach" section
- And the implementation approach shows use cases

**Deliverables rendering**

- Given a MasterDataset with patterns with deliverables
- When decoding with SessionPlanCodec
- Then the document contains a "Deliverables" section
- And the deliverables section shows items with status

**Acceptance criteria with steps**

- Given a MasterDataset with patterns with scenarios
- When decoding with SessionPlanCodec
- Then the document contains an "Acceptance Criteria" section
- And the acceptance criteria shows scenario names

**Business rules section**

- Given a MasterDataset with patterns with rules
- When decoding with SessionPlanCodec
- Then the document contains a "Business Rules" section
- And the business rules section shows rule names

**statusFilter option for active only**

- Given a MasterDataset with planning patterns
- When decoding with statusFilter set to active only
- Then only active patterns are shown in plan

**statusFilter option for planned only**

- Given a MasterDataset with planning patterns
- When decoding with statusFilter set to planned only
- Then only planned patterns are shown in plan

**No findings produces empty message**

- Given a MasterDataset with patterns without findings
- When decoding with SessionFindingsCodec
- Then the document title is "Session Findings"
- And the document contains "No gaps, improvements, risks, or learnings"

**Summary shows finding type counts**

- Given a MasterDataset with patterns with findings
- When decoding with SessionFindingsCodec
- Then the document title is "Session Findings"
- And the summary table shows:

| type         | count |
| ------------ | ----- |
| Gaps         | 2     |
| Improvements | 2     |
| Risks        | 2     |
| Learnings    | 2     |

**Gaps section**

- Given a MasterDataset with patterns with discovered gaps
- When decoding with SessionFindingsCodec
- Then the document contains a "Gaps" section
- And the gaps section shows discovered gaps

**Improvements section**

- Given a MasterDataset with patterns with discovered improvements
- When decoding with SessionFindingsCodec
- Then the document contains a "Improvements" section
- And the improvements section shows discovered improvements

**Risks section includes risk field**

- Given a MasterDataset with patterns with discovered risks
- When decoding with SessionFindingsCodec
- Then the document contains a "Risks" section
- And the risks section shows discovered risks

**Learnings section**

- Given a MasterDataset with patterns with discovered learnings
- When decoding with SessionFindingsCodec
- Then the document contains a "Learnings" section
- And the learnings section shows discovered learnings

**groupBy category option**

- Given a MasterDataset with patterns with findings
- When decoding with groupBy set to category
- Then findings are grouped by finding type

**groupBy phase option**

- Given a MasterDataset with patterns with findings
- When decoding with groupBy set to phase
- Then findings are grouped by source phase

**groupBy type option**

- Given a MasterDataset with patterns with findings
- When decoding with groupBy set to type
- Then findings are grouped by finding type

**showSourcePhase option enabled**

- Given a MasterDataset with patterns with findings
- When decoding with showSourcePhase enabled
- Then findings show phase attribution

**showSourcePhase option disabled**

- Given a MasterDataset with patterns with findings
- When decoding with showSourcePhase disabled
- Then findings do not show phase attribution

## Business Rules

**PlanningChecklistCodec prepares for implementation sessions**

_Verified by: No actionable phases produces empty message, Summary shows phases to plan count, Pre-planning questions section, Definition of Done with deliverables, Acceptance criteria from scenarios, Risk assessment section, Dependency status shows met vs unmet, forActivePhases option, forNextActionable option_

**SessionPlanCodec generates implementation plans**

_Verified by: No phases to plan produces empty message, Summary shows status counts, Implementation approach from useCases, Deliverables rendering, Acceptance criteria with steps, Business rules section, statusFilter option for active only, statusFilter option for planned only_

**SessionFindingsCodec captures retrospective discoveries**

_Verified by: No findings produces empty message, Summary shows finding type counts, Gaps section, Improvements section, Risks section includes risk field, Learnings section, groupBy category option, groupBy phase option, groupBy type option, showSourcePhase option enabled, showSourcePhase option disabled_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
