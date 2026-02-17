@libar-docs
@libar-docs-pattern:ArchGeneratorRegistration
@libar-docs-status:completed
@libar-docs-implements:ArchitectureDiagramGeneration
@libar-docs-product-area:Generation
@architecture
Feature: Architecture Generator Registration

  As a CLI user
  I want an architecture generator registered in the generator registry
  So that I can run pnpm docs:architecture to generate diagrams

  Background: Generator registry loaded
    Given the generator registry is initialized

  # ============================================================================
  # Generator Registration Rules
  # ============================================================================

  Rule: Architecture generator is registered in the registry

    **Invariant:** The generator registry must contain an "architecture" generator entry available for CLI invocation.
    **Verified by:** Generator is available in registry

    The architecture generator must be registered like other built-in
    generators so it can be invoked via CLI.

    @acceptance-criteria @happy-path
    Scenario: Generator is available in registry
      When checking available generators
      Then the registry contains generator "architecture"
      And the generator description includes "Architecture"

  Rule: Architecture generator produces component diagram by default

    **Invariant:** Running the architecture generator without diagram type options must produce a component diagram with bounded context subgraphs.
    **Verified by:** Default generation produces component diagram

    Running the architecture generator without options produces
    a component diagram (bounded context view).

    @acceptance-criteria @happy-path
    Scenario: Default generation produces component diagram
      Given patterns with architecture annotations:
        | name         | archRole        | archContext |
        | OrderHandler | command-handler | orders      |
        | InvHandler   | command-handler | inventory   |
      When the architecture generator runs
      Then the output contains file "ARCHITECTURE.md"
      And the file contains required elements:
        | text           |
        | System Overview |
        | subgraph       |

  Rule: Architecture generator supports diagram type options

    **Invariant:** The architecture generator must accept a diagram type option that selects between component and layered diagram output.
    **Verified by:** Generate layered diagram with options

    The generator accepts options to specify diagram type
    (component or layered).

    @acceptance-criteria @happy-path
    Scenario: Generate layered diagram with options
      Given patterns with architecture annotations:
        | name         | archRole        | archContext | archLayer   |
        | Decider1     | decider         | orders      | domain      |
        | Handler1     | command-handler | orders      | application |
      And codec options for diagram type "layered"
      When the architecture generator runs
      Then the output contains file "ARCHITECTURE.md"
      And the file contains "Layered Architecture"

  Rule: Architecture generator supports context filtering

    **Invariant:** When context filtering is applied, the generated diagram must include only patterns from the specified bounded contexts and exclude all others.
    **Verified by:** Filter to specific contexts

    The generator can filter to specific bounded contexts
    for focused diagram output.

    @acceptance-criteria @happy-path
    Scenario: Filter to specific contexts
      Given patterns with architecture annotations:
        | name         | archRole        | archContext |
        | OrderHandler | command-handler | orders      |
        | OrderProj    | projection      | orders      |
        | InvHandler   | command-handler | inventory   |
      And codec options filtering to contexts "orders"
      When the architecture generator runs
      Then the file contains "Orders BC"
      And the file does not contain "Inventory BC"

