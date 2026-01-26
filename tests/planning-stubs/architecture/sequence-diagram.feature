@libar-docs
@libar-docs-pattern:SequenceDiagramGeneration
@libar-docs-status:roadmap
@libar-docs-implements:ArchitectureDiagramGeneration
@libar-docs-phase:23
@libar-docs-product-area:DeliveryProcess
@architecture
@future
Feature: Sequence Diagram Generation

  As a CLI user
  I want to generate sequence diagrams from annotated patterns
  So that I can visualize command flows and saga interactions

  **Status:** PLANNING STUB - Not yet implemented

  **Context:**
  Sequence diagrams show runtime flow between components, complementing
  static component/layered diagrams. They visualize message passing
  in command flows and saga orchestration.

  Background: Architecture codec configured for sequence diagrams
    Given an architecture codec configured for sequence diagrams

  # ============================================================================
  # Sequence Diagram Rules (Future Implementation)
  # ============================================================================

  Rule: Command flow sequence diagrams show step-by-step execution

    Sequence diagrams for command flows show the full path from
    command receipt through decider execution to event publication.

    **Invariant:** Sequence must show all participants in execution order.

    **Rationale:** Understanding command flow helps developers trace
    issues and understand system behavior.

    **Verified by:** Generate command flow sequence

    @acceptance-criteria @future
    Scenario: Generate command flow sequence
      Given a command handler pattern "PlaceOrderHandler"
      And a decider pattern "OrderDecider" used by "PlaceOrderHandler"
      And an event pattern "OrderPlaced" produced by "OrderDecider"
      When the sequence diagram is generated for "PlaceOrderHandler"
      Then the Mermaid output is a sequenceDiagram
      And participants appear in order: Handler, Decider, EventStore
      And arrows show message passing between participants

  Rule: Saga flow sequence diagrams show compensation paths

    Saga sequence diagrams must show both the happy path and
    compensation transactions when steps fail.

    **Invariant:** Saga diagrams must include compensation arrows.

    **Rationale:** Sagas are only correct if compensation is properly
    implemented. Visualizing both paths ensures completeness.

    **Verified by:** Generate saga flow sequence

    @acceptance-criteria @future
    Scenario: Generate saga flow sequence
      Given a saga pattern "OrderFulfillmentSaga"
      And saga steps: PlaceOrder, ReserveInventory, ProcessPayment
      And compensation for "ReserveInventory" is "ReleaseInventory"
      When the sequence diagram is generated for "OrderFulfillmentSaga"
      Then the Mermaid output shows the happy path
      And the Mermaid output shows compensation flow with alt block

  Rule: Participant ordering follows architectural layers

    In sequence diagrams, participants should be ordered from
    infrastructure (left) through application to domain (right).

    **Invariant:** Participant order reflects layer dependency direction.

    **Rationale:** Consistent ordering makes diagrams predictable
    and aligns with layered architecture visualization.

    **Verified by:** Participants ordered by layer

    @acceptance-criteria @future
    Scenario: Participants ordered by layer
      Given patterns with layers:
        | name           | archLayer      |
        | HttpController | infrastructure |
        | OrderHandler   | application    |
        | OrderDecider   | domain         |
      When the sequence diagram is generated
      Then participants appear left-to-right: HttpController, OrderHandler, OrderDecider

  Rule: Sequence diagrams include return messages

    For complete flow visualization, sequence diagrams should show
    return messages (responses) alongside request messages.

    **Invariant:** Every call has a corresponding return.

    **Rationale:** Return messages complete the interaction picture
    and show response data flow.

    **Verified by:** Return messages included

    @acceptance-criteria @future
    Scenario: Return messages included
      Given a command flow with request-response pattern
      When the sequence diagram is generated
      Then each solid arrow has a corresponding dashed return arrow
