@libar-docs
@libar-docs-pattern:ArchitectureDiagramAdvanced
@libar-docs-status:roadmap
@libar-docs-phase:23
@libar-docs-effort:1w
@libar-docs-product-area:Generation
@libar-docs-executable-specs:tests/features/behavior/architecture-diagrams
Feature: Architecture Diagram Generation - Advanced

  **Problem:** Core diagram generation (see ArchitectureDiagramCore) produces
  component-level diagrams from `arch-*` tags. However, large codebases need
  additional visualization modes: layered views grouping patterns by architectural
  layer, CLI-integrated generation via the generator registry, and sequence
  diagrams showing runtime interaction flows between components.

  **Solution:** Extend the architecture diagram system with advanced capabilities:
  - Layered diagrams that group patterns by `@libar-docs-arch-layer` (domain, application, infrastructure)
  - Generator registry integration for CLI-driven generation via `pnpm docs:architecture`
  - Sequence diagram support for modeling runtime interactions between components

  **Why It Matters:**
  | Benefit | How |
  | Layer visibility | Layered diagrams reveal architectural boundaries |
  | CLI integration | Generator registry enables `pnpm docs:architecture` |
  | Runtime modeling | Sequence diagrams show interaction flows |
  | Composable views | Multiple diagram types from the same annotations |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | ArchitectureCodec (layered) | complete | renderable/codecs/architecture.ts | Yes | unit |
      | Architecture generator | pending | generators/built-in/architecture.ts | Yes | unit |
      | Example app annotations | pending | examples/sample-project/src/ | No | - |
      | Sequence diagram support | pending | renderable/codecs/architecture.ts | Yes | unit |

  # ============================================================================
  # RULE 5: Layered Diagram Generation
  # ============================================================================

  Rule: Layered diagrams group patterns by architectural layer

    **Invariant:** Layered diagrams must render patterns grouped by architectural
    layer (domain, application, infrastructure) with top-to-bottom flow.

    **Rationale:** Layered architecture visualization shows dependency direction -
    infrastructure at top, domain at bottom - following conventional layer ordering.

    **Verified by:** Generate subgraphs per layer, Layer order is infrastructure-application-domain,
    Include context label in node names

    @acceptance-criteria @happy-path
    Scenario: Generate subgraphs per layer
      Given patterns with arch-layer:
        | Pattern | arch-layer | arch-context |
        | Decider | domain | orders |
        | Handler | application | orders |
        | Infra | infrastructure | - |
      When the layered diagram codec runs
      Then output contains subgraph "Domain Layer"
      And output contains subgraph "Application Layer"
      And output contains subgraph "Infrastructure Layer"

    @acceptance-criteria @happy-path
    Scenario: Layer order is infrastructure-application-domain
      Given patterns with all three layers
      When the layered diagram codec runs
      Then Infrastructure Layer appears before Application Layer in output
      And Application Layer appears before Domain Layer in output

    @acceptance-criteria @happy-path
    Scenario: Include context label in node names
      Given patterns:
        | Pattern | arch-layer | arch-context |
        | OrderHandler | application | orders |
        | InventoryHandler | application | inventory |
      When the layered diagram codec runs
      Then OrderHandler node label includes "(orders)"
      And InventoryHandler node label includes "(inventory)"

    @acceptance-criteria @validation
    Scenario: Patterns without layer go to Other subgraph
      Given patterns:
        | Pattern | arch-layer | arch-role |
        | Layered | application | handler |
        | Unlayered | - | saga |
      When the layered diagram codec runs
      Then output contains subgraph "Other"
      And Unlayered is inside Other subgraph

  # ============================================================================
  # RULE 6: Generator Registry Integration
  # ============================================================================

  Rule: Architecture generator is registered with generator registry

    **Invariant:** An "architecture" generator must be registered with the generator
    registry to enable `pnpm docs:architecture` via the existing `generate-docs.js` CLI.

    **Rationale:** The delivery-process uses a generator registry pattern. New
    generators register with the orchestrator rather than creating separate CLI commands.

    **Verified by:** Generator is registered, Generator produces component diagram,
    Generator produces layered diagram, npm script works

    @acceptance-criteria @happy-path
    Scenario: Architecture generator is registered
      Given the generator registry
      When listing available generators
      Then "architecture" should be in the list

    @acceptance-criteria @happy-path
    Scenario: Generator produces component diagram by default
      When running generate-docs with --generators architecture
      Then output contains valid mermaid graph TB
      And output contains bounded context subgraphs

    @acceptance-criteria @happy-path
    Scenario: Generator option for layered diagram
      When running generate-docs with --generators architecture --diagram-type layered
      Then output contains layer subgraphs
      And output follows infrastructure-application-domain order

    @acceptance-criteria @happy-path
    Scenario: Generator option for context filtering
      When running generate-docs with --generators architecture --contexts orders
      Then output only contains patterns from orders context
      And output does not contain inventory context subgraph

    @acceptance-criteria @happy-path
    Scenario: npm script pnpm docs:architecture works
      When running `pnpm docs:architecture`
      Then command exits successfully
      And architecture diagram is written to output directory

  # ============================================================================
  # RULE 7: Sequence Diagram Generation (Future)
  # ============================================================================

  Rule: Sequence diagrams render interaction flows

    **Invariant:** Sequence diagrams must render interaction flows (command flow,
    saga flow) showing step-by-step message passing between components.

    **Rationale:** Component diagrams show structure but not behavior. Sequence
    diagrams show runtime flow - essential for understanding command/saga execution.

    **Verified by:** Generate command flow sequence, Generate saga flow sequence

    @acceptance-criteria @happy-path @future
    Scenario: Generate command flow sequence diagram
      Given a command handler pattern with uses relationships
      When the sequence diagram codec runs with command flow template
      Then output contains mermaid sequenceDiagram
      And participants are derived from uses relationships
      And 7-step CommandOrchestrator flow is rendered

    @acceptance-criteria @happy-path @future
    Scenario: Generate saga flow sequence diagram
      Given a saga pattern with uses relationships to multiple BCs
      When the sequence diagram codec runs with saga flow template
      Then output contains mermaid sequenceDiagram
      And participants include each bounded context
      And compensation steps are shown

    @acceptance-criteria @happy-path @future
    Scenario: Participant ordering follows architectural layers
      Given patterns spanning multiple layers
      When the sequence diagram codec runs
      Then participants are ordered by layer
      And infrastructure layer appears first
