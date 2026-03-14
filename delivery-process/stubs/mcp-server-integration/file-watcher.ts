/**
 * @libar-docs
 * @libar-docs-status completed
 * @libar-docs-implements MCPServerIntegration
 * @libar-docs-uses MCPPipelineSession
 * @libar-docs-used-by MCPServerImpl
 * @libar-docs-target src/mcp/file-watcher.ts
 * @libar-docs-since DS-MCP
 *
 * ## McpFileWatcher — Debounced Source File Watcher
 *
 * Watches TypeScript and Gherkin source files for changes, triggering
 * debounced pipeline rebuilds. Uses chokidar v5 with 500ms default debounce.
 *
 * ### Design Decisions
 *
 * DD-1: Chokidar v5 with EventEmitter cast - chokidar v5 uses typed
 * EventEmitter<Map> which requires Node 22+ @types/node. We cast to
 * plain EventEmitter for Node 20 compatibility.
 *
 * DD-2: 500ms debounce window - balances responsiveness (developer sees
 * updated data quickly) with efficiency (avoids rebuilding per keystroke
 * during rapid editing). Configurable via debounceMs option.
 *
 * DD-3: File type filtering - only .ts and .feature file changes trigger
 * rebuilds. Changes to .md, .json, or other files are silently ignored
 * since they don't affect the MasterDataset.
 *
 * DD-4: Rebuild failure isolation - if a rebuild fails (e.g., parse error
 * in modified file), the watcher logs the error and keeps the previous
 * valid dataset. The server never crashes from a file-watch rebuild failure.
 *
 * DD-5: Synchronous start() - watch() from chokidar returns immediately
 * (no async setup needed). The method is synchronous to satisfy the
 * require-await lint rule.
 *
 * ### When to Use
 *
 * - When starting the MCP server with --watch flag
 * - When implementing auto-rebuild on source changes
 */

export interface FileWatcherOptions {
  readonly globs: readonly string[];
  readonly baseDir: string;
  readonly debounceMs?: number | undefined;
  readonly sessionManager: import('./pipeline-session.js').PipelineSessionManager;
  readonly log: (message: string) => void;
}

export declare class McpFileWatcher {
  constructor(options: FileWatcherOptions);
  start(): void;
  stop(): Promise<void>;
}
