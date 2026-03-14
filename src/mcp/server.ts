// SPDX-License-Identifier: BUSL-1.1
// Copyright (c) 2026 EBIZ d.o.o. All rights reserved.

/**
 * @architect
 * @architect-core
 * @architect-pattern MCPServerImpl
 * @architect-status active
 * @architect-arch-role service
 * @architect-arch-context api
 * @architect-arch-layer application
 * @architect-uses MCPPipelineSession, MCPToolRegistry, MCPFileWatcher
 * @architect-implements MCPServerIntegration
 *
 * ## MCP Server Entry Point
 *
 * Main entry point for the Architect MCP server.
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
import { getPackageVersion } from '../cli/version.js';
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
  console.error(`[architect-mcp] ${message}`);
}

const DEFAULT_MCP_SERVER_VERSION = getPackageVersion();

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
  const version = options.version ?? DEFAULT_MCP_SERVER_VERSION;
  const server = new McpServer({ name: 'architect', version }, { capabilities: { logging: {} } });

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

  // Handle shutdown — idempotent guard prevents double-close races
  // when multiple signals/EOF fire concurrently.
  let cleanupPromise: Promise<void> | null = null;
  const cleanup = (): Promise<void> => {
    if (cleanupPromise !== null) return cleanupPromise;
    cleanupPromise = (async (): Promise<void> => {
      log('Shutting down...');
      if (fileWatcher !== null) {
        await fileWatcher.stop();
      }
      await server.close();
      log('Shutdown complete');
    })();
    return cleanupPromise;
  };

  process.once('SIGINT', () => {
    void cleanup().then(() => process.exit(0));
  });
  process.once('SIGTERM', () => {
    void cleanup().then(() => process.exit(0));
  });

  // Connect via stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log('MCP server running on stdio');

  // Tear down file watcher when client disconnects (stdin EOF).
  // Without this, chokidar holds the event loop open indefinitely.
  process.stdin.once('end', () => {
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
        return {
          type: 'version',
          text: 'architect-mcp v' + (defaults.version ?? DEFAULT_MCP_SERVER_VERSION),
        };
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
architect-mcp — Architect MCP server

Usage: architect-mcp [options]

Options:
  -i, --input <glob>       TypeScript source globs (repeatable)
  -f, --features <glob>    Gherkin feature globs (repeatable)
  -b, --base-dir <dir>     Base directory (default: cwd)
  -w, --watch              Watch source files for changes
  -h, --help               Show this help
  -v, --version            Show version

The server auto-detects architect.config.ts if no explicit
globs are provided. Configure in Claude Code via .mcp.json:

  {
    "mcpServers": {
      "architect": {
        "command": "npx",
        "args": ["architect-mcp"],
        "cwd": "/path/to/project"
      }
    }
  }
`.trim();
