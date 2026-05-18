import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  buildPatternGraph,
  createArchitect,
  createPackageResolver,
  createPatternGraphAPI,
  findConfigFile,
  findFilesToScan,
  formatConfigError,
  loadProjectConfig,
  resolveWorkspaceSources,
  WORKSPACE_TAG_REGISTRY,
  PatternGraphSchema,
  type BuildResult,
  type QueryMetadataExtra,
  type TagRegistry,
} from '@libar-dev/architect-core';
import type { ProjectionContext } from '@libar-dev/architect-projection';
import { createValidationMetadata, stringifyJsonValue } from './commands/_shared/output.js';
import {
  CacheRecordSchema,
  type CacheRecord,
  type CliContext,
  type ParsedArgs,
  type SourcePlan,
} from './pattern-graph-cli-types.js';

const CACHE_DIRECTORY = path.join(os.tmpdir(), 'architect-cli-cache');

async function resolveSourcePlan(args: ParsedArgs): Promise<SourcePlan> {
  const workspaceSources = resolveWorkspaceSources(args.baseDir);
  const hasWorkspaceSources =
    workspaceSources.input.length > 0 || workspaceSources.features.length > 0;
  const configPath = await findConfigFile(args.baseDir);
  const configResult = await loadProjectConfig(args.baseDir);

  if (!configResult.ok && configPath !== null && !hasWorkspaceSources) {
    throw new Error(formatConfigError(configResult.error));
  }

  const config = configResult.ok ? configResult.value : undefined;
  const input = [...args.input];
  const features = [...args.features];

  if (input.length === 0) {
    if (hasWorkspaceSources) {
      input.push(...workspaceSources.input);
    } else if (config !== undefined) {
      input.push(...config.project.sources.typescript);
    }
  }

  if (features.length === 0) {
    if (hasWorkspaceSources) {
      features.push(...workspaceSources.features);
    } else if (config !== undefined) {
      features.push(...config.project.sources.features);
    }
  }

  if (input.length === 0) {
    throw new Error(
      'No source files specified. Provide --input <glob> or configure architect.config.* sources.',
    );
  }

  return {
    baseDir: args.baseDir,
    input,
    features,
    exclude: config?.project.sources.exclude ?? [],
    tagRegistry:
      config?.instance.registry ?? (hasWorkspaceSources ? WORKSPACE_TAG_REGISTRY : undefined),
    configLabel: configPath !== null ? `${path.basename(configPath)} (auto-detected)` : 'none',
    packages: config?.project.packages ?? [],
  };
}

async function findSourceFiles(sourcePlan: SourcePlan): Promise<readonly string[]> {
  const typescriptFiles = await findFilesToScan({
    patterns: [...sourcePlan.input],
    baseDir: sourcePlan.baseDir,
    ...(sourcePlan.exclude.length > 0 ? { exclude: [...sourcePlan.exclude] } : {}),
  });

  if (sourcePlan.features.length === 0) {
    return [...typescriptFiles].sort();
  }

  const featureFiles = await findFilesToScan({
    patterns: [...sourcePlan.features],
    baseDir: sourcePlan.baseDir,
    ...(sourcePlan.exclude.length > 0 ? { exclude: [...sourcePlan.exclude] } : {}),
  });

  return [...new Set([...typescriptFiles, ...featureFiles])].sort();
}

function getCacheFilePath(sourcePlan: SourcePlan): string {
  const key = createHash('sha1')
    .update(
      [
        sourcePlan.baseDir,
        ...sourcePlan.input.map((entry) => `input:${entry}`),
        ...sourcePlan.features.map((entry) => `feature:${entry}`),
      ].join('\n'),
    )
    .digest('hex');
  return path.join(CACHE_DIRECTORY, `${key}.json`);
}

async function computeSourceSignature(sourcePlan: SourcePlan): Promise<string> {
  const files = await findSourceFiles(sourcePlan);
  const signature = files
    .map((filePath) => {
      const stats = fs.statSync(filePath);
      return `${path.relative(sourcePlan.baseDir, filePath)}:${String(stats.mtimeMs)}`;
    })
    .join('\n');
  return createHash('sha1').update(signature).digest('hex');
}

function readCacheRecord(cacheFilePath: string): CacheRecord | null {
  if (!fs.existsSync(cacheFilePath)) {
    return null;
  }

  try {
    return CacheRecordSchema.parse(JSON.parse(fs.readFileSync(cacheFilePath, 'utf8')));
  } catch {
    return null;
  }
}

function writeCacheRecord(cacheFilePath: string, record: CacheRecord): void {
  fs.mkdirSync(path.dirname(cacheFilePath), { recursive: true });
  fs.writeFileSync(cacheFilePath, `${stringifyJsonValue(record)}\n`, 'utf8');
}

function createProjectionContext(
  graph: BuildResult['graph'],
  sourcePlan: SourcePlan,
): ProjectionContext {
  return {
    graph,
    packageResolver: createPackageResolver(sourcePlan.packages),
  };
}

async function resolveTagRegistryForTaxonomy(args: ParsedArgs): Promise<TagRegistry> {
  const workspaceSources = resolveWorkspaceSources(args.baseDir);
  const hasWorkspaceSources =
    workspaceSources.input.length > 0 || workspaceSources.features.length > 0;
  const configPath = await findConfigFile(args.baseDir);
  const configResult = await loadProjectConfig(args.baseDir);

  if (!configResult.ok && configPath !== null && !hasWorkspaceSources) {
    throw new Error(formatConfigError(configResult.error));
  }

  if (configResult.ok) {
    return configResult.value.instance.registry;
  }

  if (hasWorkspaceSources) {
    return WORKSPACE_TAG_REGISTRY;
  }

  return createArchitect().registry;
}

export async function buildTaxonomyProjectionContext(args: ParsedArgs): Promise<ProjectionContext> {
  const tagRegistry = await resolveTagRegistryForTaxonomy(args);

  const graph: ProjectionContext['graph'] = {
    patterns: [],
    tagRegistry: { ...tagRegistry, $schema: tagRegistry.$schema ?? '' },
    byStatus: { candidate: [], roadmap: [], active: [], completed: [], deferred: [] },
    byNormalizedStatus: { completed: [], active: [], planned: [], candidate: [] },
    byMaturity: {},
    byPhase: [],
    byQuarter: {},
    byRole: {},
    bySourceType: { typescript: [], gherkin: [], roadmap: [], prd: [] },
    byProductArea: {},
    counts: { completed: 0, active: 0, planned: 0, candidate: 0, total: 0 },
    phaseCount: 0,
    roleCount: 0,
    relationshipIndex: {},
  };

  PatternGraphSchema.parse(graph);

  return {
    graph,
    packageResolver: createPackageResolver([]),
  };
}

export async function buildCliContext(args: ParsedArgs): Promise<CliContext> {
  const sourcePlan = await resolveSourcePlan(args);
  const cacheFilePath = getCacheFilePath(sourcePlan);
  let cacheMetadata: QueryMetadataExtra['cache'] = { hit: false };
  let signature: string | null = null;

  if (!args.noCache) {
    signature = await computeSourceSignature(sourcePlan);
    const record = readCacheRecord(cacheFilePath);
    if (record !== null && record.signature === signature) {
      cacheMetadata = {
        hit: true,
        ageMs: Math.max(0, Date.now() - record.createdAt),
      };
    }
  }

  const start = Date.now();
  const result = await buildPatternGraph({
    input: [...sourcePlan.input],
    features: [...sourcePlan.features],
    baseDir: sourcePlan.baseDir,
    mergeConflictStrategy: 'fatal',
    ...(sourcePlan.exclude.length > 0 ? { exclude: [...sourcePlan.exclude] } : {}),
    ...(sourcePlan.tagRegistry !== undefined ? { tagRegistry: sourcePlan.tagRegistry } : {}),
  });

  if (!result.ok) {
    throw new Error(`Pipeline error [${result.error.step}]: ${result.error.message}`);
  }

  const pipelineMs = Date.now() - start;

  if (!args.noCache && signature !== null) {
    writeCacheRecord(cacheFilePath, { createdAt: Date.now(), signature });
  }

  return {
    args,
    sourcePlan,
    build: result.value,
    graph: result.value.graph,
    api: createPatternGraphAPI(result.value.graph),
    projection: createProjectionContext(result.value.graph, sourcePlan),
    metadata: {
      validation: createValidationMetadata(result.value),
      cache: cacheMetadata,
      pipelineMs,
    },
  };
}

export async function writeDryRun(args: ParsedArgs): Promise<void> {
  const sourcePlan = await resolveSourcePlan(args);
  const typescriptFiles = await findFilesToScan({
    patterns: [...sourcePlan.input],
    baseDir: sourcePlan.baseDir,
    ...(sourcePlan.exclude.length > 0 ? { exclude: [...sourcePlan.exclude] } : {}),
  });
  const featureFiles =
    sourcePlan.features.length > 0
      ? await findFilesToScan({
          patterns: [...sourcePlan.features],
          baseDir: sourcePlan.baseDir,
          ...(sourcePlan.exclude.length > 0 ? { exclude: [...sourcePlan.exclude] } : {}),
        })
      : [];

  process.stdout.write(
    'DRY RUN\n' +
      `TypeScript files: ${String(typescriptFiles.length)}\n` +
      `Feature files: ${String(featureFiles.length)}\n` +
      `Config: ${sourcePlan.configLabel}\n` +
      `Cache: ${args.noCache ? 'disabled (--no-cache)' : 'available'}\n`,
  );
}
