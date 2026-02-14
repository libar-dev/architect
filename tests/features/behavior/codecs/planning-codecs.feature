@libar-docs
@libar-docs-pattern:PlanningCodecTesting
@libar-docs-status:completed
@libar-docs-product-area:Generation
@libar-docs-implements:CodecBehaviorTesting
@behavior @planning-codecs
Feature: Planning Document Codecs
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

  Background:
    Given a planning codec test context

  # =============================================================================
  # PlanningChecklistCodec
  # =============================================================================

  Rule: PlanningChecklistCodec prepares for implementation sessions

    @happy-path @edge-case
    Scenario: No actionable phases produces empty message
      Given a MasterDataset with no actionable phases
      When decoding with PlanningChecklistCodec
      Then the document title is "Planning Checklist"
      And the document contains "No active or actionable phases"

    @happy-path
    Scenario: Summary shows phases to plan count
      Given a MasterDataset with planning patterns
      When decoding with PlanningChecklistCodec
      Then the document title is "Planning Checklist"
      And the summary table shows:
        | metric          | value |
        | Phases to Plan  | 2     |
        | Active          | 1     |
        | Next Actionable | 1     |

    @happy-path
    Scenario: Pre-planning questions section
      Given a MasterDataset with planning patterns
      When decoding with PlanningChecklistCodec
      Then the document contains a "Pre-Planning" section
      And the pre-planning section contains checklist items:
        | item                                    |
        | Context and requirements understood?    |
        | Dependencies identified and verified?   |
        | Implementation approach chosen?         |
        | Risks assessed and mitigated?           |

    @happy-path
    Scenario: Definition of Done with deliverables
      Given a MasterDataset with patterns with deliverables
      When decoding with PlanningChecklistCodec
      Then the document contains a "Definition of Done" section
      And the DoD section shows deliverable items

    @happy-path
    Scenario: Acceptance criteria from scenarios
      Given a MasterDataset with patterns with scenarios
      When decoding with PlanningChecklistCodec
      Then the document contains a "Definition of Done" section
      And the DoD section shows acceptance criteria from scenarios

    @happy-path
    Scenario: Risk assessment section
      Given a MasterDataset with planning patterns
      When decoding with includeRiskAssessment enabled
      Then the document contains a "Risk Assessment" section
      And the risk assessment contains checklist items:
        | item                              |
        | Technical risks identified?       |
        | Scope creep controls in place?    |
        | Fallback options available?       |

    @happy-path
    Scenario: Dependency status shows met vs unmet
      Given a MasterDataset with patterns with dependencies
      When decoding with PlanningChecklistCodec
      Then the document shows dependency status
      And met dependencies show completed marker
      And unmet dependencies show pending marker

    Scenario: forActivePhases option
      Given a MasterDataset with active and planned patterns
      When decoding with forActivePhases enabled and forNextActionable disabled
      Then only active phases are shown in checklist

    Scenario: forNextActionable option
      Given a MasterDataset with active and planned patterns
      When decoding with forActivePhases disabled and forNextActionable enabled
      Then only next actionable phases are shown in checklist

  # =============================================================================
  # SessionPlanCodec
  # =============================================================================

  Rule: SessionPlanCodec generates implementation plans

    @happy-path @edge-case
    Scenario: No phases to plan produces empty message
      Given a MasterDataset with only completed patterns
      When decoding with SessionPlanCodec
      Then the document title is "Session Implementation Plan"
      And the document contains "No phases match the status filter"

    @happy-path
    Scenario: Summary shows status counts
      Given a MasterDataset with planning patterns
      When decoding with SessionPlanCodec
      Then the document title is "Session Implementation Plan"
      And the summary table shows:
        | status  | count |
        | Active  | 1     |
        | Planned | 1     |
        | Total   | 2     |

    @happy-path
    Scenario: Implementation approach from useCases
      Given a MasterDataset with patterns with useCases
      When decoding with SessionPlanCodec
      Then the document contains an "Implementation Approach" section
      And the implementation approach shows use cases

    @happy-path
    Scenario: Deliverables rendering
      Given a MasterDataset with patterns with deliverables
      When decoding with SessionPlanCodec
      Then the document contains a "Deliverables" section
      And the deliverables section shows items with status

    @happy-path
    Scenario: Acceptance criteria with steps
      Given a MasterDataset with patterns with scenarios
      When decoding with SessionPlanCodec
      Then the document contains an "Acceptance Criteria" section
      And the acceptance criteria shows scenario names

    @happy-path
    Scenario: Business rules section
      Given a MasterDataset with patterns with rules
      When decoding with SessionPlanCodec
      Then the document contains a "Business Rules" section
      And the business rules section shows rule names

    Scenario: statusFilter option for active only
      Given a MasterDataset with planning patterns
      When decoding with statusFilter set to active only
      Then only active patterns are shown in plan

    Scenario: statusFilter option for planned only
      Given a MasterDataset with planning patterns
      When decoding with statusFilter set to planned only
      Then only planned patterns are shown in plan

  # =============================================================================
  # SessionFindingsCodec
  # =============================================================================

  Rule: SessionFindingsCodec captures retrospective discoveries

    @happy-path @edge-case
    Scenario: No findings produces empty message
      Given a MasterDataset with patterns without findings
      When decoding with SessionFindingsCodec
      Then the document title is "Session Findings"
      And the document contains "No gaps, improvements, risks, or learnings"

    @happy-path
    Scenario: Summary shows finding type counts
      Given a MasterDataset with patterns with findings
      When decoding with SessionFindingsCodec
      Then the document title is "Session Findings"
      And the summary table shows:
        | type         | count |
        | Gaps         | 2     |
        | Improvements | 2     |
        | Risks        | 2     |
        | Learnings    | 2     |

    @happy-path
    Scenario: Gaps section
      Given a MasterDataset with patterns with discovered gaps
      When decoding with SessionFindingsCodec
      Then the document contains a "Gaps" section
      And the gaps section shows discovered gaps

    @happy-path
    Scenario: Improvements section
      Given a MasterDataset with patterns with discovered improvements
      When decoding with SessionFindingsCodec
      Then the document contains a "Improvements" section
      And the improvements section shows discovered improvements

    @happy-path
    Scenario: Risks section includes risk field
      Given a MasterDataset with patterns with discovered risks
      When decoding with SessionFindingsCodec
      Then the document contains a "Risks" section
      And the risks section shows discovered risks

    @happy-path
    Scenario: Learnings section
      Given a MasterDataset with patterns with discovered learnings
      When decoding with SessionFindingsCodec
      Then the document contains a "Learnings" section
      And the learnings section shows discovered learnings

    Scenario: groupBy category option
      Given a MasterDataset with patterns with findings
      When decoding with groupBy set to category
      Then findings are grouped by finding type

    Scenario: groupBy phase option
      Given a MasterDataset with patterns with findings
      When decoding with groupBy set to phase
      Then findings are grouped by source phase

    Scenario: groupBy type option
      Given a MasterDataset with patterns with findings
      When decoding with groupBy set to type
      Then findings are grouped by finding type

    Scenario: showSourcePhase option enabled
      Given a MasterDataset with patterns with findings
      When decoding with showSourcePhase enabled
      Then findings show phase attribution

    Scenario: showSourcePhase option disabled
      Given a MasterDataset with patterns with findings
      When decoding with showSourcePhase disabled
      Then findings do not show phase attribution
