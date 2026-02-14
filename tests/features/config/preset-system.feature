@libar-docs
@libar-docs-pattern:PresetSystem
@libar-docs-status:completed
@libar-docs-product-area:Configuration
@behavior @presets
Feature: Preset System for Configuration
  Presets provide pre-configured taxonomies for different project types.

  **Problem:**
  - New users need sensible defaults for their project type
  - DDD projects need full taxonomy
  - Simple projects need minimal configuration

  **Solution:**
  - GENERIC_PRESET for non-DDD projects
  - DDD_ES_CQRS_PRESET for full DDD/ES/CQRS taxonomy
  - PRESETS lookup map for programmatic access

  # ==========================================================================
  # Generic Preset
  # ==========================================================================

  Rule: Generic preset provides minimal taxonomy

    @happy-path
    Scenario: Generic preset has correct prefix configuration
      Given the generic preset
      Then it should have tagPrefix "@docs-"
      And it should have fileOptInTag "@docs"

    @happy-path
    Scenario: Generic preset has core categories only
      Given the generic preset
      Then it should include category "core"
      And it should include category "api"
      And it should include category "infra"
      And it should NOT include category "ddd"
      And it should NOT include category "event-sourcing"
      And it should NOT include category "cqrs"
      And it should NOT include category "saga"
      And it should have exactly 3 categories

  # ==========================================================================
  # Libar Generic Preset (for package extraction)
  # ==========================================================================

  Rule: Libar generic preset provides minimal taxonomy with libar prefix

    @happy-path
    Scenario: Libar generic preset has correct prefix configuration
      Given the libar-generic preset
      Then it should have tagPrefix "@libar-docs-"
      And it should have fileOptInTag "@libar-docs"

    @happy-path
    Scenario: Libar generic preset has core categories only
      Given the libar-generic preset
      Then it should include category "core"
      And it should include category "api"
      And it should include category "infra"
      And it should NOT include category "ddd"
      And it should NOT include category "event-sourcing"
      And it should NOT include category "cqrs"
      And it should NOT include category "saga"
      And it should have exactly 3 categories

  # ==========================================================================
  # DDD-ES-CQRS Preset
  # ==========================================================================

  Rule: DDD-ES-CQRS preset provides full taxonomy

    @happy-path
    Scenario: Full preset has correct prefix configuration
      Given the ddd-es-cqrs preset
      Then it should have tagPrefix "@libar-docs-"
      And it should have fileOptInTag "@libar-docs"

    @happy-path
    Scenario: Full preset has all DDD categories
      Given the ddd-es-cqrs preset
      Then it should include category "ddd"
      And it should include category "event-sourcing"
      And it should include category "cqrs"
      And it should include category "saga"
      And it should include category "projection"
      And it should include category "decider"
      And it should include category "command"
      And it should include category "bounded-context"

    @happy-path
    Scenario: Full preset has infrastructure categories
      Given the ddd-es-cqrs preset
      Then it should include category "core"
      And it should include category "api"
      And it should include category "infra"
      And it should include category "arch"
      And it should include category "validation"
      And it should include category "testing"

    @happy-path
    Scenario: Full preset has all 21 categories
      Given the ddd-es-cqrs preset
      Then it should have exactly 21 categories

  # ==========================================================================
  # Preset Lookup
  # ==========================================================================

  Rule: Presets can be accessed by name

    @happy-path
    Scenario: Generic preset accessible via PRESETS map
      When I access PRESETS with key "generic"
      Then the preset tagPrefix should be "@docs-"

    @happy-path
    Scenario: DDD preset accessible via PRESETS map
      When I access PRESETS with key "ddd-es-cqrs"
      Then the preset tagPrefix should be "@libar-docs-"

    @happy-path
    Scenario: Libar generic preset accessible via PRESETS map
      When I access PRESETS with key "libar-generic"
      Then the preset tagPrefix should be "@libar-docs-"
