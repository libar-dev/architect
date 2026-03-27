@architect
@architect-pattern:ConfigurationAPI
@architect-status:completed
@architect-product-area:Configuration
@behavior @configuration
Feature: Configuration API for Open-Sourcing
  The createArchitect factory provides a type-safe way to configure
  the package with custom tag prefixes and presets.

  **Problem:**
  - Different projects need different tag prefixes
  - Default taxonomy may not fit all use cases
  - Configuration should be type-safe and validated

  **Solution:**
  - createArchitect() factory with preset support
  - Custom tagPrefix and fileOptInTag overrides
  - Type-safe configuration with generics

  Background:
    Given a clean configuration environment

  # ==========================================================================
  # Factory Default Behavior
  # ==========================================================================

  Rule: Factory creates configured instances with correct defaults

    **Invariant:** The configuration factory must produce a fully initialized instance for any supported preset, with the libar-generic preset as the default when no arguments are provided.
    **Rationale:** A sensible default preset eliminates boilerplate for the common case while still supporting specialized presets (ddd-es-cqrs) for advanced monorepo configurations.
    **Verified by:** Create with no arguments uses libar-generic preset, Create with libar-generic preset, Create with ddd-es-cqrs preset explicitly

    @happy-path
    Scenario: Create with no arguments uses libar-generic preset
      When I call createArchitect without arguments
      Then the registry tagPrefix should be "@architect-"
      And the registry fileOptInTag should be "@architect"
      And the registry should have exactly 3 categories

    @happy-path
    Scenario: Create with libar-generic preset
      When I call createArchitect with preset "libar-generic"
      Then the registry tagPrefix should be "@architect-"
      And the registry fileOptInTag should be "@architect"
      And the registry should have exactly 3 categories

    @happy-path
    Scenario: Create with ddd-es-cqrs preset explicitly
      When I call createArchitect with preset "ddd-es-cqrs"
      Then the registry tagPrefix should be "@architect-"
      And the registry fileOptInTag should be "@architect"
      And the registry should have 21 categories

  # ==========================================================================
  # Custom Prefix Configuration
  # ==========================================================================

  Rule: Custom prefix configuration works correctly

    **Invariant:** Custom tag prefix and file opt-in tag overrides must be applied to the configuration instance, replacing the preset defaults.
    **Rationale:** Consuming projects may use different annotation prefixes — custom prefixes enable the toolkit to work with any tag convention without forking presets.
    **Verified by:** Custom tag prefix overrides preset, Custom file opt-in tag overrides preset, Both prefix and opt-in tag can be customized together

    @happy-path
    Scenario: Custom tag prefix overrides preset
      When I call createArchitect with tagPrefix "@custom-"
      Then the registry tagPrefix should be "@custom-"

    @happy-path
    Scenario: Custom file opt-in tag overrides preset
      When I call createArchitect with fileOptInTag "@my-docs"
      Then the registry fileOptInTag should be "@my-docs"

    @happy-path
    Scenario: Both prefix and opt-in tag can be customized together
      When I call createArchitect with tagPrefix "@proj-" and fileOptInTag "@proj"
      Then the registry tagPrefix should be "@proj-"
      And the registry fileOptInTag should be "@proj"

  # ==========================================================================
  # Preset Categories Replace Base Categories
  # ==========================================================================

  Rule: Preset categories replace base categories entirely

    **Invariant:** When a preset defines its own category set, it must fully replace (not merge with) the base categories.
    **Rationale:** Category sets are curated per-preset — merging would include irrelevant categories (e.g., DDD categories in a generic project) that pollute taxonomy reports.
    **Verified by:** Libar-generic preset excludes DDD categories

    @happy-path
    Scenario: Libar-generic preset excludes DDD categories
      When I call createArchitect with preset "libar-generic"
      Then the registry should NOT include category "ddd"
      And the registry should NOT include category "event-sourcing"
      And the registry should NOT include category "cqrs"
      And the registry should NOT include category "saga"

  # ==========================================================================
  # Regex Builders Integration
  # ==========================================================================

  Rule: Regex builders use configured prefix

    **Invariant:** All regex builders (hasFileOptIn, hasDocDirectives, normalizeTag) must use the configured tag prefix, not a hardcoded one.
    **Rationale:** Regex patterns that ignore the configured prefix would miss annotations in projects using custom prefixes, silently skipping source files.
    **Verified by:** hasFileOptIn detects configured opt-in tag, hasFileOptIn rejects wrong opt-in tag, hasDocDirectives detects configured prefix, hasDocDirectives rejects wrong prefix, normalizeTag removes configured prefix, normalizeTag handles tag without prefix

    @happy-path
    Scenario: hasFileOptIn detects configured opt-in tag
      Given a registry with fileOptInTag "@custom"
      And file content containing the opt-in marker
      When I check hasFileOptIn
      Then it should return true

    @edge-case
    Scenario: hasFileOptIn rejects wrong opt-in tag
      Given a registry with fileOptInTag "@custom"
      And file content containing a different opt-in marker
      When I check hasFileOptIn
      Then it should return false

    @happy-path
    Scenario: hasDocDirectives detects configured prefix
      Given a registry with tagPrefix "@my-"
      And file content containing a directive with that prefix
      When I check hasDocDirectives
      Then it should return true

    @edge-case
    Scenario: hasDocDirectives rejects wrong prefix
      Given a registry with tagPrefix "@my-"
      And file content containing a directive with wrong prefix
      When I check hasDocDirectives
      Then it should return false

    @happy-path
    Scenario: normalizeTag removes configured prefix
      Given a registry with tagPrefix "@architect-"
      When I normalize tag "@architect-pattern"
      Then the normalized tag should be "pattern"

    @edge-case
    Scenario: normalizeTag handles tag without prefix
      Given a registry with tagPrefix "@architect-"
      When I normalize tag "pattern"
      Then the normalized tag should be "pattern"
