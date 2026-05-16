@architect
@architect-pattern:DocumentationCommandParityBoundaryTests
@architect-status:active
@architect-product-area:DataAPI
@api @cli @mcp @contracts
Feature: CLI and MCP documentation parity
  Verify the CLI documentation command and MCP documentation tool produce the same bundle output for the same inputs.

  Background:
    Given the package-hosted documentation parity fixture is initialized

  Rule: CLI and MCP documentation boundaries serialize the same projection bundle

    **Invariant:** The CLI `documentation` command and the MCP `architect_documentation` tool serialize the same projection bundle for the same document type and disclosure/filter inputs.
    **Rationale:** Documentation consumers should see the same bundle semantics regardless of whether they enter through the CLI subprocess boundary or the registered MCP tool boundary.
    **Verified by:** CLI and MCP produce identical JSON for a bundle, CLI and MCP produce identical JSON for filtered and disclosed business rules

    @happy-path
    Scenario Outline: CLI and MCP produce identical JSON for a bundle
      When I generate "<docType>" via the CLI documentation command as JSON
      And I generate "<docType>" via the MCP architect_documentation tool
      Then the two outputs deep-equal

      Examples:
        | docType                 |
        | business-rules          |
        | requirements-executable |
        | decisions               |

    @happy-path
    Scenario: CLI and MCP produce identical JSON for filtered and disclosed business rules
      When I generate "business-rules" via the CLI documentation command as JSON with disclosure "useful" and filter "status=completed"
      And I generate "business-rules" via the MCP architect_documentation tool with disclosure "useful" and completed-status filter
      Then the two outputs deep-equal
