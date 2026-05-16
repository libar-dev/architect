#!/usr/bin/env node

/**
 * @architect
 * @architect-pattern MCPServerBin
 * @architect-status completed
 * @architect-implements MCPToolRegistryIntegrationTests
 * @architect-uses MCPServer
 * @architect-role:utility
 * @architect-bounded-context:cli
 * @architect-product-area:DataAPI
 *
 * ## MCPServerBin — Executable Runtime Boundary
 *
 * Tiny executable wrapper that turns startup failures into stderr-safe CLI output
 * and delegates the long-lived runtime behavior to the split MCP composition root.
 *
 * **When to Use:** Use as the published `architect-mcp` bin entry.
 */

import { startMcpServer } from '../server.js';

void startMcpServer(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
