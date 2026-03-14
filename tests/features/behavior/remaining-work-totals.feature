@architect
@architect-pattern:RemainingWorkSummaryAccuracy
@architect-status:completed
@architect-product-area:Generation
Feature: Remaining Work Summary Accuracy

  Summary totals in REMAINING-WORK.md must match the sum of phase table rows.
  The backlog calculation must correctly identify patterns without phases
  using pattern.id (which is always defined) rather than patternName.

  Background: Session codec test context
    Given a session codec test context

  # ===========================================================================
  # Rule 1: Summary totals match phase table sums
  # ===========================================================================

  Rule: Summary totals equal sum of phase table rows

    **Invariant:** The summary Active and Total Remaining counts must exactly equal the sum of the corresponding counts across all phase table rows.
    **Rationale:** A mismatch between summary and phase-level totals indicates patterns are being double-counted or dropped.
    **Verified by:** Summary matches phase table with all patterns having phases, Summary includes completed patterns correctly

    Scenario: Summary matches phase table with all patterns having phases
      Given a dataset with patterns:
        | id | patternName | status | phase |
        | p1 | PatternA | active | 1 |
        | p2 | PatternB | active | 1 |
        | p3 | PatternC | planned | 2 |
      When remaining work document is generated
      Then summary shows Active count 2
      And summary shows Total Remaining count 3
      And phase table rows sum to Active: 2, Remaining: 3

    Scenario: Summary includes completed patterns correctly
      Given a dataset with patterns:
        | id | patternName | status | phase |
        | p1 | PatternA | active | 1 |
        | p2 | PatternB | completed | 1 |
        | p3 | PatternC | planned | 2 |
      When remaining work document is generated
      Then summary shows Active count 1
      And summary shows Total Remaining count 2
      And completed patterns are not in remaining count

  # ===========================================================================
  # Rule 2: Backlog patterns are counted correctly
  # ===========================================================================

  Rule: Patterns without phases appear in Backlog row

    **Invariant:** Patterns that have no assigned phase must be grouped into a "Backlog" row in the phase table rather than being omitted.
    **Rationale:** Unphased patterns are still remaining work; omitting them would undercount the total.
    **Verified by:** Summary includes backlog patterns without phase, All patterns in backlog when none have phases

    Scenario: Summary includes backlog patterns without phase
      Given a dataset with patterns:
        | id | patternName | status | phase |
        | p1 | PatternA | active | 1 |
        | p2 | PatternB | active | |
        | p3 | PatternC | planned | |
      When remaining work document is generated
      Then summary shows Active count 2
      And summary shows Total Remaining count 3
      And phase table shows phase 1 row with Remaining: 1, Active: 1
      And phase table shows "Backlog" with Remaining: 2, Active: 1

    Scenario: All patterns in backlog when none have phases
      # When all patterns lack a phase, the codec does not generate a phase table
      # (there are no phases to show). Backlog patterns appear in the summary
      # and priority sections instead.
      Given a dataset with patterns:
        | id | patternName | status | phase |
        | p1 | PatternA | active | |
        | p2 | PatternB | planned | |
      When remaining work document is generated
      Then no phase table is generated
      And summary shows Active count 1
      And summary shows Total Remaining count 2

  # ===========================================================================
  # Rule 3: Patterns with undefined patternName handled correctly
  # ===========================================================================

  Rule: Patterns without patternName are counted using id

    **Invariant:** Pattern counting must use pattern.id as the identifier, never patternName, so that patterns with undefined names are neither double-counted nor omitted.
    **Rationale:** patternName is optional; relying on it for counting would miss unnamed patterns entirely.
    **Verified by:** Patterns with undefined patternName counted correctly, Mixed patterns with and without patternName

    Scenario: Patterns with undefined patternName counted correctly
      Given a dataset with patterns:
        | id | patternName | status | phase |
        | p1 | | active | 1 |
        | p2 | | planned | |
      When remaining work document is generated
      Then summary total equals phase table sum plus backlog
      And no patterns are double-counted
      And no patterns are missing from count

    Scenario: Mixed patterns with and without patternName
      Given a dataset with patterns:
        | id | patternName | status | phase |
        | p1 | PatternA | active | 1 |
        | p2 | | active | 1 |
        | p3 | PatternC | planned | |
        | p4 | | planned | |
      When remaining work document is generated
      Then summary shows Active count 2
      And summary shows Total Remaining count 4
      And phase 1 row shows Remaining: 2, Active: 2
      And backlog row shows Remaining: 2, Active: 0

  # ===========================================================================
  # Rule 4: Phase table includes all incomplete phases
  # ===========================================================================

  Rule: All phases with incomplete patterns are shown

    **Invariant:** The phase table must include every phase that contains at least one incomplete pattern, and phases with only completed patterns must be excluded.
    **Rationale:** Showing fully completed phases inflates the remaining work view, while omitting phases with incomplete patterns hides outstanding work.
    **Verified by:** Multiple phases shown in order, Completed phases not shown in remaining work

    Scenario: Multiple phases shown in order
      Given a dataset with patterns:
        | id | patternName | status | phase |
        | p1 | A | active | 1 |
        | p2 | B | planned | 5 |
        | p3 | C | planned | 3 |
      When remaining work document is generated
      Then phase table shows phases in order: 1, 3, 5
      And each phase row has correct counts

    Scenario: Completed phases not shown in remaining work
      Given a dataset with patterns:
        | id | patternName | status | phase |
        | p1 | A | completed | 1 |
        | p2 | B | completed | 1 |
        | p3 | C | active | 2 |
      When remaining work document is generated
      Then phase 1 is not shown in phase table
      And phase 2 is shown with Remaining: 1
