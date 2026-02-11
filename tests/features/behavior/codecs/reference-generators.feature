@behavior @reference-generators
@libar-docs-pattern:ReferenceGeneratorTesting
@libar-docs-product-area:Generator
Feature: Reference Document Generator Registration

  Registers all 11 reference document generators. Each config produces
  TWO generators (detailed + summary), yielding 22 total registrations.
  Generators implement DocumentGenerator directly, not via CodecBasedGenerator.

  Background:
    Given a reference generator test context

  Rule: Registration produces the correct number of generators

    @happy-path
    Scenario: All 22 generators are registered from 11 configs
      When registering reference generators
      Then 22 generators are registered

  Rule: Generator naming follows kebab-case convention

    @happy-path
    Scenario: Detailed generator has name ending in "-reference"
      When registering reference generators
      Then a generator named "process-guard-reference" exists
      And a generator named "session-guides-reference" exists

    @happy-path
    Scenario: Summary generator has name ending in "-reference-claude"
      When registering reference generators
      Then a generator named "process-guard-reference-claude" exists
      And a generator named "architecture-reference-claude" exists

  Rule: Generator execution produces markdown output

    @happy-path
    Scenario: Generator with matching data produces non-empty output
      Given a MasterDataset with a convention-tagged pattern for "testing-policy"
      When running the "gherkin-patterns-reference" generator
      Then the output has 1 file
      And the output file path starts with "docs/"
      And the output file content is non-empty

    @happy-path
    Scenario: Generator with no matching data produces minimal output
      Given an empty MasterDataset
      When running the "process-guard-reference" generator
      Then the output has 1 file
      And the output file content contains "No content found"
