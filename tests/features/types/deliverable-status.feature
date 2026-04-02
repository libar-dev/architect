@architect
@architect-pattern:DeliverableStatusTaxonomyTesting
@architect-status:active
@architect-implements:TypeScriptTaxonomyImplementation
@architect-product-area:CoreTypes
@architect-include:core-types
@taxonomy @deliverable
Feature: Deliverable Status Taxonomy
  The deliverable status module defines the 6 canonical status values for
  deliverables in Gherkin Background tables: complete, in-progress, pending,
  deferred, superseded, n/a. It provides predicates for status classification
  and terminal status checks for DoD validation.

  Background:
    Given a deliverable status test context

  Rule: isDeliverableStatusTerminal identifies terminal statuses for DoD validation

    **Invariant:** Only complete, n/a, and superseded are terminal. Deferred is NOT terminal because it implies unfinished work that should block DoD.
    **Rationale:** Marking a pattern as completed when deliverables are merely deferred creates a hard-locked state with incomplete work, violating delivery process integrity.
    **Verified by:** Terminal status classification

    @function:isDeliverableStatusTerminal @happy-path
    Scenario Outline: Terminal status classification
      When checking if "<status>" is terminal
      Then the terminal check result is "<isTerminal>"

      Examples:
        | status      | isTerminal |
        | complete    | true       |
        | n/a         | true       |
        | superseded  | true       |
        | deferred    | false      |
        | in-progress | false      |
        | pending     | false      |

  Rule: Status predicates classify individual deliverable states

    **Invariant:** isDeliverableStatusComplete, isDeliverableStatusInProgress, and isDeliverableStatusPending each match exactly one status value.
    **Rationale:** Single-value predicates provide type-safe branching for consumers that need to distinguish specific states rather than terminal vs non-terminal groupings.
    **Verified by:** isDeliverableStatusComplete classification, isDeliverableStatusInProgress classification, isDeliverableStatusPending classification

    @function:isDeliverableStatusComplete @happy-path
    Scenario Outline: isDeliverableStatusComplete classification
      When checking if "<status>" is complete
      Then the predicate result is "<expected>"

      Examples:
        | status      | expected |
        | complete    | true     |
        | in-progress | false    |
        | pending     | false    |
        | deferred    | false    |
        | superseded  | false    |
        | n/a         | false    |

    @function:isDeliverableStatusInProgress @happy-path
    Scenario Outline: isDeliverableStatusInProgress classification
      When checking if "<status>" is in-progress
      Then the predicate result is "<expected>"

      Examples:
        | status      | expected |
        | in-progress | true     |
        | complete    | false    |
        | pending     | false    |
        | deferred    | false    |
        | superseded  | false    |
        | n/a         | false    |

    @function:isDeliverableStatusPending @happy-path
    Scenario Outline: isDeliverableStatusPending classification
      When checking if "<status>" is pending
      Then the predicate result is "<expected>"

      Examples:
        | status      | expected |
        | pending     | true     |
        | complete    | false    |
        | in-progress | false    |
        | deferred    | false    |
        | superseded  | false    |
        | n/a         | false    |

  Rule: getDeliverableStatusEmoji returns display emoji for all statuses

    **Invariant:** getDeliverableStatusEmoji returns a non-empty string for all 6 canonical statuses. No status value is unmapped.
    **Rationale:** Missing emoji mappings would cause empty display cells in generated documentation tables, breaking visual consistency.
    **Verified by:** Emoji mapping for all statuses

    @function:getDeliverableStatusEmoji @happy-path
    Scenario Outline: Emoji mapping for all statuses
      When getting the emoji for "<status>"
      Then the emoji is not empty

      Examples:
        | status      |
        | complete    |
        | in-progress |
        | pending     |
        | deferred    |
        | superseded  |
        | n/a         |
