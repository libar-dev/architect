@architect
@architect-pattern:ProcessApiCliRepl
@architect-implements:DataAPICLIErgonomics
@architect-status:active
@architect-product-area:DataAPI
@cli @pattern-graph-cli @repl
Feature: Process API CLI - REPL Mode
  Interactive REPL mode keeps the pipeline loaded for multi-query sessions and supports reload.

  Background:
    Given a temporary working directory

  # ============================================================================
  # RULE 1: Multi-Query Sessions
  # ============================================================================

  Rule: REPL mode accepts multiple queries on a single pipeline load

    **Invariant:** REPL mode loads the pipeline once and accepts multiple queries on stdin, eliminating per-query pipeline overhead.
    **Rationale:** Design sessions involve 10-20 exploratory queries in sequence. REPL mode eliminates per-query pipeline overhead entirely.

    @acceptance-criteria @happy-path
    Scenario: REPL accepts multiple queries
      Given TypeScript files with pattern annotations
      When piping "status" then "list" then "quit" to the REPL
      Then the REPL output contains status JSON
      And the REPL output contains list JSON
      And the REPL exits cleanly

    @acceptance-criteria @happy-path
    Scenario: REPL shows help output
      Given TypeScript files with pattern annotations
      When piping "help" then "quit" to the REPL
      Then the REPL output contains available commands

  # ============================================================================
  # RULE 2: Pipeline Reload
  # ============================================================================

  Rule: REPL reload rebuilds the pipeline from fresh sources

    **Invariant:** The reload command rebuilds the pipeline from fresh sources and subsequent queries use the new dataset.
    **Rationale:** During implementation sessions, source files change frequently. Reload allows refreshing without restarting the REPL.

    @acceptance-criteria @happy-path
    Scenario: REPL reloads pipeline on command
      Given TypeScript files with pattern annotations
      When piping "status" then "reload" then "status" then "quit" to the REPL
      Then the REPL stderr contains "Reloading pipeline"
      And the REPL stderr contains "Reloaded"
      And the REPL output contains two status responses
