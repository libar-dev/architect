@architect
@architect-pattern:PresetSystem
@architect-status:completed
@architect-product-area:Configuration
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

    **Invariant:** The generic preset must provide exactly 3 categories (core, api, infra) with @docs- prefix.
    **Rationale:** Simple projects need minimal configuration without DDD-specific categories cluttering the taxonomy.
    **Verified by:** Generic preset has correct prefix configuration, Generic preset has core categories only

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

    **Invariant:** The libar-generic preset must provide exactly 3 categories with @architect- prefix.
    **Rationale:** This package uses @architect- prefix to avoid collisions with consumer projects' annotations.
    **Verified by:** Libar generic preset has correct prefix configuration, Libar generic preset has core categories only

    @happy-path
    Scenario: Libar generic preset has correct prefix configuration
      Given the libar-generic preset
      Then it should have tagPrefix "@architect-"
      And it should have fileOptInTag "@architect"

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

    **Invariant:** The DDD preset must provide all 21 categories spanning DDD, ES, CQRS, and infrastructure domains.
    **Rationale:** DDD architectures require fine-grained categorization to distinguish bounded contexts, aggregates, and projections.
    **Verified by:** Full preset has correct prefix configuration, Full preset has all DDD categories, Full preset has infrastructure categories, Full preset has all 21 categories

    @happy-path
    Scenario: Full preset has correct prefix configuration
      Given the ddd-es-cqrs preset
      Then it should have tagPrefix "@architect-"
      And it should have fileOptInTag "@architect"

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

    **Invariant:** All preset instances must be accessible via the PRESETS map using their canonical string key.
    **Rationale:** Programmatic access enables config files to reference presets by name instead of importing instances.
    **Verified by:** Generic preset accessible via PRESETS map, DDD preset accessible via PRESETS map, Libar generic preset accessible via PRESETS map

    @happy-path
    Scenario: Generic preset accessible via PRESETS map
      When I access PRESETS with key "generic"
      Then the preset tagPrefix should be "@docs-"

    @happy-path
    Scenario: DDD preset accessible via PRESETS map
      When I access PRESETS with key "ddd-es-cqrs"
      Then the preset tagPrefix should be "@architect-"

    @happy-path
    Scenario: Libar generic preset accessible via PRESETS map
      When I access PRESETS with key "libar-generic"
      Then the preset tagPrefix should be "@architect-"
