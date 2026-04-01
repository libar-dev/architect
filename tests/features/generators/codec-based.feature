@architect
@architect-pattern:CodecBasedGeneratorTesting
@architect-status:completed
@architect-unlock-reason:Remove-obsolete-null-guard-scenario
@architect-product-area:Generation
@architect-implements:CodecBasedGenerator,GeneratorInfrastructureTesting
Feature: Codec-Based Generator

  Tests the CodecBasedGenerator which adapts the RenderableDocument Model (RDM)
  codec system to the DocumentGenerator interface. This enables codec-based
  document generation to work seamlessly with the existing orchestrator.

  Background: Codec-based generator test context
    Given a codec-based generator test context

  # ===========================================================================
  # Rule 1: CodecBasedGenerator adapts codecs to generator interface
  # ===========================================================================

  Rule: CodecBasedGenerator adapts codecs to generator interface

    **Invariant:** CodecBasedGenerator delegates document generation to the underlying codec and surfaces codec errors through the generator interface.
    **Rationale:** The adapter pattern enables codec-based rendering to integrate with the existing orchestrator without modifying either side. MasterDataset is required in context — enforced by the TypeScript type system, not at runtime.
    **Verified by:** Generator delegates to codec, Codec options are passed through

    @acceptance-criteria @happy-path
    Scenario: Generator delegates to codec
      Given a CodecBasedGenerator wrapping "patterns" document type
      And a context with MasterDataset containing patterns
      When the generator generate method is called
      Then the output should contain a file with path "PATTERNS.md"
      And the output should have no errors

    @acceptance-criteria @happy-path
    Scenario: Codec options are passed through
      Given a CodecBasedGenerator for "pr-changes" document type
      And a context with MasterDataset
      And codecOptions with changedFiles filter:
        | file              |
        | src/core/types.ts |
        | src/api/index.ts  |
      When the generator generate method is called
      Then the output should contain a file with path "working/PR-CHANGES.md"
