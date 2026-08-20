@architect
@architect-pattern:MCPToolRegistryIntegrationTests
@architect-status:active
@architect-product-area:DataAPI
@architect-implements:MCPToolRegistry
@mcp @integration
Feature: Architect MCP tool registration and dispatch
  Split from architect-mcp-integration.feature (M4 Part B.1). Covers happy-path
  handler dispatch for all registered MCP tools and the frozen-inventory
  contract that pins the public tool surface.

  Background:
    Given a test session manager seeded with a rich pattern graph

  Rule: Every registered tool returns a non-empty projection for its documented happy-path args

    **Invariant:** Every registered MCP tool dispatches to its handler, runs through the projection renderer layer, and returns a non-empty `ToolResult.text` for documented happy-path arguments.
    **Rationale:** The MCP tool surface is the package's external contract; any tool returning empty text is a regression in the projection wiring or fragment renderer that must fail loudly in CI.
    **Verified by:** architect_overview returns a compact overview digest, architect_coverage returns JSON-parseable annotation coverage, architect_status returns a JSON-parseable status distribution, architect_context returns a compact session-context bundle, architect_files returns a compact file reading list for the seeded pattern, architect_dep_tree returns a focal-rooted bidirectional dependency context for the seeded pattern, architect_scope_validate returns a compact readiness report for the seeded pattern, architect_pattern returns the seeded pattern detail, architect_bundle returns a JSON-parseable composite pattern bundle, architect_handoff returns a compact handoff record for the seeded pattern, architect_search returns a JSON-parseable search results document, architect_list returns a JSON-parseable pattern catalog, architect_open_questions returns a JSON-parseable open question list, architect_rules returns a JSON-parseable business rule set, architect_rules accepts product-area options, architect_taxonomy returns a JSON-parseable bounded-context taxonomy digest, architect_arch_neighborhood returns a JSON-parseable neighborhood projection, architect_arch_blocking returns a JSON-parseable blocking document, architect_rebuild advances buildTimeMs and returns a compact config projection, architect_config returns a JSON-parseable project config snapshot, architect_documentation returns a JSON-parseable documentation bundle, architect_documentation accepts disclosure and status filter options, architect_help returns a JSON-parseable help document listing every registered tool

    @happy-path
    Scenario: architect_overview returns a compact overview digest
      When I invoke the "architect_overview" tool with {}
      Then the result text is non-empty
      And the tool output root kind is "OverviewDigest"

    @happy-path
    Scenario: architect_coverage returns JSON-parseable annotation coverage
      When I invoke the "architect_coverage" tool with {}
      Then the result text is non-empty
      And the result text parses as JSON
      And the coverage output excludes removed taxonomy tags

    @happy-path
    Scenario: architect_status returns a JSON-parseable status distribution
      When I invoke the "architect_status" tool with {}
      Then the result text is non-empty
      And the result text parses as JSON
      And the tool output root kind is "StatusDistribution"

    @happy-path
    Scenario: architect_context returns a compact session-context bundle
      When I invoke the "architect_context" tool with a name arg targeting the seeded pattern
      Then the result text is non-empty
      And the result text mentions the seeded pattern name

    @happy-path
    Scenario: architect_files returns a compact file reading list for the seeded pattern
      When I invoke the "architect_files" tool with a name arg targeting the seeded pattern
      Then the result text is non-empty
      And the result text references the seeded pattern file path

    @happy-path
    Scenario: architect_dep_tree returns a focal-rooted bidirectional dependency context for the seeded pattern
      When I invoke the "architect_dep_tree" tool with a name arg targeting the seeded pattern
      Then the result text is non-empty
      And the result text is a focal-rooted bidirectional dependency context for the seeded pattern

    @happy-path
    Scenario: architect_scope_validate returns a compact readiness report for the seeded pattern
      When I invoke the "architect_scope_validate" tool with the seeded pattern and session implement
      Then the result text is non-empty
      And the result text mentions the seeded pattern name

    @happy-path
    Scenario: architect_pattern returns the seeded pattern detail
      When I invoke the "architect_pattern" tool with a name arg targeting the seeded pattern
      Then the result text is non-empty
      And the result text parses as JSON
      And the tool output root kind is "PatternDetail"
      And the result text mentions the seeded pattern name

    @happy-path
    Scenario: architect_bundle returns a JSON-parseable composite pattern bundle
      When I invoke the "architect_bundle" tool with the seeded bundle parent and include blocks
      Then the result text is non-empty
      And the result text parses as JSON
      And the tool output root kind is "PatternBundleEntry"
      And the bundle tool output contains the seeded bundle children

    @happy-path
    Scenario: architect_handoff returns a compact handoff record for the seeded pattern
      When I invoke the "architect_handoff" tool with a name arg targeting the seeded pattern
      Then the result text is non-empty
      And the result text mentions the seeded pattern name

    @happy-path
    Scenario: architect_search returns a JSON-parseable search results document
      When I invoke the "architect_search" tool with a query that matches the seeded pattern
      Then the result text is non-empty
      And the result text parses as JSON

    @happy-path
    Scenario: architect_list returns a JSON-parseable pattern catalog
      When I invoke the "architect_list" tool with {}
      Then the result text is non-empty
      And the result text parses as JSON
      And the tool output root kind is "PatternCatalog"
      And the pattern catalog filters exclude removed taxonomy filters

    @happy-path
    Scenario: architect_open_questions returns a JSON-parseable open question list
      When I invoke the "architect_open_questions" tool with {}
      Then the result text is non-empty
      And the result text parses as JSON
      And the tool output root kind is "OpenQuestionList"
      And the result text mentions the seeded pattern name

    @happy-path
    Scenario: architect_rules returns a JSON-parseable business rule set
      When I invoke the "architect_rules" tool with {}
      Then the result text is non-empty
      And the result text parses as JSON

    @happy-path
    Scenario: architect_rules accepts product-area options
      When I invoke the "architect_rules" tool with productArea "Projection"
      Then the result text is non-empty
      And the result text parses as JSON
      And the tool output root kind is "BusinessRuleSet"
      And the result text mentions the seeded pattern name

    @happy-path
    Scenario: architect_taxonomy returns a JSON-parseable bounded-context taxonomy digest
      When I invoke the "architect_taxonomy" tool with {}
      Then the result text is non-empty
      And the result text parses as JSON
      And the tool output root kind is "TaxonomyDigest"
      And the result text uses bounded-context taxonomy vocabulary

    @happy-path
    Scenario: architect_arch_neighborhood returns a JSON-parseable neighborhood projection
      When I invoke the "architect_arch_neighborhood" tool with a name arg targeting the seeded pattern
      Then the result text is non-empty
      And the result text parses as JSON

    @happy-path
    Scenario: architect_arch_blocking returns a JSON-parseable blocking document
      When I invoke the "architect_arch_blocking" tool with {}
      Then the result text is non-empty
      And the result text parses as JSON

    @happy-path
    Scenario: architect_rebuild advances buildTimeMs and returns a compact config projection
      Given I capture the current session buildTimeMs
      When I invoke the "architect_rebuild" tool with {}
      Then the result text is non-empty
      And the session buildTimeMs has advanced

    @happy-path
    Scenario: architect_config returns a JSON-parseable project config snapshot
      When I invoke the "architect_config" tool with {}
      Then the result text is non-empty
      And the result text parses as JSON
      And the tool output root kind is "ProjectConfigSnapshot"

    @happy-path
    Scenario: architect_documentation returns a JSON-parseable documentation bundle
      When I invoke the "architect_documentation" tool with documentType "business-rules"
      Then the result text is non-empty
      And the result text parses as JSON
      And the tool output root kind is "BusinessRuleSet"
      And the result text includes bundle routing metadata

    @happy-path
    Scenario: architect_documentation accepts disclosure and status filter options
      When I invoke the "architect_documentation" tool with documentType "patterns", disclosure "useful", and status filter "completed"
      Then the result text is non-empty
      And the result text parses as JSON
      And the result text mentions the completed dependency pattern
      And the result text does not mention the seeded pattern name

    @happy-path
    Scenario: architect_help returns a JSON-parseable help document listing every registered tool
      When I invoke the "architect_help" tool with {}
      Then the result text is non-empty
      And the result text parses as JSON
      And the tool output kind is "SectionedDocument"
      And the architect_help text mentions every frozen registered tool name

  Rule: The registered tool inventory remains frozen

    **Invariant:** `registerAllTools` registers exactly the documented MCP tool inventory; tool names, descriptions, and the help-text listing are part of the public contract and cannot drift silently.
    **Rationale:** MCP clients and downstream agents depend on a stable tool list; a silent rename or addition breaks `.mcp.json` configurations and skill triggers across consumers.
    **Verified by:** registerAllTools preserves the frozen MCP tool inventory

    @contract
    Scenario: registerAllTools preserves the frozen MCP tool inventory
      When I register all tools on a capturing MCP server
      Then the registered tool names match the frozen MCP contract inventory
      And each registered tool uses the documented description
      And the metadata help text lists every frozen tool name
