@architect
@architect-pattern:DefineConfigTesting
@architect-implements:DefineConfig
@architect-status:completed
@architect-product-area:Configuration
@behavior @config
Feature: Define Config - Schema Validation and Type Guards
  The defineConfig identity function and ArchitectProjectConfigSchema
  provide type-safe configuration authoring with runtime validation.

  **Problem:**
  - Users need type-safe config authoring without runtime overhead
  - Invalid configs must be caught at load time, not at usage time
  - New-style vs legacy config must be distinguishable programmatically

  **Solution:**
  - defineConfig() is a zero-cost identity function for TypeScript autocompletion
  - Zod schema validates at load time with precise error messages
  - isProjectConfig() and isLegacyInstance() type guards disambiguate config formats

  Background:
    Given a define-config test context

  Rule: defineConfig is an identity function

    **Invariant:** The defineConfig helper must return its input unchanged, serving only as a type annotation aid for IDE autocomplete.
    **Rationale:** defineConfig exists for TypeScript type inference in config files — any transformation would surprise users who expect their config object to pass through unmodified.
    **Verified by:** defineConfig returns input unchanged

    @happy-path
    Scenario: defineConfig returns input unchanged
      Given a project config with preset "libar-generic"
      When calling defineConfig with the config
      Then the result should be the exact same object

  Rule: Schema validates correct configurations

    **Invariant:** Valid configuration objects (both minimal and fully-specified) must pass schema validation without errors.
    **Rationale:** The schema must accept all legitimate configuration shapes — rejecting valid configs would block users from using supported features.
    **Verified by:** Valid minimal config passes validation, Valid full config passes validation

    @happy-path
    Scenario: Valid minimal config passes validation
      Given a config object with only preset "libar-generic"
      When validating against ArchitectProjectConfigSchema
      Then validation should succeed

    @happy-path
    Scenario: Valid full config passes validation
      Given a config object with all fields populated
      When validating against ArchitectProjectConfigSchema
      Then validation should succeed

  Rule: Schema rejects invalid configurations

    **Invariant:** The configuration schema must reject invalid values including empty globs, directory traversal patterns, mutually exclusive options, invalid preset names, and unknown fields.
    **Rationale:** Schema validation is the first line of defense against misconfiguration — permissive validation lets invalid configs produce confusing downstream errors.
    **Verified by:** Empty glob pattern rejected, Parent directory traversal rejected in globs, replaceFeatures and additionalFeatures mutually exclusive, Invalid preset name rejected, Unknown fields rejected in strict mode

    @validation
    Scenario: Empty glob pattern rejected
      Given a config with an empty string in typescript sources
      When validating against ArchitectProjectConfigSchema
      Then validation should fail
      And the validation error should contain "empty"

    @validation
    Scenario: Parent directory traversal rejected in globs
      Given a config with a glob containing ".."
      When validating against ArchitectProjectConfigSchema
      Then validation should fail
      And the validation error should contain "parent directory traversal"

    @validation
    Scenario: replaceFeatures and additionalFeatures mutually exclusive
      Given a generator override with both replaceFeatures and additionalFeatures
      When validating the generator override against schema
      Then validation should fail
      And the validation error should contain "mutually exclusive"

    @validation
    Scenario: Invalid preset name rejected
      Given a config object with preset "nonexistent-preset"
      When validating against ArchitectProjectConfigSchema
      Then validation should fail

    @validation
    Scenario: Unknown fields rejected in strict mode
      Given a config object with an unknown field "foobar"
      When validating against ArchitectProjectConfigSchema
      Then validation should fail

  Rule: Type guards distinguish config formats

    **Invariant:** The isProjectConfig and isLegacyInstance type guards must correctly distinguish between new-style project configs and legacy configuration instances.
    **Rationale:** The codebase supports both config formats during migration — incorrect type detection would apply the wrong loading path and produce runtime errors.
    **Verified by:** isProjectConfig returns true for new-style config, isProjectConfig returns false for legacy instance, isLegacyInstance returns true for legacy objects, isLegacyInstance returns false for new-style config

    @happy-path
    Scenario: isProjectConfig returns true for new-style config
      Given a new-style config object with sources field
      When checking isProjectConfig
      Then the result should be true

    @happy-path
    Scenario: isProjectConfig returns false for legacy instance
      Given a legacy instance object with registry and regexBuilders
      When checking isProjectConfig
      Then the result should be false

    @happy-path
    Scenario: isLegacyInstance returns true for legacy objects
      Given a legacy instance object with registry and regexBuilders
      When checking isLegacyInstance
      Then the result should be true

    @happy-path
    Scenario: isLegacyInstance returns false for new-style config
      Given a new-style config object with sources field
      When checking isLegacyInstance
      Then the result should be false
