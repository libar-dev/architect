@architect
@architect-pattern:CoreGraphExecutableTests
@architect-status:completed
@architect-product-area:DataAPI
@architect-implements:GraphHandle
@architect-bounded-context:read-api
@graph @public-contract
Feature: Frozen core Graph contract
  The core graph package exposes a pure handle over a canonical PatternGraph and
  a mechanical import graph. Construction performs no source, config, or git IO.

  Background:
    Given the smallest valid canonical and mechanical graph fixture

  Rule: The handle exposes canonical and need-shaped reads

    **Invariant:** The public Graph exposes the complete canonical graph, decoded authored and mechanical values, exact pattern and file lookup, and the existing deterministic FSM operations.
    **Verified by:** Exact lookup and FSM delegation use the frozen core contract

    Scenario: Exact lookup and FSM delegation use the frozen core contract
      Then the canonical graph total is 5
      And exact lookup returns "GraphHandle"
      And file lookup returns "GraphHandle"
      And roadmap to active is a valid FSM transition

  Rule: Status maturity is total

    **Invariant:** Every accepted status maps to its canonical maturity and deferred maps to plan.
    **Verified by:** All accepted statuses derive canonical maturity

    Scenario: All accepted statuses derive canonical maturity
      Then candidate maturity is "idea"
      And roadmap maturity is "plan"
      And active maturity is "design"
      And completed maturity is "executable"
      And deferred maturity is "plan"

  Rule: Public graph state is deeply immutable

    **Invariant:** Graph, canonical, authored, mechanical, need-shaped nodes, arrays, and nested relationship records are frozen, and attempted mutation cannot alter later reads.
    **Verified by:** Reachable public graph values resist mutation

    Scenario: Reachable public graph values resist mutation
      Then every reachable public graph value is frozen
      When I attempt to mutate the GraphHandle node and nested relationship
      Then the mutation is rejected
      And exact lookup still returns "GraphHandle"
      And the GraphHandle dependency is still "DeferredWork"
