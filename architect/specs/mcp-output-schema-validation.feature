@architect
@architect-pattern:McpOutputSchemaValidation
@architect-status:candidate
@architect-product-area:DataAPI
@architect-uses:PerspectiveAwareProjections
@architect-bounded-context:api
@architect-see-also:ADR006SingleReadModelArchitecture
Feature: McpOutputSchemaValidation

  **Problem:**
  Only 3 of 24 `jsonResult()` calls in tool-registry.ts have undefined guards.
  No MCP tool response is validated against an output schema. When a tool handler
  returns undefined or a structurally unexpected value, `JSON.stringify()` silently
  produces `"undefined"` or drops fields -- silent data corruption delivered to
  AI agents as authoritative context.

  The `arch_neighborhood` undefined bug (fixed as a pre-49 bugfix) demonstrated
  the failure mode: `computeNeighborhood()` returns `undefined` for unknown
  patterns, and `jsonResult(undefined)` serializes to the string `"undefined"` --
  which an LLM treats as valid neighborhood data.

  **Why deferred until after PerspectiveAwareProjections:**
  PAP adds --maturity, --role, and --perspective parameters to `architect_list`,
  `architect_status`, `architect_overview`, and 5+ other tools. It also adds
  `architect_diagnostics` as a new tool. Adding Zod output schemas before PAP
  stabilizes these response shapes would create throwaway validation code.

  **Solution:**
  After PAP ships and output shapes are stable, add Zod output schemas for all
  MCP tool responses. Each tool handler validates its response through a schema
  before serialization. Invalid responses produce a structured error result
  instead of silent corruption. The schemas also serve as machine-readable API
  documentation for MCP tool consumers.

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Output schemas for all 24+ MCP tool handlers | pending | src/mcp/output-schemas.ts |
      | jsonResult validates through output schema before serialization | pending | src/mcp/tool-registry.ts |
      | Undefined guards on all handlers that can return undefined | pending | src/mcp/tool-registry.ts |
      | Error result for schema validation failures | pending | src/mcp/tool-registry.ts |

  Rule: Every MCP tool response is schema-validated before serialization

    **Invariant:** No MCP tool handler passes raw data to `jsonResult()`. Every
    response goes through a Zod output schema. When the handler result does not
    match the schema, the tool returns an error result with the validation failure
    details rather than silently corrupting the output.

    **Rationale:** MCP tool responses are consumed by AI agents as authoritative
    context. Silent data corruption (undefined serialized as string, missing
    fields, wrong types) degrades agent reasoning without any signal that the
    context is malformed. Schema validation at the serialization boundary makes
    these failures loud and actionable.

    **Verified by:** Tool response validated against output schema,
    Invalid response produces error result

    @acceptance-criteria @happy-path
    Scenario: Tool response validated against output schema
      Given an MCP tool handler that returns a valid neighborhood result
      When the result is passed through jsonResult with output schema validation
      Then the response is serialized correctly
      And no validation errors are produced

    @acceptance-criteria @validation
    Scenario: Invalid response produces error result instead of silent corruption
      Given an MCP tool handler that returns undefined
      When the result is passed through jsonResult with output schema validation
      Then an error result is returned with a descriptive message
      And the string "undefined" is not serialized to the client
