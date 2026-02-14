@libar-docs
@libar-docs-pattern:TimelineCodecTesting
@libar-docs-status:completed
@libar-docs-product-area:Codec
@libar-docs-implements:CodecBehaviorTesting
@behavior @timeline-codecs
Feature: Timeline Document Codecs
  The timeline codecs (RoadmapDocumentCodec, CompletedMilestonesCodec, CurrentWorkCodec)
  transform MasterDataset into RenderableDocuments for different timeline views.

  **Problem:**
  - Need to generate roadmap, milestones, and current work documents from patterns
  - Each view requires different filtering and grouping logic

  **Solution:**
  - Three specialized codecs for different timeline perspectives
  - Shared phase grouping with status-specific filtering

  Background:
    Given a timeline codec test context

  # ═══════════════════════════════════════════════════════════════════════════
  # RoadmapDocumentCodec
  # ═══════════════════════════════════════════════════════════════════════════

  Rule: RoadmapDocumentCodec groups patterns by phase with progress tracking

    @happy-path @edge-case
    Scenario: Decode empty dataset produces minimal roadmap
      Given an empty MasterDataset
      When decoding with RoadmapDocumentCodec
      Then the document title is "Development Roadmap"
      And the document has a purpose
      And the overall progress shows 0 patterns

    @happy-path
    Scenario: Decode dataset with multiple phases
      Given a MasterDataset with timeline patterns
      When decoding with RoadmapDocumentCodec
      Then the document title is "Development Roadmap"
      And the document contains sections:
        | heading           |
        | Overall Progress  |
        | Phase Navigation  |
        | Phases            |

    @happy-path
    Scenario: Progress section shows correct status counts
      Given a MasterDataset with status distribution:
        | status    | count |
        | completed | 5     |
        | active    | 3     |
        | planned   | 2     |
      When decoding with RoadmapDocumentCodec
      Then the overall progress table shows:
        | metric    | value |
        | Total Patterns | 10    |
        | Completed | 5     |
        | Active    | 3     |
        | Planned   | 2     |
      And the overall progress shows "50%"

    @happy-path
    Scenario: Phase navigation table with progress
      Given a MasterDataset with timeline patterns
      When decoding with RoadmapDocumentCodec
      Then the phase navigation table has columns:
        | column   |
        | Phase    |
        | Progress |
        | Complete |
      And the phase navigation has 4 rows

    Scenario: Phase sections show pattern tables
      Given a MasterDataset with timeline patterns
      When decoding with RoadmapDocumentCodec
      Then phase 1 section shows "100% complete"
      And phase 3 section shows active patterns

    Scenario: Generate phase detail files when enabled
      Given a MasterDataset with timeline patterns
      When decoding with generateDetailFiles enabled for roadmap
      Then the document has phase detail files:
        | path                                     |
        | phases/phase-01-foundation-types.md      |
        | phases/phase-02-cms-integration.md       |
        | phases/phase-03-event-store-enhancement.md |
        | phases/phase-04-advanced-projections.md  |

    Scenario: No detail files when disabled
      Given a MasterDataset with timeline patterns
      When decoding with generateDetailFiles disabled for roadmap
      Then the document has no additional files

    Scenario: Quarterly timeline shown when quarters exist
      Given a MasterDataset with timeline patterns
      When decoding with RoadmapDocumentCodec
      Then the document contains a "Quarterly Timeline" section
      And the quarterly timeline table has quarters:
        | quarter  |
        | Q4-2025  |
        | Q1-2026  |
        | Q2-2026  |

  # ═══════════════════════════════════════════════════════════════════════════
  # CompletedMilestonesCodec
  # ═══════════════════════════════════════════════════════════════════════════

  Rule: CompletedMilestonesCodec shows only completed patterns grouped by quarter

    @happy-path @edge-case
    Scenario: No completed patterns produces empty message
      Given a MasterDataset with only planned patterns
      When decoding with CompletedMilestonesCodec
      Then the document title is "Completed Milestones"
      And the document contains "No Completed Milestones"

    @happy-path
    Scenario: Summary shows completed counts
      Given a MasterDataset with timeline patterns
      When decoding with CompletedMilestonesCodec
      Then the document title is "Completed Milestones"
      And the summary table shows:
        | metric             | value |
        | Completed Patterns | 2     |

    @happy-path
    Scenario: Quarterly navigation with completed patterns
      Given a MasterDataset with timeline patterns
      When decoding with CompletedMilestonesCodec
      Then the document contains a "Quarterly Navigation" section
      And the quarterly navigation shows quarters with completed counts

    Scenario: Completed phases shown in collapsible sections
      Given a MasterDataset with timeline patterns
      When decoding with CompletedMilestonesCodec
      Then the document contains a "Completed Phases" section
      And the completed phases are collapsible

    Scenario: Recent completions section with limit
      Given a MasterDataset with timeline patterns
      When decoding with CompletedMilestonesCodec
      Then the document contains a "Recent Completions" section
      And recent completions shows at most 10 patterns

    Scenario: Generate quarterly detail files when enabled
      Given a MasterDataset with timeline patterns
      When decoding with generateDetailFiles enabled for milestones
      Then the document has quarterly milestone files:
        | path                    |
        | milestones/Q4-2025.md   |
        | milestones/Q1-2026.md   |

  # ═══════════════════════════════════════════════════════════════════════════
  # CurrentWorkCodec
  # ═══════════════════════════════════════════════════════════════════════════

  Rule: CurrentWorkCodec shows only active patterns with deliverables

    @happy-path @edge-case
    Scenario: No active work produces empty message
      Given a MasterDataset with only completed patterns
      When decoding with CurrentWorkCodec
      Then the document title is "Current Work"
      And the document contains "No Active Work"

    @happy-path
    Scenario: Summary shows overall progress
      Given a MasterDataset with timeline patterns
      When decoding with CurrentWorkCodec
      Then the document title is "Current Work"
      And the summary shows overall progress percentage
      And the summary shows active phases count

    @happy-path
    Scenario: Active phases with progress bars
      Given a MasterDataset with timeline patterns
      When decoding with CurrentWorkCodec
      Then the document contains an "Active Phases" section
      And active phase 3 shows progress and status breakdown

    Scenario: Deliverables rendered when configured
      Given a MasterDataset with patterns with deliverables
      When decoding with includeDeliverables enabled for current work
      Then the active patterns show their deliverables

    Scenario: All active patterns table
      Given a MasterDataset with timeline patterns
      When decoding with CurrentWorkCodec
      Then the document contains an "All Active Patterns" section
      And the active patterns table has columns:
        | column      |
        | Pattern     |
        | Phase       |
        | Effort      |
        | Description |

    Scenario: Generate current work detail files when enabled
      Given a MasterDataset with timeline patterns
      When decoding with generateDetailFiles enabled for current work
      Then the document has current work detail files:
        | path                                           |
        | current/phase-03-event-store-enhancement.md    |
