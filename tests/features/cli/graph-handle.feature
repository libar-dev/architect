@architect
@architect-pattern:GraphHandleCliExecutableTests
@architect-status:completed
@architect-unlock-reason:Executable-tests-for-the-shipped-graph-handle-born-completed-with-passing-suite
@architect-product-area:DataAPI
@architect-implements:GraphHandleCli
@architect-bounded-context:cli
@cli @graph-handle
Feature: Graph-handle CLI — the agent read surface

  The `architect` bin's q front door evaluates agent-authored JS against the
  live graph handle (`g`) and the named commands are runnable documentation
  over it. These scenarios assert INVARIANTS that survive annotation growth —
  never frozen counts (the graph builds live; exact numbers drift by design).

  Rule: The q front door evaluates agent scripts against the live graph

    **Invariant:** An argv expression, an argv multi-statement body, and a
    piped stdin script each evaluate with `g` in scope and print the returned
    value; a body using `import` fails loud with a hint naming the injected
    globals instead of silently doing nothing.

    **Rationale:** q is the primary agent surface (ADR-014) — the round-trip
    forms and the loud failure mode are the contract that makes "script the
    rest" dependable enough to replace the verb wall.

    **Verified by:** the four scenarios below.

    @happy-path
    Scenario: argv expression round-trips against the live graph
      When I run the graph CLI with q expression "g.pattern('GraphHandle')?.name"
      Then the exit code is zero
      And stdout is "GraphHandle"

    @happy-path
    Scenario: the CLI composes the public core Graph
      When I load the CLI graph composition
      Then the handle is the public core Graph
      And the handle has no api field
      And the canonical graph and FSM are frozen
      And deferred patterns have plan maturity

    @happy-path
    Scenario: the migrated handle exposes canonical graph and FSM values
      When I run the migrated handle characterization
      Then the exit code is zero
      And the characterization reports api is absent
      And the characterization reports FSM is available
      And the characterization reports canonical graph is frozen
      And the characterization reports deferred maturity is plan

    @happy-path
    Scenario: argv multi-statement body round-trips
      When I run the graph CLI with q expression "const p = g.pattern('GraphHandle'); return p?.name"
      Then the exit code is zero
      And stdout is "GraphHandle"

    @happy-path
    Scenario: stdin script round-trips
      When I pipe a script returning the GraphHandle sentinel into the graph CLI
      Then the exit code is zero
      And stdout is "GraphHandle"

    @negative
    Scenario: the removed api field fails loud
      When I run the graph CLI with q expression "return g.api.getStatusCounts()"
      Then the exit code is non-zero
      And stderr mentions "getStatusCounts"

    @negative
    Scenario: canonical graph mutation cannot corrupt a fresh read
      When I attempt canonical graph mutation through q
      Then mutation throws or the GraphHandle sentinel remains unchanged
      And a fresh q invocation returns the GraphHandle sentinel

    @negative
    Scenario: an import in the body fails loud with the injected-globals hint
      When I run the graph CLI with q expression "import x from 'y'"
      Then the exit code is non-zero
      And stderr mentions "injected globals"

  Rule: The decoded graph holds its structural invariants

    **Invariant:** Scoped drift stays at zero dangling `uses` edges; spec
    maturity and provenance stay coherent (an executable-provenance spec is
    always executable-maturity and vice versa); the entry adapters and the
    spec bridge return non-empty results for stable inputs.

    **Rationale:** These are the honesty guarantees the handle's decode adds
    over the raw core — if any of them regresses, agents scripting the handle
    silently read wrong architecture.

    **Verified by:** one battery script (one graph build, four assertions).

    @happy-path
    Scenario: the invariant battery passes against the live graph
      When I pipe the invariant battery script into the graph CLI
      Then the exit code is zero
      And the battery reports zero dangling uses edges
      And the battery reports coherent spec maturity and provenance
      And the battery reports non-empty entry adapters
      And the battery reports a working spec bridge

  Rule: The dangling gate is a deterministic machine contract

    **Invariant:** `architect dangling --baseline <committed> --strict` exits
    zero when the working tree matches the committed baseline and returns the
    exact established JSON document shape.

    **Rationale:** This is the ONE frozen machine contract on the bin (CI is
    its second caller, per the second-caller bar); its exit semantics are the
    graph-integrity gate `ci:verify` depends on.

    **Verified by:** the scenario below (mirrors the CI invocation).

    @happy-path
    Scenario: the strict gate passes against the committed baseline
      When I run the graph CLI dangling gate against the committed baseline
      Then the exit code is zero
      And stdout matches the exact strict dangling JSON shape
