@architect
@architect-pattern:ProcessApiCliMetadata
@architect-implements:DataAPICLIErgonomics
@architect-status:active
@architect-product-area:DataAPI
@cli @pattern-graph-cli @metadata
Feature: Process API CLI - Response Metadata
  Response metadata includes validation summary and pipeline timing for diagnostics.

  Background:
    Given a temporary working directory

  # ============================================================================
  # RULE 1: Validation Summary in Metadata
  # ============================================================================

  Rule: Response metadata includes validation summary

    **Invariant:** Every JSON response envelope must include a metadata.validation object with danglingReferenceCount, malformedPatternCount, unknownStatusCount, and warningCount fields, plus a numeric pipelineMs timing.
    **Rationale:** Consumers use validation counts to detect annotation quality degradation without running a separate validation pass. Pipeline timing enables performance regression detection in CI.

    @acceptance-criteria @happy-path
    Scenario: Validation summary in response metadata
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' status"
      Then exit code is 0
      And stdout is valid JSON with key "metadata"
      And metadata has a validation object with count fields
      And metadata has a numeric pipelineMs field

    @happy-path
    Scenario: Pipeline timing in metadata
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' status"
      Then exit code is 0
      And metadata has a numeric pipelineMs field
