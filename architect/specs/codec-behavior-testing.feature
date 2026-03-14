@architect
@architect-pattern:CodecBehaviorTesting
@architect-status:roadmap
@architect-phase:102
@architect-effort:5d
@architect-product-area:Generation
@architect-business-value:ensure-all-document-codecs-produce-correct-output
@architect-priority:medium
@architect-executable-specs:tests/features/behavior/codecs
Feature: Codec Behavior Testing

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

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Tests | Test Type | Location |
      | RoadmapDocumentCodec tests | pending | Yes | unit | tests/features/renderable/roadmap-codec.feature |
      | CompletedMilestonesCodec tests | pending | Yes | unit | tests/features/renderable/milestones-codec.feature |
      | CurrentWorkCodec tests | pending | Yes | unit | tests/features/renderable/current-work-codec.feature |
      | RequirementsDocumentCodec tests | pending | Yes | unit | tests/features/renderable/requirements-codec.feature |
      | SessionContextCodec tests | pending | Yes | unit | tests/features/renderable/session-context-codec.feature |
      | RemainingWorkCodec tests | pending | Yes | unit | tests/features/renderable/remaining-work-codec.feature |
      | PrChangesCodec tests | pending | Yes | unit | tests/features/renderable/pr-changes-codec.feature |
      | AdrDocumentCodec tests | pending | Yes | unit | tests/features/renderable/adr-codec.feature |
      | PlanningChecklistCodec tests | pending | Yes | unit | tests/features/renderable/planning-checklist-codec.feature |
      | SessionPlanCodec tests | pending | Yes | unit | tests/features/renderable/session-plan-codec.feature |
      | SessionFindingsCodec tests | pending | Yes | unit | tests/features/renderable/session-findings-codec.feature |
      | ChangelogCodec tests | pending | Yes | unit | tests/features/renderable/changelog-codec.feature |
      | TraceabilityCodec tests | pending | Yes | unit | tests/features/renderable/traceability-codec.feature |
      | OverviewCodec tests | pending | Yes | unit | tests/features/renderable/overview-codec.feature |

  # ============================================================================
  # RULE 1: Timeline Codecs
  # ============================================================================

  Rule: Timeline codecs group patterns by phase and status

    **Invariant:** Roadmap shows planned work, Milestones shows completed work,
    CurrentWork shows active patterns only.
    **Rationale:** Mixing statuses across timeline views would bury actionable
    information and make it impossible to distinguish planned from delivered work.

    **API:** See `src/renderable/codecs/timeline.ts`

    **Verified by:** RoadmapCodec grouping, MilestonesCodec filtering, CurrentWorkCodec filtering

    @acceptance-criteria @happy-path
    Scenario: RoadmapDocumentCodec groups by phase
      Given MasterDataset with patterns in phases 15, 16, 17
      When RoadmapDocumentCodec transforms dataset
      Then document has sections for each phase
      And patterns are grouped under their phase headings

    @acceptance-criteria @happy-path
    Scenario: CompletedMilestonesCodec shows only completed
      Given MasterDataset with completed and roadmap patterns
      When CompletedMilestonesCodec transforms dataset
      Then document only includes completed patterns
      And completion dates are shown

    @acceptance-criteria @happy-path
    Scenario: CurrentWorkCodec shows only active
      Given MasterDataset with active, roadmap, and completed patterns
      When CurrentWorkCodec transforms dataset
      Then document only includes active patterns
      And current progress is highlighted

    @acceptance-criteria @validation
    Scenario: Empty dataset produces minimal output
      Given MasterDataset with no patterns
      When RoadmapDocumentCodec transforms dataset
      Then document has title and purpose
      And content section indicates no planned work

  # ============================================================================
  # RULE 2: Session Codecs
  # ============================================================================

  Rule: Session codecs provide working context for AI sessions

    **Invariant:** SessionContext shows active patterns with deliverables.
    RemainingWork aggregates incomplete work by phase.
    **Rationale:** AI sessions without curated context waste tokens on irrelevant
    patterns, and unaggregated remaining work obscures project health.

    **API:** See `src/renderable/codecs/session.ts`

    **Verified by:** SessionContext content, RemainingWork aggregation

    @acceptance-criteria @happy-path
    Scenario: SessionContextCodec includes active pattern details
      Given MasterDataset with active pattern "FeatureX"
      And pattern has 3 deliverables (2 complete, 1 pending)
      When SessionContextCodec transforms dataset
      Then document includes FeatureX with deliverable status
      And pending deliverables are highlighted

    @acceptance-criteria @happy-path
    Scenario: RemainingWorkCodec aggregates by phase
      Given MasterDataset with incomplete patterns in phases 15, 16
      When RemainingWorkCodec transforms dataset
      Then document groups remaining work by phase
      And total effort remaining is calculated

  # ============================================================================
  # RULE 3: Requirements Codec
  # ============================================================================

  Rule: Requirements codec produces PRD-style documentation

    **Invariant:** Features include problem, solution, business value.
    Acceptance criteria are formatted with bold keywords.
    **Rationale:** Omitting problem/solution context produces specs that lack
    justification, and unformatted acceptance criteria are difficult to scan.

    **API:** See `src/renderable/codecs/requirements.ts`

    **Verified by:** PRD structure, Acceptance criteria formatting

    @acceptance-criteria @happy-path
    Scenario: RequirementsDocumentCodec includes full feature descriptions
      Given MasterDataset with pattern having Problem/Solution description
      When RequirementsDocumentCodec transforms dataset
      Then document includes Problem and Solution sections
      And business value table is rendered

    @acceptance-criteria @happy-path
    Scenario: Acceptance criteria have bold keywords
      Given MasterDataset with pattern having acceptance scenarios
      When RequirementsDocumentCodec transforms dataset
      Then scenario steps have bold Given/When/Then keywords

  # ============================================================================
  # RULE 4: Reporting Codecs
  # ============================================================================

  Rule: Reporting codecs support release management and auditing

    **Invariant:** Changelog follows Keep a Changelog format.
    Traceability maps rules to scenarios.
    **Rationale:** Non-standard changelog formats break tooling that parses release
    notes, and unmapped rules represent unverified business constraints.

    **API:** See `src/renderable/codecs/reporting.ts`

    **Verified by:** Changelog format, Traceability matrix

    @acceptance-criteria @happy-path
    Scenario: ChangelogCodec follows Keep a Changelog format
      Given MasterDataset with patterns tagged to releases v0.1.0, v0.2.0
      When ChangelogCodec transforms dataset
      Then document has sections for each release version
      And Unreleased section shows untagged changes

    @acceptance-criteria @happy-path
    Scenario: TraceabilityCodec maps rules to scenarios
      Given MasterDataset with patterns having Rules and Verified by annotations
      When TraceabilityCodec transforms dataset
      Then document includes Rule-to-Scenario matrix
      And unverified rules are listed separately

  # ============================================================================
  # RULE 5: Planning Codecs
  # ============================================================================

  Rule: Planning codecs support implementation sessions

    **Invariant:** Planning checklist includes DoD items.
    Session plan shows implementation steps.
    **Rationale:** Missing DoD items in checklists allow incomplete patterns to
    pass validation, and sessions without implementation steps lose focus.

    **API:** See `src/renderable/codecs/planning.ts`

    **Verified by:** Checklist items, Session plan steps

    @acceptance-criteria @happy-path
    Scenario: PlanningChecklistCodec includes deliverables
      Given MasterDataset with active pattern having 5 deliverables
      When PlanningChecklistCodec transforms dataset
      Then document includes checklist with all deliverables
      And status checkboxes reflect completion state

    @acceptance-criteria @happy-path
    Scenario: SessionFindingsCodec captures discoveries
      Given MasterDataset with pattern having @discovered-gap annotations
      When SessionFindingsCodec transforms dataset
      Then document includes Discoveries section
      And gaps, improvements, and risks are categorized

