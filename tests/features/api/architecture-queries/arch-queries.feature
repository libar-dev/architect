@libar-docs
@libar-docs-pattern:ArchQueriesTest
@libar-docs-status:active
Feature: Architecture Queries - Neighborhood, Comparison, Tags, Sources

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | arch neighborhood unit tests | planned | tests/steps/api/architecture-queries/ | Yes | unit |
      | arch compare unit tests | planned | tests/steps/api/architecture-queries/ | Yes | unit |
      | tags and sources unit tests | planned | tests/steps/api/architecture-queries/ | Yes | unit |

  Rule: Neighborhood and comparison views

    @acceptance-criteria @happy-path
    Scenario: Pattern neighborhood shows direct connections
      Given a pattern "OrderSaga" in context "orders" with role "saga"
      And "OrderSaga" uses "CommandBus" and "EventStore"
      And "OrderSaga" is used by "SagaRouter"
      And a sibling "OrderProjection" in context "orders"
      When computing the neighborhood of "OrderSaga"
      Then the neighborhood uses list contains "CommandBus" and "EventStore"
      And the neighborhood usedBy list contains "SagaRouter"
      And the neighborhood sameContext list contains "OrderProjection"
      And the neighborhood context is "orders"
      And the neighborhood role is "saga"

    @acceptance-criteria @happy-path
    Scenario: Cross-context comparison shows shared and unique dependencies
      Given context "orders" with patterns "OrderSaga" and "OrderProjection"
      And "OrderSaga" uses "EventStore"
      And "OrderProjection" uses "EventStore" and "ReadModel"
      And context "inventory" with patterns "StockChecker" and "StockProjection"
      And "StockChecker" uses "EventStore"
      And "StockProjection" uses "ReadModel" and "CacheLayer"
      When comparing contexts "orders" and "inventory"
      Then shared dependencies include "EventStore" and "ReadModel"
      And unique to "orders" is empty
      And unique to "inventory" contains "CacheLayer"

    @acceptance-criteria @validation
    Scenario: Neighborhood for nonexistent pattern returns undefined
      Given a dataset with no pattern named "NonExistent"
      When computing the neighborhood of "NonExistent"
      Then the neighborhood result is undefined

  Rule: Taxonomy discovery via tags and sources

    @acceptance-criteria @happy-path
    Scenario: Tag aggregation counts values across patterns
      Given patterns with various statuses and categories
      When aggregating tag usage
      Then the report shows status with correct value counts
      And the report shows category with correct value counts
      And tags are sorted by count descending

    @acceptance-criteria @happy-path
    Scenario: Source inventory categorizes files by type
      Given patterns from TypeScript, Gherkin, and stub sources
      When building source inventory
      Then the inventory groups files by type
      And TypeScript files are categorized as "TypeScript (annotated)"
      And feature files are categorized as "Gherkin (features)"
      And stub files are categorized as "Stubs"

    @acceptance-criteria @validation
    Scenario: Tags with no patterns returns empty report
      Given an empty dataset
      When aggregating tag usage
      Then the report has 0 pattern count
      And no tag entries are listed

  Rule: Coverage analysis reports annotation completeness

    @acceptance-criteria @happy-path
    Scenario: Unused taxonomy detection
      Given patterns using only some taxonomy values
      When computing unused taxonomy
      Then unused roles lists values defined but not applied
      And unused layers lists values defined but not applied

    @acceptance-criteria @happy-path
    Scenario: Cross-context comparison with integration points
      Given "OrderSaga" in context "orders" uses "StockChecker" in context "inventory"
      When comparing contexts "orders" and "inventory"
      Then integration points include a "uses" relationship from "OrderSaga" to "StockChecker"

    @acceptance-criteria @validation
    Scenario: Neighborhood includes implements relationships
      Given "OrderHandler" implements "OrderSaga"
      When computing the neighborhood of "OrderSaga"
      Then the neighborhood implementedBy list contains "OrderHandler"
