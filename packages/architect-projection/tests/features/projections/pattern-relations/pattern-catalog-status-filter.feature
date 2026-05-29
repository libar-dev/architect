@architect
@architect-pattern:PatternCatalogStatusFilterExecutableTests
@architect-implements:PatternRelationsProjectionSupport
@architect-status:completed
@architect-product-area:Projection
@architect-role:projection
@projection @pattern-relations
Feature: Pattern catalog status filter speaks both FSM and normalized words
  The pattern catalog `--status` filter accepts every word a cold-start agent
  reads in `overview`/`getStatusDistribution`. The normalized bucket word
  `planned` matches the roadmap ∪ deferred union; the FSM-authored values
  (candidate/roadmap/active/completed/deferred) match exactly. This removes the
  third-word trap where the agent reads `planned` but `list --status planned`
  rejects it.

  Background:
    Given a pattern catalog spanning every authored status

  Rule: The normalized bucket word filters the union

    **Invariant:** Filtering by `planned` returns exactly the patterns whose
    normalized status is `planned` — i.e. status `roadmap` OR `deferred` — so
    the count equals the roadmap bucket plus the deferred bucket.
    **Verified by:** Planned filter returns the roadmap and deferred union

    @happy-path
    Scenario: Planned filter returns the roadmap and deferred union
      When I filter the pattern catalog by status "planned"
      Then the catalog should list the roadmap and deferred patterns
      And the catalog should not list the candidate, active, or completed patterns

  Rule: FSM authored words still exact-match

    **Invariant:** `roadmap` returns only roadmap patterns, `deferred` returns
    only deferred patterns, and the union of the two equals the `planned` filter
    result.
    **Verified by:** Roadmap filter is exact, Deferred filter is exact

    @happy-path
    Scenario: Roadmap filter is exact
      When I filter the pattern catalog by status "roadmap"
      Then the catalog should list only the roadmap patterns

    @happy-path
    Scenario: Deferred filter is exact
      When I filter the pattern catalog by status "deferred"
      Then the catalog should list only the deferred patterns

  Rule: candidate stays pre-FSM and outside the planned bucket

    **Invariant:** `candidate` returns only candidate patterns and is excluded
    from the `planned` bucket.
    **Verified by:** Candidate filter is exact and excluded from planned

    @happy-path
    Scenario: Candidate filter is exact and excluded from planned
      When I filter the pattern catalog by status "candidate"
      Then the catalog should list only the candidate patterns
