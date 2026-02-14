@libar-docs
@libar-docs-pattern:SourceMerging
@libar-docs-status:completed
@libar-docs-product-area:Configuration
@behavior @config
Feature: Source Merging - Per-Generator Override Resolution
  mergeSourcesForGenerator computes effective sources for a specific
  generator by applying per-generator overrides to base resolved sources.

  **Problem:**
  - Different generators may need different feature or input sources
  - Override semantics must be predictable and well-defined
  - Base exclude patterns must always be inherited

  **Solution:**
  - replaceFeatures (non-empty) replaces base features entirely
  - additionalFeatures appends to base features
  - additionalInput appends to base typescript sources
  - exclude is always inherited from base (no override mechanism)

  Background:
    Given a source merging test context

  Rule: No override returns base unchanged

    @happy-path
    Scenario: No override returns base sources
      Given base sources with one typescript and one features glob
      And no overrides defined
      When merging sources for the patterns generator
      Then merged sources should equal base sources

  Rule: Feature overrides control feature source selection

    @happy-path
    Scenario: additionalFeatures appended to base features
      Given base sources with one typescript and one features glob
      And an override for changelog with additionalFeatures
      When merging sources for the changelog generator
      Then merged features should have 2 entries

    @happy-path
    Scenario: replaceFeatures replaces base features entirely
      Given base sources with one typescript and one features glob
      And an override for changelog with replaceFeatures
      When merging sources for the changelog generator
      Then merged features should have 1 entry from the override

    @edge-case
    Scenario: Empty replaceFeatures does NOT replace
      Given base sources with one typescript and one features glob
      And an override for changelog with empty replaceFeatures and additionalFeatures
      When merging sources for the changelog generator
      Then merged features should have 2 entries

  Rule: TypeScript source overrides append additional input

    @happy-path
    Scenario: additionalInput appended to typescript sources
      Given base sources with one typescript and one features glob
      And an override for patterns with additionalInput
      When merging sources for the patterns generator
      Then merged typescript should have 2 entries

  Rule: Combined overrides apply together

    @happy-path
    Scenario: additionalFeatures and additionalInput combined
      Given base sources with one typescript and one features glob
      And an override for changelog with additionalFeatures and additionalInput
      When merging sources for the changelog generator
      Then merged features should have 2 entries
      And merged typescript should have 2 entries

  Rule: Exclude is always inherited from base

    @happy-path
    Scenario: Exclude always inherited
      Given base sources with one typescript and one features glob and an exclude pattern
      And an override for patterns with additionalInput
      When merging sources for the patterns generator
      Then merged exclude should equal the base exclude
