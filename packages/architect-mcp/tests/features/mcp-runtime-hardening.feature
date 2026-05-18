@architect
@architect-pattern:MCPRuntimeHardeningExecutableTests
@architect-status:active
@architect-product-area:DataAPI
@architect-implements:MCPPipelineSession,MCPFileWatcher
@mcp @integration
Feature: Architect MCP runtime hardening proofs
  Focused regression proofs for the final F1 blocker. These scenarios verify
  that the MCP runtime no longer mutates global process cwd during session
  lifecycle work and that watcher shutdown drains an in-flight rebuild.

  Rule: Pipeline session lifecycle stays process-safe during builds

    **Invariant:** Initializing or rebuilding the in-memory MCP pipeline must not mutate the host process working directory, even while async build work is still in flight.
    **Rationale:** MCP servers are long-lived and share a Node process with other async work; a global cwd flip during awaited session initialization or rebuild can leak into unrelated operations.
    **Verified by:** focused vitest-cucumber regression in tests/features/mcp-runtime-hardening.feature.steps.ts

    @contract
    Scenario: initialize and rebuild keep the host working directory stable
      Then the pipeline session lifecycle keeps the host working directory stable during initialize and rebuild

  Rule: Watcher shutdown drains in-flight rebuild work

    **Invariant:** Stopping the MCP file watcher waits for any already-started rebuild to settle before shutdown returns.
    **Rationale:** Long-running watch sessions must shut down cleanly without abandoning a partially published rebuild cycle.
    **Verified by:** focused vitest-cucumber regression in tests/features/mcp-runtime-hardening.feature.steps.ts

    @contract
    Scenario: stopping watch mode drains an in-flight rebuild
      Then stopping the MCP file watcher waits for an in-flight rebuild to finish
