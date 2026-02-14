@libar-docs
@libar-docs-pattern:ConfigResolution
@libar-docs-status:completed
@libar-docs-product-area:Configuration
@behavior @config
Feature: Config Resolution - Defaults and Merging
  resolveProjectConfig transforms a raw DeliveryProcessProjectConfig into
  a fully resolved ResolvedConfig with all defaults applied.

  **Problem:**
  - Raw user config is partial with many optional fields
  - Stubs need to be merged into typescript sources transparently
  - Defaults must be applied consistently across all consumers

  **Solution:**
  - resolveProjectConfig applies defaults in a predictable order
  - createDefaultResolvedConfig provides a complete fallback
  - Stubs are merged into typescript sources at resolution time

  Background:
    Given a config resolution test context

  Rule: Default config provides sensible fallbacks

    @happy-path
    Scenario: Default config has empty sources and isDefault flag
      When creating default resolved config
      Then isDefault should be true
      And typescript sources should be empty
      And features sources should be empty
      And exclude sources should be empty

  Rule: Preset creates correct taxonomy instance

    @happy-path
    Scenario: libar-generic preset creates 3 categories
      Given a raw config with preset "libar-generic"
      When resolving the project config
      Then the instance should have 3 categories
      And the instance tagPrefix should be "@libar-docs-"

  Rule: Stubs are merged into typescript sources

    @happy-path
    Scenario: Stubs appended to typescript sources
      Given a raw config with typescript sources and stubs
      When resolving the project config
      Then resolved typescript sources should contain both original and stub globs

  Rule: Output defaults are applied

    @happy-path
    Scenario: Default output directory and overwrite
      Given a raw config with no output specified
      When resolving the project config
      Then output directory should be "docs/architecture"
      And output overwrite should be false

    @happy-path
    Scenario: Explicit output overrides defaults
      Given a raw config with output directory "custom-docs" and overwrite true
      When resolving the project config
      Then output directory should be "custom-docs"
      And output overwrite should be true

  Rule: Generator defaults are applied

    @happy-path
    Scenario: Generators default to patterns
      Given a raw config with no generators specified
      When resolving the project config
      Then generators should contain exactly "patterns"

  Rule: Context inference rules are prepended

    @happy-path
    Scenario: User rules prepended to defaults
      Given a raw config with a custom context inference rule
      When resolving the project config
      Then the first context inference rule should be the user rule
      And the default rules should follow after the user rule

  Rule: Config path is carried from options

    @happy-path
    Scenario: configPath carried from resolution options
      Given a raw config with preset "libar-generic"
      When resolving the project config with configPath "/my/config.ts"
      Then the resolved configPath should be "/my/config.ts"
