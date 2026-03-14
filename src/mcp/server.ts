/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern MCPServerImpl
 * @libar-docs-status active
 * @libar-docs-arch-role service
 * @libar-docs-arch-context api
 * @libar-docs-arch-layer application
 * @libar-docs-uses MCPPipelineSession, MCPToolRegistry, MCPFileWatcher
 * @libar-docs-implements MCPServerIntegration
 *
 * ## MCP Server Entry Point
 *
 * Main entry point for the delivery-process MCP server.
 * Initializes the pipeline, registers tools, and connects via stdio transport.
 *
 * ### Stdout Isolation
 *
 * CRITICAL: MCP protocol uses JSON-RPC over stdout. All application logging
 * must go to stderr. console.log is redirected to console.error at module
 * load time to prevent accidental stdout corruption.
 *
 * ### When to Use
 *
 * - When starting the MCP server from the CLI bin entry
 * - When programmatically creating an MCP server instance
 */

// =============================================================================
// Stdout Isolation (MUST be first — before any other imports that might log)
// =============================================================================

// Redirect console.log to stderr so only MCP JSON-RPC goes to stdout.
// eslint-disable-next-line no-console
const _originalConsoleLog = console.log;
// eslint-disable-next-line no-console
console.log = console.error;

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { PipelineSessionManager, type SessionOptions } from './pipeline-session.js';
import { registerAllTools } from './tool-registry.js';
import { McpFileWatcher } from './file-watcher.js';

// =============================================================================
// Types
// =============================================================================

export interface McpServerOptions extends SessionOptions {
  readonly watch?: boolean;
  readonly version?: string;
}

// =============================================================================
// Server
// =============================================================================

function log(message: string): void {
  console.error(`[dp-mcp] ${message}`);
}

export async function startMcpServer(
  argv: string[] = [],
  options: McpServerOptions = {}
): Promise<void> {
  // Parse CLI args
  const parsedOptions = parseCliArgs(argv, options);

  // Initialize pipeline session
  const sessionManager = new PipelineSessionManager();

  log('Initializing pipeline...');
  try {
    const session = await sessionManager.initialize({
      ...(parsedOptions.input !== undefined ? { input: parsedOptions.input } : {}),
      ...(parsedOptions.features !== undefined ? { features: parsedOptions.features } : {}),
      ...(parsedOptions.baseDir !== undefined ? { baseDir: parsedOptions.baseDir } : {}),
    });
    log(`Pipeline built in ${session.buildTimeMs}ms (${session.dataset.patterns.length} patterns)`);
  } catch (error) {
    log(`Failed to initialize pipeline: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  // Create MCP server
  const version = parsedOptions.version ?? '1.0.0';
  const server = new McpServer(
    { name: 'delivery-process', version },
    { capabilities: { logging: {} } }
  );

  // Register all tools
  registerAllTools(server, sessionManager);
  log('Tools registered');

  // Start file watcher if requested
  let fileWatcher: McpFileWatcher | null = null;
  if (parsedOptions.watch === true) {
    const session = sessionManager.getSession();
    fileWatcher = new McpFileWatcher({
      globs: [...session.sourceGlobs.input, ...session.sourceGlobs.features],
      baseDir: session.baseDir,
      sessionManager,
      log,
    });
    fileWatcher.start();
  }

  // Handle shutdown
  const cleanup = async (): Promise<void> => {
    log('Shutting down...');
    if (fileWatcher !== null) {
      await fileWatcher.stop();
    }
    await server.close();
    log('Shutdown complete');
  };

  process.on('SIGINT', () => {
    void cleanup().then(() => process.exit(0));
  });
  process.on('SIGTERM', () => {
    void cleanup().then(() => process.exit(0));
  });

  // Connect via stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log('MCP server running on stdio');
}

// =============================================================================
// CLI Arg Parser
// =============================================================================

export interface ParsedOptions {
  input?: readonly string[] | undefined;
  features?: readonly string[] | undefined;
  baseDir?: string | undefined;
  watch?: boolean | undefined;
  version?: string | undefined;
}

export function parseCliArgs(argv: string[], defaults: McpServerOptions = {}): ParsedOptions {
  const result: ParsedOptions = { ...defaults };
  const input: string[] = [];
  const features: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    switch (arg) {
      case '--input':
      case '-i': {
        const val = argv[++i];
        if (val !== undefined) input.push(val);
        break;
      }
      case '--features':
      case '-f': {
        const val = argv[++i];
        if (val !== undefined) features.push(val);
        break;
      }
      case '--base-dir':
      case '-b': {
        result.baseDir = argv[++i];
        break;
      }
      case '--watch':
      case '-w': {
        result.watch = true;
        break;
      }
      case '--version':
      case '-v': {
        console.error('dp-mcp-server v' + (defaults.version ?? '1.0.0'));
        process.exit(0);
        break;
      }
      case '--help':
      case '-h': {
        console.error(HELP_TEXT);
        process.exit(0);
        break;
      }
      case '--': {
        // Skip pnpm separator
        break;
      }
      default: {
        if (typeof arg === 'string' && arg.startsWith('-')) {
          console.error(`[dp-mcp] Warning: unknown argument "${arg}"`);
        }
        break;
      }
    }
  }

  if (input.length > 0) result.input = input;
  if (features.length > 0) result.features = features;

  return result;
}

const HELP_TEXT = `
dp-mcp-server — MCP server for delivery-process

Usage: dp-mcp-server [options]

Options:
  -i, --input <glob>       TypeScript source globs (repeatable)
  -f, --features <glob>    Gherkin feature globs (repeatable)
  -b, --base-dir <dir>     Base directory (default: cwd)
  -w, --watch              Watch source files for changes
  -h, --help               Show this help
  -v, --version            Show version

The server auto-detects delivery-process.config.ts if no explicit
globs are provided. Configure in Claude Code via .mcp.json:

  {
    "mcpServers": {
      "delivery-process": {
        "command": "npx",
        "args": ["dp-mcp-server"],
        "cwd": "/path/to/project"
      }
    }
  }
`.trim();
