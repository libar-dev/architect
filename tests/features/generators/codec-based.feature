@libar-docs
@libar-docs-pattern:CodecBasedGeneratorTesting
@libar-docs-status:completed
@libar-docs-product-area:Generation
@libar-docs-implements:CodecBasedGenerator,GeneratorInfrastructureTesting
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

    @acceptance-criteria @happy-path
    Scenario: Generator delegates to codec
      Given a CodecBasedGenerator wrapping "patterns" document type
      And a context with MasterDataset containing patterns
      When the generator generate method is called
      Then the output should contain a file with path "PATTERNS.md"
      And the output should have no errors

    @acceptance-criteria @validation
    Scenario: Missing MasterDataset returns error
      Given a CodecBasedGenerator for "patterns" document type
      And a context WITHOUT MasterDataset
      When the generator generate method is called
      Then the output should have no files
      And the output should contain an error mentioning "MasterDataset"

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
