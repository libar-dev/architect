@architect
@architect-pattern:MCPToolRegistryBoundaryTests
@architect-status:active
@architect-implements:MCPToolRegistryIntegrationTests
@architect-product-area:DataAPI
@mcp @contracts
Feature: Architect MCP input boundary
  Verify MCP tool input validation stays at the protocol boundary.

  Rule: MCP tool input parsing rejects malformed raw input before tool execution

    **Invariant:** MCP raw input is accepted only when nullish or object-shaped; required fields are still validated by each tool schema.
    **Rationale:** Tool handlers should receive typed inputs after a single trust-boundary parse, and malformed raw values must not be silently coerced.
    **Verified by:** Null, string, and number raw inputs fail before tool execution

    @validation
    Scenario: Null raw input uses the tool schema and returns a validation error
      When MCP tool "architect_pattern" receives null raw input
      Then the MCP input boundary rejects it with "Invalid input for architect_pattern"
      And the MCP input boundary rejects it with "name"

    @validation
    Scenario: String raw input is rejected before schema defaults can apply
      When MCP tool "architect_pattern" receives string raw input
      Then the MCP input boundary rejects it with "Invalid input for architect_pattern: expected object"

    @validation
    Scenario: Number raw input is rejected before schema defaults can apply
      When MCP tool "architect_pattern" receives number raw input
      Then the MCP input boundary rejects it with "Invalid input for architect_pattern: expected object"
