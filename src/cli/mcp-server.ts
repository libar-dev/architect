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
 * Handles stdout isolation, CLI arg parsing, and process lifecycle.
 * Delegates to startMcpServer() for MCP server setup.
 *
 * Stdout isolation MUST happen before any MCP module loads — the dynamic
 * import below ensures the console.log redirect is active first.
 */

// Module marker — enables top-level await in TypeScript.
export {};

// Redirect console.log to stderr BEFORE loading MCP modules.
// MCP uses JSON-RPC over stdout — stray console.log corrupts the transport.
console.log = console.error;

// Dynamic import ensures the redirect is active before server module loads.
const { parseCliArgs, startMcpServer } = await import('../mcp/server.js');

const parsed = parseCliArgs(process.argv.slice(2));

switch (parsed.type) {
  case 'help':
    console.error(parsed.text);
    process.exit(0);
    break;
  case 'version':
    console.error(parsed.text);
    process.exit(0);
    break;
  case 'error':
    console.error(`[dp-mcp] Error: ${parsed.message}`);
    process.exit(1);
    break;
  case 'options':
    try {
      await startMcpServer({
        ...(parsed.options.input !== undefined ? { input: parsed.options.input } : {}),
        ...(parsed.options.features !== undefined ? { features: parsed.options.features } : {}),
        ...(parsed.options.baseDir !== undefined ? { baseDir: parsed.options.baseDir } : {}),
        ...(parsed.options.watch !== undefined ? { watch: parsed.options.watch } : {}),
        ...(parsed.options.version !== undefined ? { version: parsed.options.version } : {}),
      });
    } catch (error: unknown) {
      console.error(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
    break;
}
