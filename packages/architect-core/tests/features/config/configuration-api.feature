@architect
@architect-pattern:ConfigurationAPI
@architect-status:completed
@architect-unlock-reason:Retroactive-completion-during-rebrand
@architect-product-area:Configuration
@behavior @configuration
Feature: Configuration API for Open-Sourcing
  The createArchitect factory provides a type-safe way to configure
  the package with custom tag prefixes and role sets.

  **Problem:**
  - Different projects need different tag prefixes
  - Different projects need different classification roles
  - Configuration should be type-safe and validated

  **Solution:**
  - createArchitect() factory with DEFAULT_ROLES fallback
  - Explicit roles arrays override or disable default role matching
  - Custom tagPrefix and fileOptInTag overrides
  - Type-safe configuration with roles

  Background:
    Given a clean configuration environment

  Rule: Factory creates configured instances with correct defaults

    **Invariant:** The configuration factory must produce a fully initialized instance, using DEFAULT_ROLES when roles are omitted and respecting explicit empty roles arrays.
    **Rationale:** Omitted roles are the common case, while explicit empty arrays are the migration escape hatch that must remain distinct.
    **Verified by:** Create with no arguments uses DEFAULT_ROLES, Create with explicit empty roles disables defaults, Create with explicit custom roles

    @happy-path
    Scenario: Create with no arguments uses DEFAULT_ROLES
      When I call createArchitect without arguments
      Then the registry tagPrefix should be "@architect-"
      And the registry fileOptInTag should be "@architect"
      And the registry should have exactly 8 roles

    @happy-path
    Scenario: Create with explicit empty roles disables defaults
      When I call createArchitect with explicit empty roles
      Then the registry tagPrefix should be "@architect-"
      And the registry fileOptInTag should be "@architect"
      And the registry should have exactly 0 roles

    @happy-path
    Scenario: Create with explicit custom roles
      When I call createArchitect with one explicit custom role
      Then the registry tagPrefix should be "@architect-"
      And the registry fileOptInTag should be "@architect"
      And the registry should have exactly 1 roles
      And the registry should include role "service"

  Rule: Custom prefix configuration works correctly

    **Invariant:** Custom tag prefix and file opt-in tag overrides must be applied to the configuration instance, replacing the default values.
    **Rationale:** Consuming projects may use different annotation prefixes — custom prefixes enable the toolkit to work with any tag convention without forking role definitions.
    **Verified by:** Custom tag prefix overrides defaults, Custom file opt-in tag overrides defaults, Both prefix and opt-in tag can be customized together

    @happy-path
    Scenario: Custom tag prefix overrides defaults
      When I call createArchitect with tagPrefix "@custom-"
      Then the registry tagPrefix should be "@custom-"

    @happy-path
    Scenario: Custom file opt-in tag overrides defaults
      When I call createArchitect with fileOptInTag "@my-docs"
      Then the registry fileOptInTag should be "@my-docs"

    @happy-path
    Scenario: Both prefix and opt-in tag can be customized together
      When I call createArchitect with tagPrefix "@proj-" and fileOptInTag "@proj"
      Then the registry tagPrefix should be "@proj-"
      And the registry fileOptInTag should be "@proj"

  Rule: Explicit roles replace default roles entirely

    **Invariant:** When explicit roles are provided, they must fully replace (not merge with) the default roles.
    **Rationale:** Role sets are caller-defined — merging would silently reintroduce default matches that the config author intentionally overrode.
    **Verified by:** Explicit custom roles exclude default roles

    @happy-path
    Scenario: Explicit custom roles exclude default roles
      When I call createArchitect with one explicit custom role
      Then the registry should NOT include roles:
        | tag   |
        | ddd   |
        | core  |
        | api   |
        | infra |

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
