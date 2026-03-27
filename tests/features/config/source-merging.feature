@architect
@architect-pattern:SourceMerging
@architect-status:completed
@architect-unlock-reason:Retroactive-completion-during-rebrand
@architect-product-area:Configuration
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

    **Invariant:** When no source overrides are provided, the merged result must be identical to the base source configuration.
    **Rationale:** The merge function must be safe to call unconditionally — returning modified results without overrides would corrupt default source paths.
    **Verified by:** No override returns base sources

    @happy-path
    Scenario: No override returns base sources
      Given base sources with one typescript and one features glob
      And no overrides defined
      When merging sources for the patterns generator
      Then merged sources should equal base sources

  Rule: Feature overrides control feature source selection

    **Invariant:** additionalFeatures must append to base feature sources while replaceFeatures must completely replace them, and these two options are mutually exclusive.
    **Rationale:** Projects need both additive and replacement strategies — additive for extending (monorepo packages), replacement for narrowing (focused generation runs).
    **Verified by:** additionalFeatures appended to base features, replaceFeatures replaces base features entirely, Empty replaceFeatures does NOT replace

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

    **Invariant:** additionalInput must append to (not replace) the base TypeScript source paths.
    **Rationale:** TypeScript sources are always additive — the base sources contain core patterns that must always be included alongside project-specific additions.
    **Verified by:** additionalInput appended to typescript sources

    @happy-path
    Scenario: additionalInput appended to typescript sources
      Given base sources with one typescript and one features glob
      And an override for patterns with additionalInput
      When merging sources for the patterns generator
      Then merged typescript should have 2 entries

  Rule: Combined overrides apply together

    **Invariant:** Feature overrides and TypeScript overrides must compose independently when both are provided simultaneously.
    **Rationale:** Real configs often specify both feature and TypeScript overrides — they must not interfere with each other or produce order-dependent results.
    **Verified by:** additionalFeatures and additionalInput combined

    @happy-path
    Scenario: additionalFeatures and additionalInput combined
      Given base sources with one typescript and one features glob
      And an override for changelog with additionalFeatures and additionalInput
      When merging sources for the changelog generator
      Then merged features should have 2 entries
      And merged typescript should have 2 entries

  Rule: Exclude is always inherited from base

    **Invariant:** The exclude patterns must always come from the base configuration, never from overrides.
    **Rationale:** Exclude patterns are a safety mechanism — allowing overrides to modify excludes could accidentally include sensitive or generated files in the scan.
    **Verified by:** Exclude always inherited

    @happy-path
    Scenario: Exclude always inherited
      Given base sources with one typescript and one features glob and an exclude pattern
      And an override for patterns with additionalInput
      When merging sources for the patterns generator
      Then merged exclude should equal the base exclude
