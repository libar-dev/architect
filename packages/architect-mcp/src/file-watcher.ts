/**
 * @architect
 * @architect-pattern MCPFileWatcher
 * @architect-status completed
 * @architect-implements MCPToolRegistryIntegrationTests
 * @architect-uses MCPPipelineSession
 * @architect-role:utility
 * @architect-bounded-context:api
 * @architect-product-area:DataAPI
 *
 * ## McpFileWatcher — Debounced Rebuild Boundary
 *
 * Bridges filesystem change events into safe rebuild requests for the in-memory
 * MCP session, coalescing rapid edits without destabilizing the active server.
 *
 * **When to Use:** Use when the MCP runtime needs watch-mode refresh without
 * triggering a rebuild storm on every save.
 */

import { watch, type FSWatcher } from 'chokidar';
import type { PipelineSessionManager } from './pipeline-session.js';

const DEFAULT_DEBOUNCE_MS = 500;

export interface FileWatcherOptions {
  readonly globs: readonly string[];
  readonly baseDir: string;
  readonly debounceMs?: number | undefined;
  readonly sessionManager: PipelineSessionManager;
  readonly log: (message: string) => void;
}

function isWatchedFileType(filePath: string): boolean {
  return (
    filePath.endsWith('.ts') ||
    filePath.endsWith('.feature') ||
    filePath.endsWith('architect.config.ts') ||
    filePath.endsWith('architect.config.js')
  );
}

export class McpFileWatcher {
  private readonly debounceMs: number;
  private pendingTimer: ReturnType<typeof setTimeout> | null = null;
  private rebuildPromise: Promise<void> | null = null;
  private watcher: FSWatcher | null = null;

  constructor(private readonly options: FileWatcherOptions) {
    this.debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  }

  start(): void {
    if (this.watcher !== null) {
      return;
    }

    this.watcher = watch([...this.options.globs], {
      cwd: this.options.baseDir,
      ignoreInitial: true,
    });

    this.watcher.on('all', (eventName: string, filePath: string) => {
      if (!isWatchedFileType(filePath)) {
        return;
      }

      this.options.log(`Detected ${eventName} in ${filePath}. Scheduling rebuild...`);
      this.scheduleRebuild();
    });

    this.watcher.on('error', (error: unknown) => {
      this.options.log(`Watcher error: ${error instanceof Error ? error.message : String(error)}`);
    });

    this.options.log(`Watching ${String(this.options.globs.length)} source glob(s).`);
  }

  async stop(): Promise<void> {
    if (this.pendingTimer !== null) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = null;
    }

    if (this.rebuildPromise !== null) {
      await this.rebuildPromise.catch(() => undefined);
      this.rebuildPromise = null;
    }

    if (this.watcher !== null) {
      await this.watcher.close();
      this.watcher = null;
    }
  }

  private scheduleRebuild(): void {
    if (this.pendingTimer !== null) {
      clearTimeout(this.pendingTimer);
    }

    this.pendingTimer = setTimeout(() => {
      this.pendingTimer = null;
      this.rebuildPromise = this.runRebuild().finally(() => {
        this.rebuildPromise = null;
      });
    }, this.debounceMs);
  }

  private async runRebuild(): Promise<void> {
    try {
      const session = await this.options.sessionManager.rebuild();
      this.options.log(
        `Rebuilt dataset in ${String(session.buildTimeMs)}ms with ${String(session.dataset.counts.total)} patterns.`
      );
    } catch (error) {
      this.options.log(
        `Rebuild failed; previous dataset remains active: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
