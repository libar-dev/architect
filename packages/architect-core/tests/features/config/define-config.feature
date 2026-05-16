@architect
@architect-pattern:DefineConfigExecutableTests
@architect-implements:DefineConfig
@architect-status:completed
@architect-unlock-reason:Retroactive-completion-during-rebrand
@architect-product-area:Configuration
@behavior @config
Feature: Define Config
  The defineConfig identity function and ArchitectProjectConfigSchema
  provide type-safe configuration authoring with runtime validation.

  **Problem:**
  - Users need type-safe config authoring without runtime overhead
  - Invalid configs must be caught at load time, not at usage time
  **Solution:**
  - defineConfig() is a zero-cost identity function for TypeScript autocompletion
  - Zod schema validates at load time with precise error messages
  - isProjectConfig() type guard validates config format

  Background:
    Given a define-config test context

  Rule: defineConfig is an identity function

    **Invariant:** The defineConfig helper must return its input unchanged, serving only as a type annotation aid for IDE autocomplete.
    **Rationale:** defineConfig exists for TypeScript type inference in config files — any transformation would surprise users who expect their config object to pass through unmodified.
    **Verified by:** defineConfig returns input unchanged

    @happy-path
    Scenario: defineConfig returns input unchanged
      Given a project config with only tagPrefix "@custom-"
      When calling defineConfig with the config
      Then the result should be the exact same object

  Rule: Schema validates correct configurations

    **Invariant:** Valid core configuration objects must pass schema validation, while presentation-only fields stay rejected outside the presentation package.
    **Rationale:** Core config validation must stay aligned with package ownership so presentation settings are not silently accepted by the wrong package.
    **Verified by:** Valid minimal config passes validation, Valid minimal file-opt-in config passes validation, Reference-doc config is rejected in core, Valid full config passes validation

    @happy-path
    Scenario: Valid minimal config passes validation
      Given a config object with only tagPrefix "@custom-"
      When validating against ArchitectProjectConfigSchema
      Then validation should succeed

    @happy-path
    Scenario: Valid minimal file-opt-in config passes validation
      Given a config object with only fileOptInTag "@custom"
      When validating against ArchitectProjectConfigSchema
      Then validation should succeed

    @happy-path
    Scenario: Reference-doc config is rejected in core
      Given a config object with referenceDocConfigs only
      When validating against ArchitectProjectConfigSchema
      Then validation should fail

    @happy-path
    Scenario: Valid full config passes validation
      Given a config object with all fields populated
      When validating against ArchitectProjectConfigSchema
      Then validation should succeed

  Rule: Schema rejects invalid configurations

    **Invariant:** The configuration schema must reject invalid values including empty globs, directory traversal patterns, mutually exclusive options, removed preset/category fields, and unknown fields.
    **Rationale:** Schema validation is the first line of defense against misconfiguration — permissive validation lets invalid configs produce confusing downstream errors.
    **Verified by:** Empty glob pattern rejected, Parent directory traversal rejected in globs, replaceFeatures and additionalFeatures mutually exclusive, Removed preset field rejected, Removed categories field rejected, Unknown fields rejected in strict mode

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
    Scenario: Removed preset field rejected
      Given a config object with removed preset field
      When validating against ArchitectProjectConfigSchema
      Then validation should fail

    @validation
    Scenario: Removed categories field rejected
      Given a config object with removed categories field
      When validating against ArchitectProjectConfigSchema
      Then validation should fail

    @validation
    Scenario: Unknown fields rejected in strict mode
      Given a config object with an unknown field "foobar"
      When validating against ArchitectProjectConfigSchema
      Then validation should fail

  Rule: Type guard validates config format

    **Invariant:** The isProjectConfig type guard must recognize only core-owned project config shapes.
    **Rationale:** Config loading relies on type detection to route objects to the correct package-owned parser surface.
    **Verified by:** isProjectConfig returns true for minimal config, isProjectConfig returns true for file-opt-in-only config, isProjectConfig returns false for reference-doc config, isProjectConfig returns false for non-config object

    @happy-path
    Scenario: isProjectConfig returns true for minimal config
      Given a config object with only tagPrefix "@custom-"
      When checking isProjectConfig
      Then the result should be true

    @happy-path
    Scenario: isProjectConfig returns true for file-opt-in-only config
      Given a config object with only fileOptInTag "@custom"
      When checking isProjectConfig
      Then the result should be true

    @happy-path
    Scenario: isProjectConfig returns false for reference-doc config
      Given a config object with referenceDocConfigs only
      When checking isProjectConfig
      Then the result should be false

    @happy-path
    Scenario: isProjectConfig returns false for non-config object
      Given an object with registry and regexBuilders only
      When checking isProjectConfig
      Then the result should be false
