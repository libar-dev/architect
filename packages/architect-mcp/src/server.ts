/**
 * @architect
 * @architect-pattern MCPServer
 * @architect-status completed
 * @architect-implements MCPToolRegistryIntegrationTests
 * @architect-uses MCPPipelineSession, MCPToolRegistry, MCPFileWatcher
 * @architect-role:service
 * @architect-bounded-context:api
 * @architect-product-area:DataAPI
 *
 * ## MCPServer — Split Runtime Composition Root
 *
 * Starts the split `@libar-dev/architect-mcp` runtime, builds the shared pipeline
 * session once, registers the package-owned tool surface, and keeps protocol output
 * isolated to stdio-safe channels.
 *
 * **When to Use:** Use as the long-lived Architect MCP server entrypoint or when
 * wiring watch-mode rebuild behavior into an MCP host process.
 */

import { assertHasValue, assertNoNullBytes, formatZodError } from '@libar-dev/architect-core';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { McpFileWatcher } from './file-watcher.js';
import { PipelineSessionManager, type SessionOptions } from './pipeline-session.js';
import { REGISTERED_TOOL_NAMES, registerAllTools } from './tool-registry.js';
import { MCP_SERVER_INSTRUCTIONS } from './tool-metadata.js';
import { readMcpPackageMetadata, resolveMcpBaseDirArg } from './runtime-helpers.js';

const HELP_TEXT = `architect-mcp — Architect MCP server

Usage: architect-mcp [options]

Options:
  -i, --input <glob>       TypeScript source globs (repeatable)
  -f, --features <glob>    Gherkin feature globs (repeatable)
  -b, --base-dir <dir>     Base directory (default: cwd)
  -w, --watch              Watch source files for changes
  -h, --help               Show this help
  -v, --version            Show version`;

export interface McpServerOptions extends SessionOptions {
  readonly version?: string | undefined;
}

interface ParsedCliArgs {
  readonly mode: 'help' | 'version' | 'serve';
  readonly session: SessionOptions;
}

const SessionOptionsSchema = z
  .strictObject({
    input: z.array(z.string()).readonly().optional(),
    features: z.array(z.string()).readonly().optional(),
    baseDir: z.string().optional(),
    watch: z.boolean().optional(),
  })
  .readonly();

const ParsedCliArgsSchema = z.discriminatedUnion('mode', [
  z.strictObject({ mode: z.literal('help'), session: SessionOptionsSchema }).readonly(),
  z.strictObject({ mode: z.literal('version'), session: SessionOptionsSchema }).readonly(),
  z.strictObject({ mode: z.literal('serve'), session: SessionOptionsSchema }).readonly(),
]);

function log(message: string): void {
  console.error(`[architect-mcp] ${message}`);
}

function parseServerCliArgs(rawArgs: ParsedCliArgs): ParsedCliArgs {
  const parsed = ParsedCliArgsSchema.safeParse(rawArgs);
  if (parsed.success) {
    return parsed.data;
  }

  throw new Error(formatZodError(parsed.error, 'Failed to parse architect-mcp CLI arguments'));
}

function parseCliArgs(argv: readonly string[]): ParsedCliArgs {
  const args = argv
    .filter((arg) => arg !== '--')
    .map((arg) => {
      assertNoNullBytes(arg, 'argument');
      return arg;
    });

  if (args.includes('--help') || args.includes('-h')) {
    return parseServerCliArgs({
      mode: 'help',
      session: {},
    });
  }

  if (args.includes('--version') || args.includes('-v')) {
    return parseServerCliArgs({
      mode: 'version',
      session: {},
    });
  }

  const input: string[] = [];
  const features: string[] = [];
  let baseDir: string | undefined;
  let watch = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    if (arg === undefined) {
      continue;
    }

    switch (arg) {
      case '-i':
      case '--input':
        assertHasValue(next, arg);
        input.push(next);
        index += 1;
        break;
      case '-f':
      case '--features':
        assertHasValue(next, arg);
        features.push(next);
        index += 1;
        break;
      case '-b':
      case '--base-dir':
        assertHasValue(next, arg);
        baseDir = resolveMcpBaseDirArg(next);
        index += 1;
        break;
      case '-w':
      case '--watch':
        watch = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return parseServerCliArgs({
    mode: 'serve',
    session: {
      ...(input.length > 0 ? { input } : {}),
      ...(features.length > 0 ? { features } : {}),
      ...(baseDir !== undefined ? { baseDir } : {}),
      ...(watch ? { watch: true } : {}),
    },
  });
}

function mergeOptions(session: SessionOptions, options: McpServerOptions): SessionOptions {
  return {
    ...(session.input !== undefined ? { input: session.input } : {}),
    ...(session.features !== undefined ? { features: session.features } : {}),
    ...(session.baseDir !== undefined ? { baseDir: session.baseDir } : {}),
    ...(session.watch !== undefined ? { watch: session.watch } : {}),
    ...(options.input !== undefined ? { input: options.input } : {}),
    ...(options.features !== undefined ? { features: options.features } : {}),
    ...(options.baseDir !== undefined ? { baseDir: options.baseDir } : {}),
    ...(options.watch !== undefined ? { watch: options.watch } : {}),
  };
}

function createWatcher(
  session: Awaited<ReturnType<PipelineSessionManager['initialize']>>,
  manager: PipelineSessionManager
): McpFileWatcher {
  const globs = [
    ...session.sourceGlobs.input,
    ...session.sourceGlobs.features,
    'architect.config.ts',
    'architect.config.js',
  ];

  return new McpFileWatcher({
    globs,
    baseDir: session.baseDir,
    sessionManager: manager,
    log,
  });
}

export async function startMcpServer(
  argv: readonly string[] = process.argv.slice(2),
  options: McpServerOptions = {}
): Promise<void> {
  const parsed = parseCliArgs(argv);
  const pkg = readMcpPackageMetadata();

  if (parsed.mode === 'help') {
    console.error(HELP_TEXT);
    return;
  }

  if (parsed.mode === 'version') {
    console.error(`${pkg.name} v${options.version ?? pkg.version}`);
    return;
  }

  Reflect.set(globalThis.console, 'log', (...args: unknown[]) => {
    console.error(...args);
  });

  const sessionOptions = mergeOptions(parsed.session, options);
  const sessionManager = new PipelineSessionManager();
  const session = await sessionManager.initialize(sessionOptions);

  const server = new McpServer(
    {
      name: 'architect',
      version: options.version ?? pkg.version,
    },
    {
      capabilities: { logging: {} },
      instructions: MCP_SERVER_INSTRUCTIONS,
    }
  );

  registerAllTools(server, sessionManager);

  const watcher = sessionOptions.watch === true ? createWatcher(session, sessionManager) : null;
  if (watcher !== null) {
    watcher.start();
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);

  log(
    `Server ready for ${session.baseDir} with ${String(session.dataset.counts.total)} patterns and ${String(REGISTERED_TOOL_NAMES.length)} registered tools.`
  );

  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    log(`Received ${signal}; shutting down...`);
    await watcher?.stop();
    await server.close();
  };

  process.once('SIGINT', () => {
    void shutdown('SIGINT').finally(() => process.exit(0));
  });
  process.once('SIGTERM', () => {
    void shutdown('SIGTERM').finally(() => process.exit(0));
  });
}
