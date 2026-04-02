@architect
@architect-pattern:DataAPIArchitectureQueries
@architect-status:completed
@architect-unlock-reason:Value-transfer-from-spec
@architect-phase:25b
@architect-depends-on:DataAPIOutputShaping
@architect-product-area:DataAPI
Feature: Architecture Queries - Neighborhood, Comparison, Tags, Sources

  **Problem:**
  The current `arch` subcommand provides basic queries (roles, context, layer, graph)
  but lacks deeper analysis needed for design sessions: pattern neighborhoods (what's
  directly connected), cross-context comparison, annotation coverage gaps, and
  taxonomy discovery. Agents exploring architecture must make multiple queries and
  mentally assemble the picture, wasting context tokens.

  **Solution:**
  Extend the `arch` subcommand and add new discovery commands:
  1. `arch neighborhood <pattern>` shows 1-hop relationships (direct uses/usedBy)
  2. `arch compare <ctx1> <ctx2>` shows shared deps and integration points
  3. `arch coverage` reports annotation completeness with gaps
  4. `tags` lists all tags in use with counts
  5. `sources` shows file inventory by type
  6. `unannotated [--path glob]` finds files without the opt-in marker

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | arch neighborhood unit tests | pending | tests/steps/api/architecture-queries/ | Yes | unit |
      | arch compare unit tests | pending | tests/steps/api/architecture-queries/ | Yes | unit |
      | tags and sources unit tests | pending | tests/steps/api/architecture-queries/ | Yes | unit |

  Rule: Neighborhood and comparison views

    **Invariant:** The architecture query API must provide pattern neighborhood views (direct connections) and cross-context comparison views (shared/unique dependencies), returning undefined for nonexistent patterns.
    **Rationale:** Neighborhood and comparison views are the primary navigation tools for understanding architecture — without them, developers must manually trace relationship chains across files.
    **Verified by:** Pattern neighborhood shows direct connections, Cross-context comparison shows shared and unique dependencies, Neighborhood for nonexistent pattern returns undefined

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

    **Invariant:** The API must aggregate tag values with counts across all patterns and categorize source files by type, returning empty reports when no patterns match.
    **Rationale:** Tag aggregation reveals annotation coverage gaps and source inventory helps teams understand their codebase composition — both are essential for project health monitoring.
    **Verified by:** Tag aggregation counts values across patterns, Source inventory categorizes files by type, Tags with no patterns returns empty report

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

    **Invariant:** Coverage analysis must detect unused taxonomy entries, cross-context integration points, and include all relationship types (implements, dependsOn, enables) in neighborhood views.
    **Rationale:** Unused taxonomy entries indicate dead configuration while missing relationship types produce incomplete architecture views — both degrade the reliability of generated documentation.
    **Verified by:** Unused taxonomy detection, Cross-context comparison with integration points, Neighborhood includes implements relationships, Neighborhood includes dependsOn and enables relationships

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

    @acceptance-criteria @happy-path
    Scenario: Neighborhood includes dependsOn and enables relationships
      Given a pattern "App" that depends on "Infra"
      And "Infra" enables "App" via reverse computation
      When computing the neighborhood of "App"
      Then the neighborhood dependsOn list contains "Infra"
      And the neighborhood enables list for "Infra" contains "App"
