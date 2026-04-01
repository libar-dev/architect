@architect
@architect-pattern:ProcessApiCliDryRun
@architect-implements:DataAPICLIErgonomics
@architect-status:active
@architect-product-area:DataAPI
@cli @pattern-graph-cli @dry-run
Feature: Process API CLI - Dry Run
  Dry-run mode shows pipeline scope without processing data.

  Background:
    Given a temporary working directory

  # ============================================================================
  # RULE 1: Dry-Run Pipeline Scope
  # ============================================================================

  Rule: Dry-run shows pipeline scope without processing

    **Invariant:** The --dry-run flag must display file counts, config status, and cache status without executing the pipeline. Output must contain the DRY RUN marker and must not contain a JSON success envelope.
    **Rationale:** Dry-run enables users to verify their input patterns resolve to expected files before committing to the 2-5s pipeline cost, which is especially valuable when debugging glob patterns or config auto-detection.
    **Verified by:** Dry-run shows file counts, Dry-run reports architect.config.js auto-detection

    @happy-path
    Scenario: Dry-run shows file counts
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' --dry-run status"
      Then exit code is 0
      And stdout contains dry run marker, file counts, config, and cache status
      And stdout does not contain "success"

    @happy-path
    Scenario: Dry-run reports architect.config.js auto-detection
      Given TypeScript files with pattern annotations
      And an architect.config.js with TypeScript sources
      When running "pattern-graph-cli --dry-run status"
      Then exit code is 0
      And stdout contains "architect.config.js (auto-detected)"
      And stdout does not contain "success"
