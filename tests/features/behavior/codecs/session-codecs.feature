@behavior @session-codecs
@libar-docs-pattern:SessionCodecTesting
@libar-docs-product-area:Codec
Feature: Session Document Codecs
  The session codecs (SessionContextCodec, RemainingWorkCodec)
  transform MasterDataset into RenderableDocuments for AI session context
  and incomplete work aggregation views.

  **Problem:**
  - Need to generate session context and remaining work documents from patterns
  - Each view requires different filtering, grouping, and prioritization logic

  **Solution:**
  - Two specialized codecs for session planning perspectives
  - SessionContextCodec focuses on current work and phase navigation
  - RemainingWorkCodec aggregates incomplete work with priority sorting

  Background:
    Given a session codec test context

  # =============================================================================
  # SessionContextCodec
  # =============================================================================

  Rule: SessionContextCodec provides working context for AI sessions

    @happy-path @edge-case
    Scenario: Decode empty dataset produces minimal session context
      Given an empty MasterDataset
      When decoding with SessionContextCodec
      Then the document title is "Session Context"
      And the document has a purpose
      And the session status shows 0 active patterns

    @happy-path
    Scenario: Decode dataset with timeline patterns
      Given a MasterDataset with timeline patterns
      When decoding with SessionContextCodec
      Then the document title is "Session Context"
      And the document contains sections:
        | heading           |
        | Session Status    |
        | Active Work       |

    @happy-path
    Scenario: Session status shows current focus
      Given a MasterDataset with status distribution:
        | status    | count |
        | completed | 3     |
        | active    | 2     |
        | planned   | 5     |
      When decoding with SessionContextCodec
      Then the session status section shows:
        | metric          | value |
        | Active Patterns | 2     |
        | Completed       | 3     |
        | Remaining       | 7     |
      And the session status shows current focus

    @happy-path
    Scenario: Phase navigation for incomplete phases
      Given a MasterDataset with timeline patterns
      When decoding with SessionContextCodec
      Then the document contains a "Phase Navigation" section
      And the phase navigation table has columns:
        | column    |
        | Phase     |
        | Remaining |
        | Complete  |
      And the phase navigation shows only incomplete phases

    @happy-path
    Scenario: Active work grouped by phase
      Given a MasterDataset with timeline patterns
      When decoding with SessionContextCodec
      Then the document contains an "Active Work" section
      And the active work shows patterns grouped by phase

    Scenario: Blocked items section with dependencies
      Given a MasterDataset with blocked patterns
      When decoding with includeDependencies enabled for session
      Then the document contains a "Blocked Items" section
      And the blocked items table shows pattern and blocker

    Scenario: No blocked items section when disabled
      Given a MasterDataset with blocked patterns
      When decoding with includeDependencies disabled for session
      Then the document does not contain "Blocked Items"

    Scenario: Recent completions collapsible
      Given a MasterDataset with timeline patterns
      When decoding with SessionContextCodec
      Then the document contains a collapsible "Recent Completions"
      And the recent completions shows completed patterns

    Scenario: Generate session phase detail files when enabled
      Given a MasterDataset with timeline patterns
      When decoding with generateDetailFiles enabled for session
      Then the document has session detail files:
        | path                                           |
        | sessions/phase-03-event-store-enhancement.md   |
        | sessions/phase-04-advanced-projections.md      |

    Scenario: No detail files when disabled
      Given a MasterDataset with timeline patterns
      When decoding with generateDetailFiles disabled for session
      Then the document has no additional files

  # =============================================================================
  # RemainingWorkCodec
  # =============================================================================

  Rule: RemainingWorkCodec aggregates incomplete work by phase

    @happy-path @edge-case
    Scenario: All work complete produces celebration message
      Given a MasterDataset with only completed patterns
      When decoding with RemainingWorkCodec
      Then the document title is "Remaining Work"
      And the document contains "All Work Complete"

    @happy-path
    Scenario: Summary shows remaining counts
      Given a MasterDataset with status distribution:
        | status    | count |
        | completed | 3     |
        | active    | 2     |
        | planned   | 5     |
      When decoding with RemainingWorkCodec
      Then the document title is "Remaining Work"
      And the summary table shows:
        | status          | count |
        | Active          | 2     |
        | Planned         | 5     |
        | Total Remaining | 7     |

    @happy-path
    Scenario: Phase navigation with remaining count
      Given a MasterDataset with timeline patterns
      When decoding with RemainingWorkCodec
      Then the document contains a "By Phase" section
      And the by phase table has columns:
        | column    |
        | Phase     |
        | Remaining |
        | Active    |
        | Complete  |

    @happy-path
    Scenario: By priority shows ready vs blocked
      Given a MasterDataset with blocked patterns
      When decoding with RemainingWorkCodec
      Then the document contains a "By Priority" section
      And the by priority table shows:
        | priority        | present |
        | In Progress     | yes     |
        | Ready to Start  | yes     |
        | Blocked         | yes     |

    @happy-path
    Scenario: Next actionable items section
      Given a MasterDataset with actionable patterns
      When decoding with RemainingWorkCodec
      Then the document contains a "Next Actionable Items" section
      And the next actionable items are not blocked

    Scenario: Next actionable respects maxNextActionable limit
      Given a MasterDataset with many planned patterns
      When decoding with maxNextActionable set to 3
      Then the next actionable items shows at most 3 items

    Scenario: Sort by phase option
      Given a MasterDataset with timeline patterns
      When decoding with sortBy set to "phase"
      Then the remaining work is ordered by phase number

    Scenario: Sort by priority option
      Given a MasterDataset with prioritized patterns
      When decoding with sortBy set to "priority"
      Then the remaining work shows priority groupings

    Scenario: Generate remaining work detail files when enabled
      Given a MasterDataset with timeline patterns
      When decoding with generateDetailFiles enabled for remaining
      Then the document has remaining detail files:
        | path                                           |
        | remaining/phase-03-event-store-enhancement.md  |
        | remaining/phase-04-advanced-projections.md     |

    Scenario: No detail files when disabled for remaining
      Given a MasterDataset with timeline patterns
      When decoding with generateDetailFiles disabled for remaining
      Then the document has no additional files
