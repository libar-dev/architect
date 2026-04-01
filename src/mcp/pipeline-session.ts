// SPDX-License-Identifier: BUSL-1.1
// Copyright (c) 2026 EBIZ d.o.o. All rights reserved.

/**
 * @architect
 * @architect-core
 * @architect-pattern MCPPipelineSession
 * @architect-status active
 * @architect-arch-role service
 * @architect-arch-context api
 * @architect-arch-layer application
 * @architect-uses PipelineFactory, PatternGraphAPI, ConfigLoader
 * @architect-implements MCPServerIntegration
 *
 * ## MCP Pipeline Session Manager
 *
 * Manages the in-memory PatternGraph lifecycle for the MCP server.
 * Loads config, builds the pipeline once, and provides atomic rebuild.
 *
 * ### When to Use
 *
 * - When the MCP server needs a persistent PatternGraphAPI instance
 * - When rebuilding the dataset after source file changes
 */

import * as fs from 'node:fs';
import * as path from 'path';
import {
  buildPatternGraph,
  type PipelineResult,
  type RuntimePatternGraph,
} from '../generators/pipeline/index.js';
import { createPatternGraphAPI } from '../api/pattern-graph-api.js';
import type { PatternGraphAPI } from '../api/pattern-graph-api.js';
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
  readonly dataset: RuntimePatternGraph;
  readonly api: PatternGraphAPI;
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
  private rebuildPromise: Promise<PipelineSession> | null = null;
  private pendingRebuild = false;

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
        'No TypeScript source globs found. Provide --input or create architect.config.ts'
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

    if (this.rebuildPromise !== null) {
      this.pendingRebuild = true;
      return this.rebuildPromise;
    }

    this.rebuildPromise = this.runRebuildLoop();
    try {
      return await this.rebuildPromise;
    } finally {
      this.pendingRebuild = false;
      this.rebuildPromise = null;
    }
  }

  getSession(): PipelineSession {
    if (this.session === null) {
      throw new Error('Session not initialized. Call initialize() first.');
    }
    return this.session;
  }

  isRebuilding(): boolean {
    return this.rebuildPromise !== null;
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private async runRebuildLoop(): Promise<PipelineSession> {
    if (this.session === null) {
      throw new Error('Cannot rebuild: session not initialized');
    }

    let latestSession = this.session;

    for (;;) {
      this.pendingRebuild = false;

      const newSession = await this.buildSession(
        latestSession.baseDir,
        [...latestSession.sourceGlobs.input],
        [...latestSession.sourceGlobs.features]
      );
      this.session = newSession;
      latestSession = newSession;

      // Another caller may set pendingRebuild while buildSession() is awaiting.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!this.pendingRebuild) {
        return latestSession;
      }
    }
  }

  private async buildSession(
    baseDir: string,
    input: readonly string[],
    features: readonly string[]
  ): Promise<PipelineSession> {
    const startMs = Date.now();

    const result = await buildPatternGraph({
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
    const api = createPatternGraphAPI(dataset);
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
      const tsConfigPath = path.join(config.baseDir, 'architect.config.ts');
      const jsConfigPath = path.join(config.baseDir, 'architect.config.js');
      if (fs.existsSync(tsConfigPath) || fs.existsSync(jsConfigPath)) {
        config.input.push('src/**/*.ts');
        const stubsDir = path.join(config.baseDir, 'architect', 'stubs');
        if (fs.existsSync(stubsDir)) {
          config.input.push('architect/stubs/**/*.ts');
        }
      }
    }

    if (config.features.length === 0) {
      const specsDir = path.join(config.baseDir, 'architect', 'specs');
      if (fs.existsSync(specsDir)) {
        config.features.push('architect/specs/*.feature');
      }
      const releasesDir = path.join(config.baseDir, 'architect', 'releases');
      if (fs.existsSync(releasesDir)) {
        config.features.push('architect/releases/*.feature');
      }
    }
  }
}
