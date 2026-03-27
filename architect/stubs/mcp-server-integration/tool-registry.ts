/**
 * @architect
 * @architect-status completed
 * @architect-implements MCPServerIntegration
 * @architect-uses ProcessStateAPI, MCPPipelineSession
 * @architect-used-by MCPServerImpl
 * @architect-target src/mcp/tool-registry.ts
 * @architect-since DS-MCP
 *
 * ## MCPToolRegistry — Tool Definitions with Zod Schemas
 *
 * Defines 25 MCP tools mapping to ProcessStateAPI methods and CLI subcommands.
 * Each tool has a architect_ prefix, a Zod input schema for parameter validation,
 * and a handler that delegates to existing API functions.
 *
 * ### Tool Categories (5 groups)
 *
 * | Category | Count | Output Format | Tools |
 * |----------|-------|---------------|-------|
 * | Session-aware | 6 | Formatted text | overview, context, files, dep_tree, scope_validate, handoff |
 * | Data query | 9 | JSON | status, pattern, list, search, rules, tags, sources, stubs, decisions |
 * | Architecture | 6 | JSON | arch_context, arch_layer, arch_neighborhood, arch_blocking, arch_dangling, arch_coverage |
 * | Utility | 1 | JSON | unannotated |
 * | Server mgmt | 3 | Text/JSON | rebuild, config, help |
 *
 * ### Design Decisions
 *
 * DD-1: Text output for session-aware tools - context, overview, scope-validate,
 * handoff, files, dep-tree return formatted text identical to CLI output. This is
 * what Claude Code expects for direct consumption. JSON would require the LLM to
 * parse structure it already understands as text.
 *
 * DD-2: JSON output for data tools - pattern, list, status, stubs, rules return
 * JSON for structured querying. Claude Code can extract specific fields.
 *
 * DD-3: Synchronous handlers where possible - the MCP SDK ToolCallback type
 * accepts both sync and async returns. Handlers that don't need await are
 * synchronous to avoid require-await lint violations.
 *
 * DD-4: No output pipeline - the CLI's output-pipeline.ts (namesOnly, count,
 * fields modifiers) is replaced by dedicated tool parameters. Each tool has
 * explicit namesOnly/count parameters instead of generic modifier flags.
 *
 * DD-5: architect_ prefix per spec invariant - avoids collision with other MCP servers
 * in multi-server Claude Code setups. Matches the spec's Rule 2 invariant.
 *
 * ### When to Use
 *
 * - When registering tools on the McpServer instance
 * - When adding a new tool to the MCP server
 * - When understanding the mapping from CLI subcommands to MCP tools
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PipelineSessionManager } from './pipeline-session.js';

export declare function registerAllTools(
  server: McpServer,
  sessionManager: PipelineSessionManager,
): void;
