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

    @happy-path
    Scenario: Generators are registered from configs plus meta-generators
      When registering reference generators
      Then 18 generators are registered

  Rule: Product area configs produce a separate meta-generator

    @happy-path
    Scenario: Product area meta-generator is registered
      When registering reference generators
      Then a generator named "product-area-docs" exists
      And a generator named "reference-docs" exists

  Rule: Generator naming follows kebab-case convention

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

  Rule: Generator execution produces markdown output

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
