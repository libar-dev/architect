/**
 * @libar-docs
 * @libar-docs-status completed
 * @libar-docs-implements MCPServerIntegration
 * @libar-docs-uses PipelineFactory, ProcessStateAPI, ConfigLoader
 * @libar-docs-used-by MCPServerImpl, MCPToolRegistry, MCPFileWatcher
 * @libar-docs-target src/mcp/pipeline-session.ts
 * @libar-docs-since DS-MCP
 *
 * ## PipelineSessionManager — In-Memory MasterDataset Lifecycle
 *
 * Manages the persistent MasterDataset that all MCP tool calls read from.
 * Loads config via auto-detection or explicit globs, builds the pipeline once,
 * and provides atomic rebuild with concurrent-read safety.
 *
 * ### Architecture
 *
 * ```
 * SessionOptions
 *     |
 *     v
 * PipelineSessionManager.initialize()
 *     |-- loadConfig() / applyProjectSourceDefaults()
 *     |-- buildMasterDataset()
 *     |-- createProcessStateAPI()
 *     v
 * PipelineSession { dataset, api, registry, baseDir, sourceGlobs, buildTimeMs }
 * ```
 *
 * ### Design Decisions
 *
 * DD-1: Atomic dataset swap on rebuild - during rebuild, tool calls read from
 * the previous PipelineSession. The new session replaces it atomically after
 * a successful build. Failed rebuilds are logged, previous dataset stays active.
 *
 * DD-2: Config auto-detection mirrors the CLI - uses the same
 * applyProjectSourceDefaults() from config-loader, then falls back to
 * filesystem-based detection (delivery-process.config.ts presence,
 * delivery-process/specs/ and delivery-process/stubs/ directories).
 *
 * DD-3: No caching layer - the CLI uses dataset-cache.ts for inter-process
 * caching, but the MCP server keeps the dataset in-process memory. Caching
 * would add complexity with no benefit for a long-lived server process.
 *
 * ### When to Use
 *
 * - When the MCP server needs to load or reload the pipeline
 * - When implementing rebuild triggers (manual or file-watch)
 */

export interface SessionOptions {
  readonly input?: readonly string[] | undefined;
  readonly features?: readonly string[] | undefined;
  readonly baseDir?: string | undefined;
  readonly watch?: boolean | undefined;
}

export interface PipelineSession {
  readonly dataset: import('../../src/generators/pipeline/index.js').RuntimeMasterDataset;
  readonly api: import('../../src/api/process-state.js').ProcessStateAPI;
  readonly registry: import('../../src/validation-schemas/tag-registry.js').TagRegistry;
  readonly baseDir: string;
  readonly sourceGlobs: {
    readonly input: readonly string[];
    readonly features: readonly string[];
  };
  readonly buildTimeMs: number;
}

export declare class PipelineSessionManager {
  initialize(options?: SessionOptions): Promise<PipelineSession>;
  rebuild(): Promise<PipelineSession>;
  getSession(): PipelineSession;
  isRebuilding(): boolean;
}
