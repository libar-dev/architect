@behavior @configuration
@libar-docs-pattern:ConfigurationAPI
@libar-docs-product-area:Configuration
Feature: Configuration API for Open-Sourcing
  The createDeliveryProcess factory provides a type-safe way to configure
  the delivery process with custom tag prefixes and presets.

  **Problem:**
  - Different projects need different tag prefixes
  - Default taxonomy may not fit all use cases
  - Configuration should be type-safe and validated

  **Solution:**
  - createDeliveryProcess() factory with preset support
  - Custom tagPrefix and fileOptInTag overrides
  - Type-safe configuration with generics

  Background:
    Given a clean configuration environment

  # ==========================================================================
  # Factory Default Behavior
  # ==========================================================================

  Rule: Factory creates configured instances with correct defaults

    @happy-path
    Scenario: Create with no arguments uses libar-generic preset
      When I call createDeliveryProcess without arguments
      Then the registry tagPrefix should be "@libar-docs-"
      And the registry fileOptInTag should be "@libar-docs"
      And the registry should have exactly 3 categories

    @happy-path
    Scenario: Create with generic preset
      When I call createDeliveryProcess with preset "generic"
      Then the registry tagPrefix should be "@docs-"
      And the registry fileOptInTag should be "@docs"
      And the registry should have exactly 3 categories

    @happy-path
    Scenario: Create with libar-generic preset
      When I call createDeliveryProcess with preset "libar-generic"
      Then the registry tagPrefix should be "@libar-docs-"
      And the registry fileOptInTag should be "@libar-docs"
      And the registry should have exactly 3 categories

    @happy-path
    Scenario: Create with ddd-es-cqrs preset explicitly
      When I call createDeliveryProcess with preset "ddd-es-cqrs"
      Then the registry tagPrefix should be "@libar-docs-"
      And the registry fileOptInTag should be "@libar-docs"
      And the registry should have 21 categories

  # ==========================================================================
  # Custom Prefix Configuration
  # ==========================================================================

  Rule: Custom prefix configuration works correctly

    @happy-path
    Scenario: Custom tag prefix overrides preset
      When I call createDeliveryProcess with tagPrefix "@custom-"
      Then the registry tagPrefix should be "@custom-"

    @happy-path
    Scenario: Custom file opt-in tag overrides preset
      When I call createDeliveryProcess with fileOptInTag "@my-docs"
      Then the registry fileOptInTag should be "@my-docs"

    @happy-path
    Scenario: Both prefix and opt-in tag can be customized together
      When I call createDeliveryProcess with tagPrefix "@proj-" and fileOptInTag "@proj"
      Then the registry tagPrefix should be "@proj-"
      And the registry fileOptInTag should be "@proj"

  # ==========================================================================
  # Preset Categories Replace Base Categories
  # ==========================================================================

  Rule: Preset categories replace base categories entirely

    @happy-path
    Scenario: Generic preset excludes DDD categories
      When I call createDeliveryProcess with preset "generic"
      Then the registry should NOT include category "ddd"
      And the registry should NOT include category "event-sourcing"
      And the registry should NOT include category "cqrs"
      And the registry should NOT include category "saga"

    @happy-path
    Scenario: Libar-generic preset excludes DDD categories
      When I call createDeliveryProcess with preset "libar-generic"
      Then the registry should NOT include category "ddd"
      And the registry should NOT include category "event-sourcing"
      And the registry should NOT include category "cqrs"
      And the registry should NOT include category "saga"

  # ==========================================================================
  # Regex Builders Integration
  # ==========================================================================

  Rule: Regex builders use configured prefix

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
      Given a registry with tagPrefix "@docs-"
      When I normalize tag "@docs-pattern"
      Then the normalized tag should be "pattern"

    @edge-case
    Scenario: normalizeTag handles tag without prefix
      Given a registry with tagPrefix "@docs-"
      When I normalize tag "pattern"
      Then the normalized tag should be "pattern"
