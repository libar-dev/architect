@libar-docs
@libar-docs-pattern:DefineConfigTesting
@libar-docs-implements:DefineConfig
@libar-docs-status:completed
@libar-docs-product-area:Configuration
@behavior @config
Feature: Define Config - Schema Validation and Type Guards
  The defineConfig identity function and DeliveryProcessProjectConfigSchema
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

    @happy-path
    Scenario: defineConfig returns input unchanged
      Given a project config with preset "libar-generic"
      When calling defineConfig with the config
      Then the result should be the exact same object

  Rule: Schema validates correct configurations

    @happy-path
    Scenario: Valid minimal config passes validation
      Given a config object with only preset "libar-generic"
      When validating against DeliveryProcessProjectConfigSchema
      Then validation should succeed

    @happy-path
    Scenario: Valid full config passes validation
      Given a config object with all fields populated
      When validating against DeliveryProcessProjectConfigSchema
      Then validation should succeed

  Rule: Schema rejects invalid configurations

    @validation
    Scenario: Empty glob pattern rejected
      Given a config with an empty string in typescript sources
      When validating against DeliveryProcessProjectConfigSchema
      Then validation should fail
      And the validation error should contain "empty"

    @validation
    Scenario: Parent directory traversal rejected in globs
      Given a config with a glob containing ".."
      When validating against DeliveryProcessProjectConfigSchema
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
      When validating against DeliveryProcessProjectConfigSchema
      Then validation should fail

    @validation
    Scenario: Unknown fields rejected in strict mode
      Given a config object with an unknown field "foobar"
      When validating against DeliveryProcessProjectConfigSchema
      Then validation should fail

  Rule: Type guards distinguish config formats

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
