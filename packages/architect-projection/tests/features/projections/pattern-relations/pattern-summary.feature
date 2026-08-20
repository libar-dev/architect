@architect
@architect-pattern:PatternSummaryCatalogProjectionExecutableTests
@architect-implements:PatternRelationsProjectionSupport,PatternSummaryProjection,PatternCatalogProjection
@architect-status:completed
@architect-product-area:Projection
@architect-role:projection
@pattern-relations
Feature: Pattern summary projection

  **Business Value:** Consumers obtain the canonical short description of any
  pattern — name, status, role, file, and source (`typescript` or
  `gherkin`) — as a stable `PatternSummary` fragment, and can list or filter
  the whole graph through the `PatternCatalog` projection by status and role
  alias, with `namesOnly` and `count` flags for compact responses.

  **How It Works:** Summary projection resolves the pattern
  (case-insensitively) via `requirePattern`, derives the source from the file
  extension, and returns the stable shape; unknown names fail with a fuzzy
  suggestion. Catalog projection resolves role aliases against the tag
  registry, filters pattern summaries by status and canonical role, sorts
  them alphabetically, and omits `names` and `items` according to the
  `count` and `namesOnly` flags.

  Background:
    Given the Pattern Relations pattern summary state is initialized
    And the following deliverables:
      | Deliverable             | Status   | Location |
      | Executable test feature | complete | packages/architect-projection/tests/features/projections/pattern-relations/pattern-summary.feature |

  Rule: Pattern summaries keep the stable fragment contract

    **Invariant:** A `PatternSummary` always exposes `patternName`, `status`,
    `role`, `file`, and `source` fields, lookup is case-insensitive, and
    unknown names produce a `PATTERN_NOT_FOUND` error with a fuzzy suggestion.

    **Rationale:** Summary is the foundational fragment reused by catalog,
    detail, and every renderer — any shape drift or silent miss would
    cascade across the projection surface.

    **Verified by:** projecting a canonical pattern summary, pattern lookup is case-insensitive, missing patterns return a suggested match

    @acceptance-criteria
    Scenario: projecting a canonical pattern summary
      Given a summary projection context with a pattern named "WidgetService"
      When I project the summary for "WidgetService"
      Then the projected summary should expose the canonical fragment fields

    Scenario: pattern lookup is case-insensitive
      Given a summary projection context with a pattern named "WidgetService"
      When I project the summary for "widgetservice"
      Then the projected summary should still target "WidgetService"

    Scenario: missing patterns return a suggested match
      Given a summary projection context with a pattern named "WidgetService"
      When I project the summary for the missing pattern "WidgetServic"
      Then the summary projection should fail with a suggestion for "WidgetService"

  Rule: Pattern catalogs own list filtering semantics

    **Invariant:** Role filters are resolved to canonical tags through the tag
    registry before matching, status/role filters combine with AND
    semantics, results are sorted alphabetically by pattern name, and the
    `namesOnly` and `count` flags omit `items` (and `names` when `count` is
    true) from the payload while still reporting the full `count`.

    **Rationale:** Catalog consumers (`architect_list`, `architect_search`, and
    UI pickers) must see deterministic, filterable views without duplicating alias resolution
    or sorting logic — and must be able to request just a count or just
    names when the full summaries would be wasteful.

    **Verified by:** role aliases resolve before catalog filtering, status filter selects matching patterns, status and role filters combine, count flag returns only the matching count, namesOnly flag returns names without item details

    Scenario: role aliases resolve before catalog filtering
      Given a catalog projection context with canonical and non-matching roles
      When I project the pattern catalog for role alias "infrastructure"
      Then the projected catalog should resolve the canonical role filter
      And the projected catalog should include only "InfraPattern"

    Scenario: status filter selects matching patterns
      Given a catalog projection context with mixed status and role variants
      When I project the pattern catalog with status "active"
      Then the projected catalog names should be "ActiveInfraPhase50, ActiveService"

    Scenario: status and role filters combine
      Given a catalog projection context with mixed status and role variants
      When I project the pattern catalog with status "active" and role alias "infrastructure"
      Then the projected catalog should resolve the canonical role filter
      And the projected catalog names should be "ActiveInfraPhase50"

    Scenario: count flag returns only the matching count
      Given a catalog projection context with mixed status and role variants
      When I project the pattern catalog with count true
      Then the projected catalog count should be 4
      And the projected catalog should omit names and items

    Scenario: namesOnly flag returns names without item details
      Given a catalog projection context with mixed status and role variants
      When I project the pattern catalog with namesOnly true
      Then the projected catalog names should be "ActiveInfraPhase50, ActiveService, CompletedService, RoadmapUiPhase50"
      And the projected catalog should omit item details
