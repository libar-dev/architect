/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern MCPModule
 * @libar-docs-status active
 * @libar-docs-arch-role infrastructure
 * @libar-docs-arch-context api
 * @libar-docs-arch-layer application
 *
 * ## MCP Module Exports
 *
 * Public API for the MCP server module.
 */

export {
  startMcpServer,
  parseCliArgs,
  type McpServerOptions,
  type ParsedOptions,
} from './server.js';
export {
  PipelineSessionManager,
  type PipelineSession,
  type SessionOptions,
} from './pipeline-session.js';
export { McpFileWatcher, isWatchedFileType, type FileWatcherOptions } from './file-watcher.js';
export { registerAllTools } from './tool-registry.js';
