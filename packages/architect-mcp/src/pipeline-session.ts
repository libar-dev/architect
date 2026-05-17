/**
 * @architect
 * @architect-pattern MCPPipelineSession
 * @architect-status completed
 * @architect-implements MCPToolRegistryIntegrationTests
 * @architect-uses MCPToolRegistry, MCPFileWatcher
 * @architect-role:service
 * @architect-bounded-context:api
 * @architect-product-area:DataAPI
 *
 * ## PipelineSessionManager — In-Memory PatternGraph Lifecycle
 *
 * Owns the long-lived PatternGraph/API pair for the split MCP runtime, including
 * config auto-detection, fallback source planning, and coalesced rebuild behavior.
 *
 * **When to Use:** Use for any MCP flow that needs a stable in-process dataset
 * across multiple tool invocations.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  applyProjectSourceDefaults,
  buildPatternGraph,
  createPackageResolver,
  findConfigFile,
  loadProjectConfig,
  resolveWorkspaceSources,
  type BuildResult,
  type FormatType,
  type PackageResolver,
  type ProjectMetadata,
  type RuntimePatternGraph,
  type TagRegistry,
  WORKSPACE_TAG_REGISTRY,
  createPatternGraphAPI,
  type PatternGraphAPI,
} from '@libar-dev/architect-core';
import { normalizeSessionBaseDir } from './runtime-helpers.js';

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
  readonly tagRegistryOverride?: TagRegistry | undefined;
  readonly baseDir: string;
  readonly configPath: string;
  readonly packageResolver: PackageResolver;
  readonly projectMetadata?: ProjectMetadata | undefined;
  readonly tagExampleOverrides?:
    | Partial<Record<FormatType, { description?: string; example?: string }>>
    | undefined;
  readonly sourceGlobs: {
    readonly input: readonly string[];
    readonly features: readonly string[];
    readonly exclude?: readonly string[] | undefined;
  };
  readonly buildTimeMs: number;
  readonly diagnostics: BuildResult['diagnostics'];
}

export class PipelineSessionManager {
  private session: PipelineSession | null = null;
  private rebuildPromise: Promise<PipelineSession> | null = null;
  private pendingRebuild = false;

  async initialize(options: SessionOptions = {}): Promise<PipelineSession> {
    const baseDir = normalizeSessionBaseDir(options.baseDir);
    const input: string[] = options.input ? [...options.input] : [];
    const features: string[] = options.features ? [...options.features] : [];
    let tagRegistryOverride: TagRegistry | undefined;

    if (input.length === 0 && features.length === 0) {
      const workspaceSources = resolveWorkspaceSources(baseDir);
      if (workspaceSources.input.length > 0 && workspaceSources.features.length > 0) {
        input.push(...workspaceSources.input);
        features.push(...workspaceSources.features);
        tagRegistryOverride = WORKSPACE_TAG_REGISTRY;
      }
    }

    if (input.length === 0 || features.length === 0) {
      const applied = await this.withWorkingDirectory(baseDir, () =>
        applyProjectSourceDefaults({ baseDir, input, features }),
      );
      if (!applied) {
        this.applyFallbackDefaults({ baseDir, input, features });
      }
    }

    if (input.length === 0) {
      throw new Error(
        'No TypeScript source globs found. Provide --input or create architect.config.ts',
      );
    }

    const session = await this.withWorkingDirectory(baseDir, () =>
      this.buildSession(baseDir, input, features, tagRegistryOverride),
    );
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

  private async runRebuildLoop(): Promise<PipelineSession> {
    if (this.session === null) {
      throw new Error('Cannot rebuild: session not initialized');
    }

    let latestSession = this.session;

    for (;;) {
      const newSession = await this.withWorkingDirectory(latestSession.baseDir, () =>
        this.buildSession(
          latestSession.baseDir,
          [...latestSession.sourceGlobs.input],
          [...latestSession.sourceGlobs.features],
          latestSession.tagRegistryOverride,
        ),
      );
      this.session = newSession;
      latestSession = newSession;

      if (!this.consumePendingRebuild()) {
        return latestSession;
      }
    }
  }

  private consumePendingRebuild(): boolean {
    const pendingRebuild = this.pendingRebuild;
    this.pendingRebuild = false;
    return pendingRebuild;
  }

  private async buildSession(
    baseDir: string,
    input: readonly string[],
    features: readonly string[],
    tagRegistryOverride?: TagRegistry,
  ): Promise<PipelineSession> {
    const startMs = Date.now();
    const discoveredConfigPath = await findConfigFile(baseDir);
    const loadedConfig = await loadProjectConfig(baseDir);
    const resolvedConfig = loadedConfig.ok ? loadedConfig.value : undefined;
    const exclude = resolvedConfig?.project.sources.exclude ?? [];
    const configPath =
      resolvedConfig?.configPath ??
      discoveredConfigPath ??
      path.join(baseDir, 'architect.config.ts');

    const result = await buildPatternGraph({
      input,
      features,
      baseDir,
      mergeConflictStrategy: 'fatal',
      ...(exclude.length > 0 ? { exclude } : {}),
      ...(tagRegistryOverride !== undefined ? { tagRegistry: tagRegistryOverride } : {}),
    });

    if (!result.ok) {
      throw new Error(`Pipeline error [${result.error.step}]: ${result.error.message}`);
    }

    const pipelineResult: BuildResult = result.value;
    const dataset = pipelineResult.graph;
    const api = createPatternGraphAPI(dataset);
    const buildTimeMs = Date.now() - startMs;

    return {
      dataset,
      api,
      registry: dataset.tagRegistry,
      ...(tagRegistryOverride !== undefined ? { tagRegistryOverride } : {}),
      baseDir,
      configPath,
      packageResolver: createPackageResolver(resolvedConfig?.project.packages ?? []),
      ...(resolvedConfig?.project.project !== undefined
        ? { projectMetadata: resolvedConfig.project.project }
        : {}),
      ...(resolvedConfig?.project.tagExampleOverrides !== undefined
        ? { tagExampleOverrides: resolvedConfig.project.tagExampleOverrides }
        : {}),
      sourceGlobs: {
        input,
        features,
        ...(exclude.length > 0 ? { exclude } : {}),
      },
      buildTimeMs,
      diagnostics: pipelineResult.diagnostics,
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

  private async withWorkingDirectory<T>(baseDir: string, operation: () => Promise<T>): Promise<T> {
    const previousCwd = process.cwd();
    if (previousCwd === baseDir) {
      return operation();
    }

    process.chdir(baseDir);
    try {
      return await operation();
    } finally {
      process.chdir(previousCwd);
    }
  }
}
