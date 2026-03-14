@libar-docs
@libar-docs-pattern:NormalizedStatusTesting
@libar-docs-status:active
@libar-docs-product-area:CoreTypes
@libar-docs-include:core-types
@taxonomy @status
Feature: Normalized Status Taxonomy
  The normalized status module maps raw FSM states (roadmap, active, completed,
  deferred) to three display buckets (completed, active, planned) for UI
  presentation and generated documentation output.

  Background:
    Given a normalized status test context

  Rule: normalizeStatus maps raw FSM states to display buckets

    **Invariant:** normalizeStatus must map every raw FSM status to exactly one of three display buckets: completed, active, or planned. Unknown or undefined inputs default to planned.
    **Rationale:** UI and generated documentation need a simplified status model; the raw 4-state FSM is an implementation detail that should not leak into display logic.
    **Verified by:** Status normalization, normalizeStatus defaults undefined to planned, normalizeStatus defaults unknown status to planned

    @function:normalizeStatus @happy-path
    Scenario Outline: Status normalization
      When normalizing status "<rawStatus>"
      Then the normalized status is "<normalizedStatus>"

      Examples:
        | rawStatus | normalizedStatus |
        | completed | completed        |
        | active    | active           |
        | roadmap   | planned          |
        | deferred  | planned          |
        | planned   | planned          |

    @function:normalizeStatus
    Scenario: normalizeStatus defaults undefined to planned
      When normalizing an undefined status
      Then the normalized status is "planned"

    @function:normalizeStatus
    Scenario: normalizeStatus defaults unknown status to planned
      When normalizing status "unknown-value"
      Then the normalized status is "planned"

  Rule: Pattern status predicates check normalized state

    **Invariant:** isPatternComplete, isPatternActive, and isPatternPlanned are mutually exclusive for any given status input. Exactly one returns true.
    **Rationale:** Consumers branch on these predicates; overlapping true values would cause double-rendering or contradictory UI states.
    **Verified by:** isPatternComplete classification, isPatternActive classification, isPatternPlanned classification

    @function:isPatternComplete @happy-path
    Scenario Outline: isPatternComplete classification
      When checking isPatternComplete for "<status>"
      Then the predicate result is "<expected>"

      Examples:
        | status    | expected |
        | completed | true     |
        | active    | false    |
        | roadmap   | false    |
        | deferred  | false    |

    @function:isPatternActive @happy-path
    Scenario Outline: isPatternActive classification
      When checking isPatternActive for "<status>"
      Then the predicate result is "<expected>"

      Examples:
        | status    | expected |
        | active    | true     |
        | completed | false    |
        | roadmap   | false    |
        | deferred  | false    |

    @function:isPatternPlanned @happy-path
    Scenario Outline: isPatternPlanned classification
      When checking isPatternPlanned for "<status>"
      Then the predicate result is "<expected>"

      Examples:
        | status    | expected |
        | roadmap   | true     |
        | deferred  | true     |
        | completed | false    |
        | active    | false    |
