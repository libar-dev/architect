// SPDX-License-Identifier: BUSL-1.1
// Copyright (c) 2026 EBIZ d.o.o. All rights reserved.

/**
 * @architect
 * @architect-core
 * @architect-pattern MCPFileWatcher
 * @architect-status active
 * @architect-arch-role infrastructure
 * @architect-arch-context api
 * @architect-arch-layer infrastructure
 * @architect-implements MCPServerIntegration
 *
 * ## MCP File Watcher
 *
 * Watches source file globs and triggers debounced pipeline rebuilds.
 * When a TypeScript or Gherkin file changes, the MasterDataset is rebuilt
 * so subsequent tool calls reflect the updated annotations.
 *
 * ### When to Use
 *
 * - When starting the MCP server with --watch flag
 * - When implementing auto-rebuild on source changes
 */

import type { EventEmitter } from 'events';
import { watch } from 'chokidar';
import type { PipelineSessionManager } from './pipeline-session.js';

// =============================================================================
// Types
// =============================================================================

export interface FileWatcherOptions {
  readonly globs: readonly string[];
  readonly baseDir: string;
  readonly debounceMs?: number;
  readonly sessionManager: PipelineSessionManager;
  readonly log: (message: string) => void;
}

/**
 * Returns true if the file type should trigger a pipeline rebuild.
 * Only TypeScript (.ts) and Gherkin (.feature) files are watched.
 */
export function isWatchedFileType(filePath: string): boolean {
  return filePath.endsWith('.ts') || filePath.endsWith('.feature');
}

// =============================================================================
// File Watcher
// =============================================================================

export class McpFileWatcher {
  private watcher: ReturnType<typeof watch> | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly options: Required<Omit<FileWatcherOptions, 'debounceMs'>> & {
    debounceMs: number;
  };

  constructor(options: FileWatcherOptions) {
    this.options = {
      ...options,
      debounceMs: options.debounceMs ?? 500,
    };
  }

  start(): void {
    this.watcher = watch([...this.options.globs], {
      cwd: this.options.baseDir,
      ignoreInitial: true,
      ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
    });

    // chokidar v5 uses typed EventEmitter<Map> which requires Node 22+ @types/node.
    // Use EventEmitter.on() via cast to maintain Node 20 compatibility.
    const emitter = this.watcher as unknown as EventEmitter;
    emitter.on('change', (filePath: string) => this.onFileChange(filePath));
    emitter.on('add', (filePath: string) => this.onFileChange(filePath));
    emitter.on('unlink', (filePath: string) => this.onFileChange(filePath));
    emitter.on('error', (error: Error) => {
      this.options.log(`File watcher error: ${error.message}`);
    });

    this.options.log(
      `File watcher started (${this.options.globs.length} glob patterns, ${this.options.debounceMs}ms debounce)`
    );
  }

  async stop(): Promise<void> {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.watcher !== null) {
      await this.watcher.close();
      this.watcher = null;
      this.options.log('File watcher stopped');
    }
  }

  private onFileChange(filePath: string): void {
    if (!isWatchedFileType(filePath)) {
      return;
    }

    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      void this.triggerRebuild(filePath);
    }, this.options.debounceMs);
  }

  private async triggerRebuild(triggerFile: string): Promise<void> {
    this.options.log(`Source changed: ${triggerFile} — rebuilding dataset...`);
    try {
      const session = await this.options.sessionManager.rebuild();
      this.options.log(
        `Dataset rebuilt in ${session.buildTimeMs}ms (${session.dataset.patterns.length} patterns)`
      );
    } catch (error) {
      this.options.log(
        `Rebuild failed: ${error instanceof Error ? error.message : String(error)}. Keeping previous dataset.`
      );
    }
  }
}
