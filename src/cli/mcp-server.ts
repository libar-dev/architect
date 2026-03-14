#!/usr/bin/env node
/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern MCPServerBin
 * @libar-docs-status active
 * @libar-docs-arch-role infrastructure
 * @libar-docs-arch-context cli
 * @libar-docs-arch-layer infrastructure
 * @libar-docs-uses MCPServerImpl
 * @libar-docs-implements MCPServerIntegration
 *
 * ## MCP Server CLI Entry Point
 *
 * Minimal bin entry for the delivery-process MCP server.
 * Delegates to startMcpServer() in src/mcp/server.ts.
 */

import { startMcpServer } from '../mcp/server.js';

startMcpServer(process.argv.slice(2)).catch((error: unknown) => {
  console.error('Fatal error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
