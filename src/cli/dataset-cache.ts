/**
 * @libar-docs
 * @libar-docs-cli
 * @libar-docs-pattern DatasetCache
 * @libar-docs-status active
 * @libar-docs-implements DataAPICLIErgonomics
 * @libar-docs-arch-role infrastructure
 * @libar-docs-arch-context cli
 * @libar-docs-arch-layer infrastructure
 * @libar-docs-uses PipelineFactory, WorkflowConfigSchema
 *
 * ## Dataset Cache - MasterDataset Persistence with mtime Invalidation
 *
 * Caches the full PipelineResult (MasterDataset + ValidationSummary + warnings)
 * to a JSON file. Subsequent CLI invocations skip the 2-5s pipeline rebuild
 * when no source files have changed.
 *
 * ### Design Decisions
 *
 * - DD-1: Excludes LoadedWorkflow (contains Maps), reconstructs on load via createLoadedWorkflow()
 * - DD-2: Cache at node_modules/.cache/delivery-process/dataset.json
 * - DD-3: Cache key = sha256(sorted file mtimes + pipeline options hash)
 * - DD-4: All errors produce cache miss (never throw)
 */

import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { glob } from 'glob';
import type { PipelineResult, PipelineOptions } from '../generators/pipeline/index.js';
import type { RuntimeMasterDataset } from '../generators/pipeline/index.js';
import type { WorkflowConfig } from '../validation-schemas/workflow-config.js';
import { createLoadedWorkflow } from '../validation-schemas/workflow-config.js';

// =============================================================================
// Types
// =============================================================================

interface CacheMetadata {
  readonly key: string;
  readonly timestamp: string;
  readonly version: string;
}

interface CachedPipelineData {
  readonly metadata: CacheMetadata;
  readonly dataset: unknown;
  readonly workflowConfig: WorkflowConfig | null;
  readonly validation: PipelineResult['validation'];
  readonly warnings: PipelineResult['warnings'];
  readonly scanMetadata: PipelineResult['scanMetadata'];
}

/** Cache format version — bump when the serialization format changes. */
const CACHE_VERSION = '1';

// =============================================================================
// Public API
// =============================================================================

/**
 * Resolve the cache directory for a given base directory.
 */
export function getCacheDir(baseDir: string): string {
  return path.join(path.resolve(baseDir), 'node_modules', '.cache', 'delivery-process');
}

/**
 * Compute a cache key from pipeline options and source file mtimes.
 *
 * The key captures:
 * - Sorted list of source files with their modification times
 * - Pipeline options that affect output (input patterns, features, baseDir, workflowPath)
 *
 * Any change to source files or pipeline config produces a different key.
 */
export async function computeCacheKey(opts: PipelineOptions): Promise<string> {
  const baseDir = path.resolve(opts.baseDir);
  const hash = crypto.createHash('sha256');

  // Hash pipeline options that affect dataset output
  hash.update(
    JSON.stringify({
      input: opts.input,
      features: opts.features,
      baseDir,
      workflowPath: opts.workflowPath ?? null,
      mergeConflictStrategy: opts.mergeConflictStrategy,
      includeValidation: opts.includeValidation ?? true,
    })
  );

  // Resolve glob patterns to file lists and collect mtimes
  const fileMtimes: string[] = [];

  for (const pattern of [...opts.input, ...opts.features]) {
    const files = await glob(pattern, { cwd: baseDir, absolute: true });
    for (const file of files.sort()) {
      try {
        const stat = await fsp.stat(file);
        fileMtimes.push(`${file}:${stat.mtimeMs}`);
      } catch {
        // File disappeared between glob and stat — include as changed
        fileMtimes.push(`${file}:missing`);
      }
    }
  }

  // Also include config file mtime if it exists
  const configPath = path.join(baseDir, 'delivery-process.config.ts');
  try {
    const configStat = await fsp.stat(configPath);
    fileMtimes.push(`${configPath}:${configStat.mtimeMs}`);
  } catch {
    // No config file — include sentinel
    fileMtimes.push(`${configPath}:absent`);
  }

  hash.update(fileMtimes.join('\n'));
  return hash.digest('hex');
}

/**
 * Attempt to load a cached PipelineResult.
 *
 * Returns `undefined` on any error (corrupt cache, key mismatch, etc.).
 * Never throws — the caller should fall back to running the full pipeline.
 */
export async function tryLoadCache(
  cacheKey: string,
  cacheDir: string
): Promise<{ result: PipelineResult; ageMs: number } | undefined> {
  try {
    const cachePath = path.join(cacheDir, 'dataset.json');
    const raw = await fsp.readFile(cachePath, 'utf-8');
    const cached: CachedPipelineData = JSON.parse(raw) as CachedPipelineData;

    // Validate cache version and key
    if (cached.metadata.version !== CACHE_VERSION) return undefined;
    if (cached.metadata.key !== cacheKey) return undefined;

    // Reconstruct RuntimeMasterDataset from plain MasterDataset + WorkflowConfig
    const dataset = cached.dataset as RuntimeMasterDataset;
    if (cached.workflowConfig !== null) {
      const workflow = createLoadedWorkflow(cached.workflowConfig);
      // Assign workflow back onto the deserialized dataset (Maps are not JSON-serializable)
      Object.assign(dataset, { workflow });
    }

    const ageMs = Date.now() - new Date(cached.metadata.timestamp).getTime();

    return {
      result: {
        dataset,
        validation: cached.validation,
        warnings: cached.warnings,
        scanMetadata: cached.scanMetadata,
      },
      ageMs,
    };
  } catch {
    return undefined;
  }
}

/**
 * Write a PipelineResult to the cache file.
 *
 * Strips the non-serializable `workflow` field and stores the `WorkflowConfig`
 * separately for reconstruction on load. Uses atomic write (tmp + rename).
 *
 * Never throws — cache write failures are silently ignored.
 */
export async function writeCache(
  result: PipelineResult,
  cacheKey: string,
  cacheDir: string
): Promise<void> {
  try {
    await fsp.mkdir(cacheDir, { recursive: true });

    // Extract WorkflowConfig (serializable) from LoadedWorkflow (has Maps)
    const workflowConfig: WorkflowConfig | null = result.dataset.workflow?.config ?? null;

    // Strip the non-serializable workflow field from the dataset
    const { workflow: _workflow, ...serializableDataset } = result.dataset;

    const cacheData: CachedPipelineData = {
      metadata: {
        key: cacheKey,
        timestamp: new Date().toISOString(),
        version: CACHE_VERSION,
      },
      dataset: serializableDataset,
      workflowConfig,
      validation: result.validation,
      warnings: result.warnings,
      scanMetadata: result.scanMetadata,
    };

    const cachePath = path.join(cacheDir, 'dataset.json');
    const tmpPath = `${cachePath}.tmp`;

    await fsp.writeFile(tmpPath, JSON.stringify(cacheData), 'utf-8');
    await fsp.rename(tmpPath, cachePath);
  } catch {
    // Cache write failure is not fatal — next run will rebuild
  }
}

/**
 * Check whether a cache file exists (for dry-run reporting).
 */
export function cacheFileExists(cacheDir: string): { exists: boolean; sizeBytes?: number } {
  try {
    const cachePath = path.join(cacheDir, 'dataset.json');
    const stat = fs.statSync(cachePath);
    return { exists: true, sizeBytes: stat.size };
  } catch {
    return { exists: false };
  }
}
