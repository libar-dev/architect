@architect
@architect-pattern:MCPToolInputValidationExecutableTests
@architect-status:active
@architect-product-area:DataAPI
@architect-implements:MCPToolRegistry
@mcp @integration
Feature: Architect MCP tool input validation
  Split from architect-mcp-integration.feature (M4 Part B.1). Covers Zod
  parse-at-the-boundary semantics for invokeTool dispatch and the registered
  handler entry point.

  Background:
    Given a test session manager seeded with a rich pattern graph

  Rule: invokeTool validates args via the tool input schema

    **Invariant:** `invokeTool` and the registered MCP handlers parse raw input through each tool's Zod schema exactly once; malformed, missing, or extra-key inputs throw a validation error before the handler runs.
    **Rationale:** Single-parse-at-the-boundary is a repo-wide Zod-first invariant; allowing the handler to receive un-validated input would re-derive the trust boundary internally and risk silent coercion.
    **Verified by:** zero-argument tools accept empty and omitted arguments, architect_context rejects an empty name, architect_scope_validate rejects a session value outside the enum, architect_rules rejects an unknown input key through both invokeTool and registered handlers, architect_open_questions rejects an unknown input key, architect_bundle rejects an unknown input key, architect_rules rejects conflicting pattern and productArea filters, registered handlers validate before reading session state, architect_documentation rejects invalid disclosure and filter values, architect_documentation rejects empty filter values, removed taxonomy inputs are rejected from the fixture, MCP schema help excludes removed taxonomy fields, unknown tool names still fail loudly

    @contract
    Scenario: zero-argument tools accept empty and omitted arguments
      When I invoke every zero-argument tool with {} and omitted arguments
      Then every zero-argument tool invocation succeeds with non-empty text

    @validation
    Scenario: architect_context rejects an empty name
      When I invoke the "architect_context" tool with an empty name
      Then invokeTool throws a validation error

    @validation
    Scenario: architect_scope_validate rejects a session value outside the enum
      When I invoke the "architect_scope_validate" tool with session "planning"
      Then invokeTool throws a validation error

    @negative
    Scenario: architect_rules rejects an unknown input key through both invokeTool and registered handlers
      When I invoke the "architect_rules" tool with an unknown extra key
      And I register all tools on a capturing MCP server
      And I invoke the registered "architect_rules" handler with an unknown extra key
      Then invokeTool and the registered handler both throw the same validation error
      And the validation error message mentions both "Invalid input for architect_rules:" and "unknownExtraKey"

    @negative
    Scenario: architect_open_questions rejects an unknown input key
      When I invoke the "architect_open_questions" tool with an unknown extra key
      Then invokeTool throws a validation error

    @negative
    Scenario: architect_bundle rejects an unknown input key
      When I invoke the "architect_bundle" tool with an unknown extra key
      Then invokeTool throws a validation error

    @negative
    Scenario: architect_rules rejects conflicting pattern and productArea filters
      When I invoke the "architect_rules" tool with conflicting pattern and productArea filters
      Then invokeTool throws the error "pattern and productArea cannot be used together"

    @negative
    Scenario: registered handlers validate before reading session state
      When I register all tools on a capturing MCP server with unavailable session state
      And I invoke the registered "architect_rules" handler with an unknown extra key
      Then the registered handler throws a validation error before reading session state

    @validation
    Scenario: architect_documentation rejects invalid disclosure and filter values
      When I invoke the "architect_documentation" tool with invalid disclosure and filter values
      Then invokeTool throws a validation error

    @validation
    Scenario: architect_documentation rejects empty filter values
      When I invoke the "architect_documentation" tool with empty filter values
      Then invokeTool throws a validation error

    @negative
    Scenario: removed taxonomy inputs are rejected from the fixture
      When I invoke each removed taxonomy input fixture
      Then every removed taxonomy input fixture throws a validation error

    @contract
    Scenario: MCP schema help excludes removed taxonomy fields
      When I register all tools on a capturing MCP server
      Then the registered schema metadata and help text exclude removed taxonomy fields

    @validation
    Scenario: unknown tool names still fail loudly
      When I invoke an unknown MCP tool name
      Then invokeTool throws an error for the unknown tool name
