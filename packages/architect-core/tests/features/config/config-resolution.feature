@architect
@architect-pattern:ConfigResolution
@architect-implements:ConfigLoader
@architect-status:completed
@architect-unlock-reason:Retroactive-completion-during-rebrand
@architect-product-area:Configuration
@behavior @config
Feature: Config Resolution
  resolveProjectConfig transforms a raw ArchitectProjectConfig into
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

    **Invariant:** A config created without user input must have isDefault=true and empty source collections.
    **Rationale:** Downstream consumers need a safe starting point when no config file exists.
    **Verified by:** Default config has empty sources and isDefault flag

    @happy-path
    Scenario: Default config has empty sources and isDefault flag
      When creating default resolved config
      Then isDefault should be true
      And typescript sources should be empty
      And features sources should be empty
      And exclude sources should be empty

  Rule: Omitted roles apply DEFAULT_ROLES

    **Invariant:** When the `roles` field is omitted, config resolution must create an instance using DEFAULT_ROLES.
    **Rationale:** Omission is the implicit-default path for project configs and must stay distinct from explicit disablement.
    **Verified by:** Omitted roles apply DEFAULT_ROLES

    @happy-path
    Scenario: Omitted roles apply DEFAULT_ROLES
      Given a raw config with no roles field
      When resolving the project config
      Then the instance should have 8 roles
      And the instance should include roles:
        | tag             |
        | projection      |
        | service         |
        | decider         |
        | read-model      |
        | codec           |
        | contract        |
        | barrel          |
        | utility         |
      And the instance tagPrefix should be "@architect-"

  Rule: Explicit roles arrays control classification

    **Invariant:** An explicit roles array must override omission semantics, including the special case where `roles: []` disables default role matching.
    **Rationale:** The migration depends on preserving the distinction between omitted roles and explicit empty roles.
    **Verified by:** Explicit empty roles disable default role matching, Explicit custom roles replace the defaults

    @happy-path
    Scenario: Explicit empty roles disable default role matching
      Given a raw config with explicit empty roles
      When resolving the project config
      Then the instance should have 0 roles

    @happy-path
    Scenario: Explicit custom roles replace the defaults
      Given a raw config with one custom role
      When resolving the project config
      Then the instance should have 1 roles
      And the instance should include role "service"
      And the instance should NOT include role "projection"

  Rule: Stubs are merged into typescript sources

    **Invariant:** Stub glob patterns must appear in resolved typescript sources alongside original globs.
    **Rationale:** Stubs extend the scanner's source set without requiring users to manually list them.
    **Verified by:** Stubs appended to typescript sources

    @happy-path
    Scenario: Stubs appended to typescript sources
      Given a raw config with typescript sources and stubs
      When resolving the project config
      Then resolved typescript sources should contain both original and stub globs

  Rule: Output defaults are applied

    **Invariant:** Missing output configuration must resolve to "docs-generated" with overwrite=false.
    **Rationale:** Consistent defaults prevent accidental overwrites and establish a predictable output location.
    **Verified by:** Default output directory and overwrite, Explicit output overrides defaults

    @happy-path
    Scenario: Default output directory and overwrite
      Given a raw config with no output specified
      When resolving the project config
      Then output directory should be "docs-generated"
      And output overwrite should be false

    @happy-path
    Scenario: Explicit output overrides defaults
      Given a raw config with output directory "custom-docs" and overwrite true
      When resolving the project config
      Then output directory should be "custom-docs"
      And output overwrite should be true

  Rule: Generator defaults are applied

    **Invariant:** A config with no generators specified must default to the "patterns" generator.
    **Rationale:** Patterns is the most commonly needed output — defaulting to it reduces boilerplate.
    **Verified by:** Generators default to patterns

    @happy-path
    Scenario: Generators default to patterns
      Given a raw config with no generators specified
      When resolving the project config
      Then generators should contain exactly "patterns"

  Rule: Context inference rules are prepended

    **Invariant:** User-defined inference rules must appear before built-in defaults in the resolved array.
    **Rationale:** Prepending gives user rules priority during context matching without losing defaults.
    **Verified by:** User rules prepended to defaults

    @happy-path
    Scenario: User rules prepended to defaults
      Given a raw config with a custom context inference rule
      When resolving the project config
      Then the first context inference rule should be the user rule
      And the default rules should follow after the user rule

  Rule: Config path is carried from options

    **Invariant:** The configPath from resolution options must be preserved unchanged in resolved config.
    **Rationale:** Downstream tools need the original config file location for error reporting and relative path resolution.
    **Verified by:** configPath carried from resolution options

    @happy-path
    Scenario: configPath carried from resolution options
      Given a raw config with no roles field
      When resolving the project config with configPath "/my/config.ts"
      Then the resolved configPath should be "/my/config.ts"
