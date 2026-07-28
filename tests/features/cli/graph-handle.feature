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
      When I run the graph CLI with q expression "g.patterns.length"
      Then the exit code is zero
      And stdout is a number greater than 300

    @happy-path
    Scenario: argv multi-statement body round-trips
      When I run the graph CLI with q expression "const n = g.patterns.length; return n > 0"
      Then the exit code is zero
      And stdout is "true"

    @happy-path
    Scenario: stdin script round-trips
      When I pipe a script returning the pattern count into the graph CLI
      Then the exit code is zero
      And stdout is a number greater than 300

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
    zero when the working tree matches the committed baseline and reports
    `drift` as a boolean in its JSON document.

    **Rationale:** This is the ONE frozen machine contract on the bin (CI is
    its second caller, per the second-caller bar); its exit semantics are the
    graph-integrity gate `ci:verify` depends on.

    **Verified by:** the scenario below (mirrors the CI invocation).

    @happy-path
    Scenario: the strict gate passes against the committed baseline
      When I run the graph CLI dangling gate against the committed baseline
      Then the exit code is zero
      And stdout parses as JSON with "drift" false
