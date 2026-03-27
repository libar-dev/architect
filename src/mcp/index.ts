// SPDX-License-Identifier: BUSL-1.1
// Copyright (c) 2026 EBIZ d.o.o. All rights reserved.

/**
 * @architect
 * @architect-core
 * @architect-pattern MCPModule
 * @architect-status active
 * @architect-arch-role infrastructure
 * @architect-arch-context api
 * @architect-arch-layer application
 * @architect-uses MCPServerImpl, MCPPipelineSession, MCPFileWatcher, MCPToolRegistry
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
  type ParseCliResult,
} from './server.js';
export {
  PipelineSessionManager,
  type PipelineSession,
  type SessionOptions,
} from './pipeline-session.js';
export { McpFileWatcher, isWatchedFileType, type FileWatcherOptions } from './file-watcher.js';
export { registerAllTools } from './tool-registry.js';
