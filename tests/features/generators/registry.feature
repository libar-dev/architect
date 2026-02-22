@libar-docs
@libar-docs-pattern:GeneratorRegistryTesting
@libar-docs-status:completed
@libar-docs-product-area:Generation
@libar-docs-implements:GeneratorRegistry,GeneratorInfrastructureTesting
Feature: Generator Registry

  Tests the GeneratorRegistry registration, lookup, and listing capabilities.
  The registry manages document generators with name uniqueness constraints.

  Background: Registry test context
    Given a generator registry test context

  # ===========================================================================
  # Rule 1: Registration and Retrieval
  # ===========================================================================

  Rule: Registry manages generator registration and retrieval

    **Invariant:** Each generator name is unique within the registry; duplicate registration is rejected and lookup of unknown names returns undefined.
    **Rationale:** Allowing duplicate names would silently overwrite an existing generator, causing previously registered behavior to disappear without warning.
    **Verified by:** Register generator with unique name, Duplicate registration throws error, Get registered generator, Get unknown generator returns undefined, Available returns sorted list

    @acceptance-criteria @happy-path
    Scenario: Register generator with unique name
      Given an empty registry
      When registering a generator named "my-generator"
      Then the registration should succeed
      And the registry should have generator "my-generator"

    @acceptance-criteria @validation
    Scenario: Duplicate registration throws error
      Given a registry with generator "patterns" registered
      When registering a generator named "patterns" again
      Then an error should be thrown
      And the error message should contain "already registered"

    @acceptance-criteria @happy-path
    Scenario: Get registered generator
      Given a registry with generators:
        | name     |
        | patterns |
        | roadmap  |
      When getting generator "patterns"
      Then the generator should be returned
      And the generator name should be "patterns"

    @acceptance-criteria @validation
    Scenario: Get unknown generator returns undefined
      Given a registry with generators:
        | name     |
        | patterns |
      When getting generator "unknown"
      Then undefined should be returned

    @acceptance-criteria @happy-path
    Scenario: Available returns sorted list
      Given a registry with generators:
        | name      |
        | roadmap   |
        | patterns  |
        | changelog |
      When calling available
      Then the list should be:
        | name      |
        | changelog |
        | patterns  |
        | roadmap   |
