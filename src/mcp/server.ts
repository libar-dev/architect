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
 * Stdout isolation (console.log → stderr redirect) is handled by the CLI
 * entry point (`src/cli/mcp-server.ts`) before this module loads.
 *
 * ### When to Use
 *
 * - When starting the MCP server from the CLI bin entry
 * - When programmatically creating an MCP server instance
 */

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

export interface ParsedOptions {
  input?: readonly string[] | undefined;
  features?: readonly string[] | undefined;
  baseDir?: string | undefined;
  watch?: boolean | undefined;
  version?: string | undefined;
}

export type ParseCliResult =
  | { readonly type: 'options'; readonly options: ParsedOptions }
  | { readonly type: 'help'; readonly text: string }
  | { readonly type: 'version'; readonly text: string }
  | { readonly type: 'error'; readonly message: string };

// =============================================================================
// Server
// =============================================================================

function log(message: string): void {
  console.error(`[dp-mcp] ${message}`);
}

export async function startMcpServer(options: McpServerOptions = {}): Promise<void> {
  // Initialize pipeline session
  const sessionManager = new PipelineSessionManager();

  log('Initializing pipeline...');
  const session = await sessionManager.initialize({
    ...(options.input !== undefined ? { input: options.input } : {}),
    ...(options.features !== undefined ? { features: options.features } : {}),
    ...(options.baseDir !== undefined ? { baseDir: options.baseDir } : {}),
  });
  log(`Pipeline built in ${session.buildTimeMs}ms (${session.dataset.patterns.length} patterns)`);

  // Create MCP server
  const version = options.version ?? '1.0.0';
  const server = new McpServer(
    { name: 'delivery-process', version },
    { capabilities: { logging: {} } }
  );

  // Register all tools
  registerAllTools(server, sessionManager);
  log('Tools registered');

  // Start file watcher if requested
  let fileWatcher: McpFileWatcher | null = null;
  if (options.watch === true) {
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

  // Tear down file watcher when client disconnects (stdin EOF).
  // Without this, chokidar holds the event loop open indefinitely.
  process.stdin.on('end', () => {
    log('Client disconnected (stdin closed)');
    void cleanup().then(() => process.exit(0));
  });
}

// =============================================================================
// CLI Arg Parser
// =============================================================================

export function parseCliArgs(argv: string[], defaults: McpServerOptions = {}): ParseCliResult {
  const result: ParsedOptions = { ...defaults };
  const input: string[] = [];
  const features: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    switch (arg) {
      case '--input':
      case '-i': {
        const val = argv[++i];
        if (val === undefined || val.startsWith('-')) {
          return { type: 'error', message: '--input requires a glob value' };
        }
        input.push(val);
        break;
      }
      case '--features':
      case '-f': {
        const val = argv[++i];
        if (val === undefined || val.startsWith('-')) {
          return { type: 'error', message: '--features requires a glob value' };
        }
        features.push(val);
        break;
      }
      case '--base-dir':
      case '-b': {
        const val = argv[++i];
        if (val === undefined || val.startsWith('-')) {
          return { type: 'error', message: '--base-dir requires a directory path' };
        }
        result.baseDir = val;
        break;
      }
      case '--watch':
      case '-w': {
        result.watch = true;
        break;
      }
      case '--version':
      case '-v': {
        return { type: 'version', text: 'dp-mcp-server v' + (defaults.version ?? '1.0.0') };
      }
      case '--help':
      case '-h': {
        return { type: 'help', text: HELP_TEXT };
      }
      case '--': {
        // Skip pnpm separator
        break;
      }
      default: {
        if (typeof arg === 'string' && arg.startsWith('-')) {
          return { type: 'error', message: `Unknown flag: "${arg}"` };
        }
        break;
      }
    }
  }

  if (input.length > 0) result.input = input;
  if (features.length > 0) result.features = features;

  return { type: 'options', options: result };
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
