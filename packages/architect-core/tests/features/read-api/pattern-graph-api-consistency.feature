@architect
@architect-pattern:PatternGraphApiConsistencyExecutableTests
@architect-implements:PatternGraphApi
@architect-status:active
@architect-product-area:DataAPI
@architect-role:utility
@behavior @read-api
Feature: PatternGraphAPI tells a mutually-consistent story

  `PatternGraphAPI` is the instrument the system uses to report its own
  state. It exposes 29 methods over one frozen `PatternGraph`, and many of
  them answer overlapping questions in different shapes: status counts vs.
  status buckets, a delivery-pipeline distribution vs. a candidate share, a
  scalar completion percentage vs. the distribution it is drawn from, four
  FSM methods that must agree, and per-pattern relationship accessors that
  must mirror the canonical relationship index.

  Nothing previously pinned that these answers agree with one another. This
  suite encodes the cross-method consistency invariants the deep review
  surfaced: each scenario asserts that two or more methods report the same
  underlying truth, so the kernel becomes correct-by-guardrail instead of
  correct-by-accident. The fixture graph is built by the real
  `transformToPatternGraph` pipeline so every derived view (counts,
  buckets, phases, quarters, roles, the relationship index) is genuinely
  computed, not hand-rigged.

  Background: A representative graph derived by the real pipeline
    Given a representative pattern graph derived through the transform pipeline

  Rule: The status partition is exact

    The four normalized status buckets partition the graph: each count
    equals the length of its bucket, and the four sum to the grand total.

    **Invariant:** getStatusCounts().<status> == getPatternsByNormalizedStatus(<status>).length, and Σ buckets == total.
    **Verified by:** getStatusCounts, getPatternsByNormalizedStatus.

    @acceptance-criteria @happy-path
    Scenario: Each status count equals its bucket length
      When I read the status counts
      Then each normalized status count equals its bucket length

    @acceptance-criteria @happy-path
    Scenario: The four status counts sum to the total
      When I read the status counts
      Then the four normalized counts sum to the total count

  Rule: Delivery and candidate bases stay separate and correct

    Delivery percentages share one denominator — the delivery base
    `total - candidate` — and the three delivery shares sum to 100. The
    candidate share uses the grand total as its denominator and is therefore
    structurally distinct: the two groups must never be summed together.

    **Invariant:** deliveryPercentages == round(count / (total - candidate) * 100); Σ delivery == 100; candidateShare == round(candidate / total * 100).
    **Verified by:** getStatusCounts, getStatusDistribution.

    @acceptance-criteria @happy-path
    Scenario: The delivery base excludes candidates
      When I read the status counts
      And I read the status distribution
      Then completed plus active plus planned counts equal the delivery base
      And the delivery base equals total minus candidate

    @acceptance-criteria @happy-path
    Scenario: Each delivery percentage is its count over the delivery base
      When I read the status counts
      And I read the status distribution
      Then each delivery percentage equals round of its count over the delivery base
      And each delivery percentage is between 0 and 100

    @acceptance-criteria @happy-path
    Scenario: The three delivery percentages sum to 100
      When I read the status distribution
      Then the three delivery percentages sum to 100

    @acceptance-criteria @happy-path
    Scenario: The candidate share is computed on the grand total
      When I read the status counts
      And I read the status distribution
      Then the candidate share equals round of candidate over total

    @acceptance-criteria @edge-case
    Scenario: A candidate-only graph has no delivery percentages and never divides by zero
      Given a candidate-only pattern graph derived through the transform pipeline
      When I read the status distribution
      Then every delivery percentage is 0
      And the candidate share is 100

  Rule: The completion percentage agrees with the distribution

    The scalar `getCompletionPercentage()` and the distribution's completed
    delivery percentage are two reports of the same number.

    **Invariant:** getCompletionPercentage() == getStatusDistribution().deliveryPercentages.completed.
    **Verified by:** getCompletionPercentage, getStatusDistribution.

    @acceptance-criteria @happy-path
    Scenario: Completion percentage equals the distribution completed share
      When I read the status distribution
      Then the completion percentage equals the completed delivery percentage

  Rule: The four FSM methods agree

    `isValidTransition`, `getValidTransitionsFrom`, and `checkTransition`
    must agree on whether a transition is legal, and `getProtectionInfo`
    must reflect the same protection model the transitions encode.

    **Invariant:** isValidTransition(f,t) == getValidTransitionsFrom(f).includes(t) == checkTransition(f,t).valid; protection level matches the documented model.
    **Verified by:** isValidTransition, getValidTransitionsFrom, checkTransition, getProtectionInfo.

    @acceptance-criteria @happy-path
    Scenario: A legal transition agrees across the three transition methods
      When I evaluate the transition from "active" to "completed"
      Then isValidTransition reports the transition legal
      And the valid-transitions list includes the target
      And checkTransition reports the transition valid
      And the three transition methods agree on the transition

    @acceptance-criteria @error-path
    Scenario: An illegal transition agrees across the three transition methods
      When I evaluate the transition from "active" to "deferred"
      Then isValidTransition reports the transition illegal
      And the valid-transitions list excludes the target
      And checkTransition reports the transition invalid
      And the three transition methods agree on the transition

    @acceptance-criteria @happy-path
    Scenario: Protection info reflects the terminal state as hard-locked
      When I read the protection info for "completed"
      Then the protection level is "hard"
      And the protection info requires an unlock
      And the protection info forbids adding deliverables

    @acceptance-criteria @happy-path
    Scenario: Protection info reflects an editable state as unlocked
      When I read the protection info for "roadmap"
      Then the protection level is "none"
      And the protection info does not require an unlock
      And the protection info allows adding deliverables

  Rule: Relationship reverse edges stay consistent with the canonical index

    Per-pattern relationship and dependency accessors derive from the
    canonical relationship index, with no silent local fallback. When A uses
    B, B must report A in its reverse edges, and the dependency and
    relationship views must report the same reverse edges.

    **Invariant:** A.uses contains B  ⟺  B.usedBy contains A; getPatternDependencies and getPatternRelationships share one source.
    **Verified by:** getPatternRelationships, getPatternDependencies, getRelatedPatterns, getApiReferences.

    @acceptance-criteria @happy-path
    Scenario: A uses B implies B is used by A
      When I read the relationships for the using and used patterns
      Then the using pattern uses the used pattern
      And the used pattern is used by the using pattern
      And the used pattern enables the using pattern

    @acceptance-criteria @happy-path
    Scenario: Dependencies and relationships report the same reverse edges
      When I read the relationships for the used pattern
      And I read the dependencies for the used pattern
      Then the dependency usedBy edges equal the relationship usedBy edges
      And the dependency enables edges equal the relationship enables edges

    @acceptance-criteria @happy-path
    Scenario: The related-pattern and api-reference accessors mirror the relationship view
      When I read the relationships for the using pattern
      Then the related patterns equal the relationship seeAlso edges
      And the api references equal the relationship apiRef edges

  Rule: Phase and quarter rollups never exceed the whole

    Active phases are a subset of all phases, every per-phase and
    per-quarter count is bounded by the grand total, and `getPhaseProgress`
    agrees with the patterns `getPatternsByPhase` returns.

    **Invariant:** getActivePhases() ⊆ getAllPhases(); phase/quarter totals ≤ grand total; getPhaseProgress(p).total == getPatternsByPhase(p).length.
    **Verified by:** getActivePhases, getAllPhases, getPatternsByPhase, getPhaseProgress, getQuarters.

    @acceptance-criteria @happy-path
    Scenario: Active phases are a subset of all phases
      When I read the active phases
      Then every active phase appears among all phases
      And every active phase has at least one active pattern

    @acceptance-criteria @happy-path
    Scenario: Phase and quarter rollups are bounded by the grand total
      When I read the status counts
      Then no phase total exceeds the grand total
      And every phase bucket partitions its own total
      And no quarter total exceeds the grand total
      And every quarter total equals its pattern-list length

    @acceptance-criteria @happy-path
    Scenario: Phase progress agrees with the phase patterns
      When I read the status counts
      Then each phase progress total equals its pattern count
      And each phase progress completed count equals its bucket completed count

  Rule: Recently-completed returns only completed patterns within the limit

    `getRecentlyCompleted` must return only completed patterns, respect the
    requested limit, and order them by completion date descending.

    **Invariant:** every result is completed; length ≤ limit; ordered by completed date descending.
    **Verified by:** getRecentlyCompleted, getPatternsByNormalizedStatus.

    @acceptance-criteria @happy-path
    Scenario: Recently-completed respects the limit and reports only completed patterns
      When I read the 2 most recently completed patterns
      Then at most 2 patterns are returned
      And every returned pattern is in the completed bucket
      And every returned pattern has a completed date
      And the returned patterns are ordered by completed date descending

  Rule: The tag-usage oracle agrees with the status counters

    `aggregateTagUsage` is an independent inventory of the graph. Its status
    tally must not disagree with the kernel's status counters.

    **Invariant:** aggregateTagUsage(status).{active,completed,candidate} == getStatusCounts().{active,completed,candidate}; total == grand total.
    **Verified by:** aggregateTagUsage, getStatusCounts.

    @acceptance-criteria @happy-path
    Scenario: The tag-usage status tally agrees with the status counts
      When I read the status counts
      And I aggregate tag usage over the graph
      Then the tag-usage active count equals the active status count
      And the tag-usage completed count equals the completed status count
      And the tag-usage candidate count equals the candidate status count
      And the tag-usage status total equals the grand total
