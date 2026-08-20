@architect
@architect-pattern:MCPPipelineSessionDatasetLookupExecutableTests
@architect-status:active
@architect-product-area:DataAPI
@architect-implements:MCPPipelineSession,MCPToolRegistry
@mcp @integration
Feature: Architect MCP pipeline session uses the dataset, not the query facade
  The MCP runtime looks up patterns on session.dataset. PipelineSession does
  not own a PatternGraph query facade, and the 21-tool payloads stay frozen.

  Background:
    Given a test session manager seeded with a rich pattern graph

  Rule: PipelineSession exposes no query facade

    **Invariant:** PipelineSession has no `api` property, and MCP source and tests do not import or construct the query facade type or factory.
    **Rationale:** Pattern lookup belongs on the canonical dataset helper; the query facade is not an MCP session dependency.
    **Verified by:** PipelineSession has no api property, MCP source and tests do not import or construct the query facade

    @contract
    Scenario: PipelineSession has no api property
      Then the pipeline session has no api property

    @contract
    Scenario: MCP source and tests do not import or construct the query facade
      Then MCP source and tests do not import or construct the query facade

  Rule: Coverage, dependency-tree, and handoff payloads stay frozen

    **Invariant:** `architect_coverage`, `architect_dep_tree`, and `architect_handoff` keep their existing payload keys, including `coveragePercentage`, DependencyContext forests, and HandoffRecord fields. An unknown handoff pattern still fails with `PATTERN_NOT_FOUND`.
    **Rationale:** Removing the session facade must not change the MCP tool contract.
    **Verified by:** architect_coverage keeps the annotation coverage payload keys, architect_dep_tree keeps the dependency context payload keys, architect_handoff keeps the handoff record payload keys, architect_handoff on an unknown pattern follows the existing not-found path

    @happy-path
    Scenario: architect_coverage keeps the annotation coverage payload keys
      When I invoke the "architect_coverage" tool with {}
      Then the coverage payload includes coveragePercentage and the frozen root keys

    @happy-path
    Scenario: architect_dep_tree keeps the dependency context payload keys
      When I invoke the "architect_dep_tree" tool with a name arg targeting the seeded pattern
      Then the dependency-tree payload includes the frozen DependencyContext keys

    @happy-path
    Scenario: architect_handoff keeps the handoff record payload keys
      When I invoke the "architect_handoff" tool with a name arg targeting the seeded pattern
      Then the handoff payload includes the frozen HandoffRecord keys

    @negative
    Scenario: architect_handoff on an unknown pattern follows the existing not-found path
      When I invoke the "architect_handoff" tool with an unknown pattern name
      Then invokeTool throws PATTERN_NOT_FOUND for the unknown pattern
