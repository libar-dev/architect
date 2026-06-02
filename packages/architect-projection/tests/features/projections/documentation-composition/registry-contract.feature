@architect
@architect-pattern:DocumentationTypeRegistryExecutableTests
@architect-implements:DocumentationTypeRegistry
@architect-status:active
@architect-product-area:Projection
@architect-role:contract
@documentation-composition
Feature: Documentation type registry contract

  Background:
    Given the Documentation Type Registry contract state is initialized

  Rule: Registry identity stays explicit across documentation types

    Scenario: identity axis pins supported keys route identities and lookups
      Then the identity axis should expose the supported documentation keys in order
      And the identity axis should resolve each key to the same metadata entry

  Rule: Registry output routing stays explicit across documentation types

    Scenario: output-routing axis pins markdown targets child directories and entity layouts
      Then the output-routing axis should expose the current markdown root targets
      And the output-routing axis should expose the current child directory layout

  Rule: Registry disclosure stays explicit across documentation types

    Scenario: disclosure axis pins defaults matrices and schema validity
      Then the disclosure axis should expose the current default disclosure levels
      And the disclosure axis should expose a complete disclosure matrix for every documentation type

  Rule: Registry CLI surface stays explicit across documentation types

    Scenario: CLI-surface axis pins generator names and aliases
      Then the CLI-surface axis should expose the current generator names
      And the CLI-surface axis should expose the current generator aliases
