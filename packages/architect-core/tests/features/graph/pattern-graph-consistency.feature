@architect
@architect-pattern:PatternGraphConsistencyExecutableTests
@architect-implements:PatternGraph
@architect-status:active
@architect-product-area:DataAPI
@graph @read-api
Feature: PatternGraph fields tell a mutually consistent story
  Consumers script direct reads over one canonical PatternGraph. Its precomputed
  fields must agree without relying on a facade to reconcile them.

  Background:
    Given a representative canonical pattern graph

  Rule: Status views form one exact partition

    **Invariant:** Each normalized status count equals its bucket length, the four counts sum to total, and planned is exactly roadmap plus deferred.
    **Verified by:** Canonical status fields agree

    Scenario: Canonical status fields agree
      Then every normalized status count equals its bucket length
      And the normalized status counts sum to the total
      And the planned bucket equals roadmap plus deferred

  Rule: Relationship fields are bidirectionally consistent

    **Invariant:** If AlphaCore uses BetaCore, BetaCore reports AlphaCore through both usedBy and enables, while seeAlso and apiRef remain on the canonical AlphaCore entry.
    **Verified by:** Canonical relationship fields agree

    Scenario: Canonical relationship fields agree
      Then "AlphaCore" uses "BetaCore"
      And "BetaCore" is used by and enables "AlphaCore"
      And "AlphaCore" retains its related pattern and API reference

  Rule: Independent graph inventory agrees with canonical counts

    **Invariant:** aggregateTagUsage status totals equal the PatternGraph status counts and grand total.
    **Verified by:** Inventory status totals match canonical counts

    Scenario: Inventory status totals match canonical counts
      Then tag inventory status counts equal canonical status counts
