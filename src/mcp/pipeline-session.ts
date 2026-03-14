/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern MCPPipelineSession
 * @libar-docs-status active
 * @libar-docs-arch-role service
 * @libar-docs-arch-context api
 * @libar-docs-arch-layer application
 * @libar-docs-uses PipelineFactory, ProcessStateAPI, ConfigLoader
 * @libar-docs-implements MCPServerIntegration
 *
 * ## MCP Pipeline Session Manager
 *
 * Manages the in-memory MasterDataset lifecycle for the MCP server.
 * Loads config, builds the pipeline once, and provides atomic rebuild.
 *
 * ### When to Use
 *
 * - When the MCP server needs a persistent ProcessStateAPI instance
 * - When rebuilding the dataset after source file changes
 */

import * as fs from 'node:fs';
import * as path from 'path';
import {
  buildMasterDataset,
  type PipelineResult,
  type RuntimeMasterDataset,
} from '../generators/pipeline/index.js';
import { createProcessStateAPI } from '../api/process-state.js';
import type { ProcessStateAPI } from '../api/process-state.js';
import type { TagRegistry } from '../validation-schemas/tag-registry.js';
import { applyProjectSourceDefaults } from '../config/config-loader.js';

// =============================================================================
// Types
// =============================================================================

export interface SessionOptions {
  readonly input?: readonly string[] | undefined;
  readonly features?: readonly string[] | undefined;
  readonly baseDir?: string | undefined;
  readonly watch?: boolean | undefined;
}

export interface PipelineSession {
  readonly dataset: RuntimeMasterDataset;
  readonly api: ProcessStateAPI;
  readonly registry: TagRegistry;
  readonly baseDir: string;
  readonly sourceGlobs: { readonly input: readonly string[]; readonly features: readonly string[] };
  readonly buildTimeMs: number;
}

// =============================================================================
// Pipeline Session Manager
// =============================================================================

export class PipelineSessionManager {
  private session: PipelineSession | null = null;
  private rebuilding = false;

  async initialize(options: SessionOptions = {}): Promise<PipelineSession> {
    const baseDir = path.resolve(options.baseDir ?? process.cwd());

    // Resolve source globs: explicit args override config auto-detection
    const input: string[] = options.input ? [...options.input] : [];
    const features: string[] = options.features ? [...options.features] : [];

    if (input.length === 0 || features.length === 0) {
      const applied = await applyProjectSourceDefaults({ baseDir, input, features });
      if (!applied) {
        // Fall back to convention-based detection
        this.applyFallbackDefaults({ baseDir, input, features });
      }
    }

    if (input.length === 0) {
      throw new Error(
        'No TypeScript source globs found. Provide --input or create delivery-process.config.ts'
      );
    }

    const session = await this.buildSession(baseDir, input, features);
    this.session = session;
    return session;
  }

  async rebuild(): Promise<PipelineSession> {
    if (this.session === null) {
      throw new Error('Cannot rebuild: session not initialized');
    }
    this.rebuilding = true;
    try {
      const newSession = await this.buildSession(
        this.session.baseDir,
        [...this.session.sourceGlobs.input],
        [...this.session.sourceGlobs.features]
      );
      this.session = newSession;
      return newSession;
    } finally {
      this.rebuilding = false;
    }
  }

  getSession(): PipelineSession {
    if (this.session === null) {
      throw new Error('Session not initialized. Call initialize() first.');
    }
    return this.session;
  }

  isRebuilding(): boolean {
    return this.rebuilding;
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private async buildSession(
    baseDir: string,
    input: readonly string[],
    features: readonly string[]
  ): Promise<PipelineSession> {
    const startMs = Date.now();

    const result = await buildMasterDataset({
      input,
      features,
      baseDir,
      mergeConflictStrategy: 'fatal',
    });

    if (!result.ok) {
      throw new Error(`Pipeline error [${result.error.step}]: ${result.error.message}`);
    }

    const pipelineResult: PipelineResult = result.value;
    const dataset = pipelineResult.dataset;
    const api = createProcessStateAPI(dataset);
    const buildTimeMs = Date.now() - startMs;

    return {
      dataset,
      api,
      registry: dataset.tagRegistry,
      baseDir,
      sourceGlobs: { input, features },
      buildTimeMs,
    };
  }

  private applyFallbackDefaults(config: {
    baseDir: string;
    input: string[];
    features: string[];
  }): void {
    if (config.input.length === 0) {
      const configPath = path.join(config.baseDir, 'delivery-process.config.ts');
      if (fs.existsSync(configPath)) {
        config.input.push('src/**/*.ts');
        const stubsDir = path.join(config.baseDir, 'delivery-process', 'stubs');
        if (fs.existsSync(stubsDir)) {
          config.input.push('delivery-process/stubs/**/*.ts');
        }
      }
    }

    if (config.features.length === 0) {
      const specsDir = path.join(config.baseDir, 'delivery-process', 'specs');
      if (fs.existsSync(specsDir)) {
        config.features.push('delivery-process/specs/*.feature');
      }
      const releasesDir = path.join(config.baseDir, 'delivery-process', 'releases');
      if (fs.existsSync(releasesDir)) {
        config.features.push('delivery-process/releases/*.feature');
      }
    }
  }
}
