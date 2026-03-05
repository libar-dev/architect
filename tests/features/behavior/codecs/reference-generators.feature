@libar-docs
@behavior @reference-generators
@libar-docs-pattern:ReferenceGeneratorTesting
@libar-docs-status:completed
@libar-docs-implements:ReferenceDocShowcase
@libar-docs-product-area:Generation
Feature: Reference Document Generator Registration

  Registers reference document generators from project config. Configs with
  `productArea` set are routed to a "product-area-docs" meta-generator;
  configs without `productArea` go to "reference-docs". Each config also
  produces TWO individual generators (detailed + summary).

  Background:
    Given a reference generator test context

  Rule: Registration produces the correct number of generators

    **Invariant:** Each reference config produces exactly 2 generators (detailed + summary), plus meta-generators for product-area and non-product-area routing.
    **Rationale:** The count is deterministic from config — any mismatch indicates a registration bug that would silently drop generated documents.
    **Verified by:** Generators are registered from configs plus meta-generators

    @happy-path
    Scenario: Generators are registered from configs plus meta-generators
      When registering reference generators
      Then 20 generators are registered

  Rule: Product area configs produce a separate meta-generator

    **Invariant:** Configs with productArea set route to "product-area-docs" meta-generator; configs without route to "reference-docs".
    **Rationale:** Product area docs are rendered into per-area subdirectories while standalone references go to the root output.
    **Verified by:** Product area meta-generator is registered

    @happy-path
    Scenario: Product area meta-generator is registered
      When registering reference generators
      Then a generator named "product-area-docs" exists
      And a generator named "reference-docs" exists

  Rule: Generator naming follows kebab-case convention

    **Invariant:** Detailed generators end in "-reference" and summary generators end in "-reference-claude".
    **Rationale:** Consistent naming enables programmatic discovery and distinguishes human-readable from AI-optimized outputs.
    **Verified by:** Detailed generator has name ending in "-reference", Summary generator has name ending in "-reference-claude"

    @happy-path
    Scenario: Detailed generator has name ending in "-reference"
      When registering reference generators
      Then a generator named "annotation-overview-reference" exists
      And a generator named "reference-generation-sample-reference" exists

    @happy-path
    Scenario: Summary generator has name ending in "-reference-claude"
      When registering reference generators
      Then a generator named "annotation-overview-reference-claude" exists
      And a generator named "reference-generation-sample-reference-claude" exists

    @happy-path
    Scenario: Architecture-types generators are registered
      When registering reference generators
      Then a generator named "architecture-types-reference" exists
      And a generator named "architecture-types-reference-claude" exists

  Rule: Generator execution produces markdown output

    **Invariant:** Every registered generator must produce at least one non-empty output file when given matching data.
    **Rationale:** A generator that produces empty output wastes a pipeline slot and creates confusion when expected docs are missing.
    **Verified by:** Product area generator with matching data produces non-empty output, Product area generator with no patterns still produces intro

    @happy-path
    Scenario: Product area generator with matching data produces non-empty output
      Given a MasterDataset with a pattern in product area "Annotation"
      When running the "annotation-overview-reference" generator
      Then the output has 1 file
      And the output file path starts with "product-areas/"
      And the output file content is non-empty

    @happy-path
    Scenario: Product area generator with no patterns still produces intro
      Given an empty MasterDataset
      When running the "annotation-overview-reference" generator
      Then the output has 1 file
      And the output file content contains "How do I annotate code?"

    @integration
    Scenario: ARCHITECTURE-TYPES generator produces shapes and convention content
      Given a MasterDataset with pipeline architecture conventions and master dataset shapes
      When running the "architecture-types-reference" generator
      Then the output has 1 file
      And the output file path starts with "reference/"
      And the output file content contains all of "MasterDatasetSchema", "PipelineOptions", "Orchestrator Pipeline Responsibilities", and "graph TB"
