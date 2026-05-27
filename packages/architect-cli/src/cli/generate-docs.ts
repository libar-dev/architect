#!/usr/bin/env node

import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  BoundaryParseError,
  buildPatternGraph,
  type BuildResult,
  createDefaultResolvedConfig,
  findConfigFile,
  isProjectConfig,
  loadProjectConfig,
  parseAtBoundary,
  resolveInvocationDir,
  resolveProjectConfig,
  resolveWorkspaceSources,
  type ResolvedConfig,
} from '@libar-dev/architect-core';
import {
  ProjectionFilterSchema,
  ProgressiveDisclosureLevelSchema,
  SUPPORTED_DOCUMENTATION_TYPE_REGISTRY,
  parseAndProjectDocumentationBundle,
  renderMarkdown,
  type Fragment,
  type ProgressiveDisclosureLevel,
  type ProjectionFilter,
  type ProjectionBundle,
  type ProjectionContext,
  type SupportedDocumentationType,
  type SupportedDocumentationTypeMetadata,
} from '@libar-dev/architect-projection';
import { createPublishedEntries, upsertGeneratedDocsManifest } from './generated-docs-manifest.js';
import { readCliPackageMetadata, resolveCliBaseDirArg } from './runtime-helpers.js';
import { createCliProjectionContext } from './projection-context.js';
import { handleCliError } from './error-handler.js';

interface ParsedArgs {
  readonly help: boolean;
  readonly version: boolean;
  readonly listGenerators: boolean;
  readonly all: boolean;
  readonly baseDir: string;
  readonly input: readonly string[];
  readonly generators: readonly string[];
  readonly outputDir?: string;
  readonly overwrite: boolean;
  readonly disclosureLevel?: ProgressiveDisclosureLevel;
  readonly projectionFilter?: ProjectionFilter;
}

interface GeneratedFile {
  readonly path: string;
  readonly content: string;
}

interface GeneratedRootDocument {
  readonly title: string;
  readonly path: string;
}

interface GeneratorExecution {
  readonly generator: GeneratorDescriptor;
  readonly files: readonly GeneratedFile[];
  readonly rootDocument: GeneratedRootDocument;
}

type MarkdownProjection = Fragment | ProjectionBundle<Fragment>;

interface ProjectionGenerator {
  readonly name: string;
  readonly description: string;
  readonly kind: 'projection';
  readonly documentType: SupportedDocumentationType;
  readonly outputPath: string;
  readonly aliases: readonly string[];
}

interface IndexGenerator {
  readonly name: 'index';
  readonly description: string;
  readonly kind: 'index';
  readonly outputPath: 'INDEX.md';
  readonly aliases: readonly string[];
}

type GeneratorDescriptor = ProjectionGenerator | IndexGenerator;

const PROJECTION_GENERATORS: readonly ProjectionGenerator[] =
  SUPPORTED_DOCUMENTATION_TYPE_REGISTRY.map((metadata) => ({
    name: metadata.generatorName,
    description: `Generate ${metadata.markdownRootTarget}`,
    kind: 'projection' as const,
    documentType: metadata.key,
    outputPath: metadata.markdownRootTarget,
    aliases: metadata.generatorAliases,
  }));

const INDEX_GENERATOR: IndexGenerator = {
  name: 'index',
  description: 'Write the generated documentation index',
  kind: 'index',
  outputPath: 'INDEX.md',
  aliases: [],
};

const GENERATORS: readonly GeneratorDescriptor[] = [...PROJECTION_GENERATORS, INDEX_GENERATOR];

function renderDocumentationIndex(): string {
  const rows = SUPPORTED_DOCUMENTATION_TYPE_REGISTRY.map(
    (metadata) =>
      `| ${metadata.displayTitle} | [${metadata.markdownRootTarget}](${metadata.markdownRootTarget}) |`,
  ).join('\n');

  return `# Documentation Index

Minimal index for the reduced projection-era doc set.

| Document | Link |
| --- | --- |
${rows}
| Index | [INDEX.md](INDEX.md) |
`;
}

function splitGeneratorValue(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function parseDisclosureLevel(value: string): ProgressiveDisclosureLevel {
  return parseAtBoundary(ProgressiveDisclosureLevelSchema, value, '--disclosure');
}

function parseFilterValue(value: string): ProjectionFilter {
  const separatorIndex = value.indexOf('=');
  if (separatorIndex <= 0) {
    throw new Error('--filter requires <status>=<csv>');
  }

  const axis = value.slice(0, separatorIndex);
  const tokens = value
    .slice(separatorIndex + 1)
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  const rawFilter = { [axis]: tokens };
  return parseAtBoundary(ProjectionFilterSchema, rawFilter, '--filter');
}

function mergeProjectionFilter(
  current: ProjectionFilter | undefined,
  next: ProjectionFilter,
): ProjectionFilter {
  return parseAtBoundary(
    ProjectionFilterSchema,
    {
      ...(current?.status !== undefined || next.status !== undefined
        ? { status: [...(current?.status ?? []), ...(next.status ?? [])] }
        : {}),
    },
    '--filter',
  );
}

async function withWorkingDirectory<T>(directory: string, operation: () => Promise<T>): Promise<T> {
  const previousCwd = process.cwd();
  process.chdir(directory);

  try {
    return await operation();
  } finally {
    process.chdir(previousCwd);
  }
}

function isWorkspaceConfigFallbackTarget(baseDir: string): boolean {
  const workspaceSources = resolveWorkspaceSources(baseDir);
  return workspaceSources.input.length > 0 && workspaceSources.features.length > 0;
}

async function loadGenerationConfig(baseDir: string): Promise<ResolvedConfig> {
  const configPath = await findConfigFile(baseDir);
  if (configPath === null) {
    return createDefaultResolvedConfig();
  }

  const rawConfig = await withWorkingDirectory(baseDir, async () => {
    const imported = (await import(pathToFileURL(configPath).href)) as { default?: unknown };
    return imported.default;
  });

  if (rawConfig === undefined || rawConfig === null || !isProjectConfig(rawConfig)) {
    throw new Error(`Invalid project config: ${configPath}`);
  }

  const config = await withWorkingDirectory(baseDir, () => loadProjectConfig(baseDir));
  if (config.ok) {
    return config.value;
  }

  if (!isWorkspaceConfigFallbackTarget(baseDir)) {
    return resolveProjectConfig(rawConfig, { configPath });
  }

  return resolveProjectConfig(rawConfig, { configPath });
}

function parseArgs(argv: readonly string[]): ParsedArgs {
  const args = argv.filter((arg) => arg !== '--');
  const invocationDir = resolveInvocationDir();
  let help = false;
  let version = false;
  let listGenerators = false;
  let all = false;
  let baseDir = invocationDir;
  const input: string[] = [];
  let outputDir: string | undefined;
  let overwrite = false;
  const generators: string[] = [];
  let disclosureLevel: ProgressiveDisclosureLevel | undefined;
  let projectionFilter: ProjectionFilter | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === undefined) {
      continue;
    }

    const next = args[index + 1];
    switch (arg) {
      case '-h':
      case '--help':
        help = true;
        break;
      case '-v':
      case '--version':
        version = true;
        break;
      case '--list-generators':
        listGenerators = true;
        break;
      case '--all':
        all = true;
        break;
      case '-b':
      case '--base-dir':
        if (next === undefined || next.startsWith('-')) {
          throw new Error(`${arg} requires a value`);
        }
        baseDir = resolveCliBaseDirArg(next);
        index += 1;
        break;
      case '-g':
      case '--generators':
        if (next === undefined || next.startsWith('-')) {
          throw new Error(`${arg} requires a value`);
        }
        generators.push(...splitGeneratorValue(next));
        index += 1;
        break;
      case '-i':
      case '--input':
        if (next === undefined || next.startsWith('-')) {
          throw new Error(`${arg} requires a value`);
        }
        input.push(next);
        index += 1;
        break;
      case '-o':
      case '--output':
        if (next === undefined || next.startsWith('-')) {
          throw new Error(`${arg} requires a value`);
        }
        outputDir = next;
        index += 1;
        break;
      case '-f':
      case '--overwrite':
      case '--force':
        overwrite = true;
        break;
      case '--disclosure':
        if (next === undefined || next.startsWith('-')) {
          throw new Error(`${arg} requires a value`);
        }
        disclosureLevel = parseDisclosureLevel(next);
        index += 1;
        break;
      case '--filter':
        if (next === undefined || next.startsWith('-')) {
          throw new Error(`${arg} requires a value`);
        }
        projectionFilter = mergeProjectionFilter(projectionFilter, parseFilterValue(next));
        index += 1;
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  return {
    help,
    version,
    listGenerators,
    all,
    baseDir,
    input,
    generators,
    ...(outputDir !== undefined ? { outputDir } : {}),
    overwrite,
    ...(disclosureLevel !== undefined ? { disclosureLevel } : {}),
    ...(projectionFilter !== undefined ? { projectionFilter } : {}),
  };
}

function printHelp(): void {
  process.stdout.write(
    'architect-generate\n\n' +
      'Usage:\n' +
      '  architect-generate --list-generators [--base-dir <dir>]\n' +
      '  architect-generate --all [-o <dir>] [-f] [--base-dir <dir>]\n' +
      '  architect-generate [-g <generator>]... [-o <dir>] [-f] [--base-dir <dir>]\n' +
      '  architect-generate --help\n' +
      '  architect-generate --version\n\n' +
      'Options:\n' +
      '  -b, --base-dir <dir>   Resolve architect.config from this directory (default: cwd)\n' +
      '  -i, --input <glob>     TypeScript source glob (repeatable)\n' +
      '      --all              Run every registered generator (all document types + index)\n' +
      '  -g, --generators <id>  Run specific generator(s); repeatable and comma-separated\n' +
      '  -o, --output <dir>     Override the config output directory for this run\n' +
      '  -f, --overwrite        Overwrite existing files for this run\n' +
      '      --disclosure <level>  Override disclosure level: essential, important, useful, advanced\n' +
      '      --filter <status=csv> Filter generated projections; repeatable for status\n' +
      '      --list-generators  List generators available for the resolved project config\n' +
      '  -h, --help             Show help\n' +
      '  -v, --version          Show version\n\n' +
      'Examples:\n' +
      '  architect-generate -g business-rules --disclosure useful --filter status=active,completed\n' +
      '  architect-generate --filter status=completed\n',
  );
}

function printVersion(): void {
  const pkg = readCliPackageMetadata();
  process.stdout.write(`architect-generate (${pkg.name}) v${pkg.version}\n`);
}

function resolveRequestedGenerators(requested: readonly string[]): readonly GeneratorDescriptor[] {
  const resolved = new Map<string, GeneratorDescriptor>();

  for (const name of requested) {
    const descriptor = GENERATORS.find(
      (candidate) => candidate.name === name || candidate.aliases.includes(name),
    );
    if (descriptor === undefined) {
      throw new Error(
        `Unknown generator: ${name}. Supported generators: ${GENERATORS.map((entry) => entry.name).join(', ')}`,
      );
    }

    if (!resolved.has(descriptor.name)) {
      resolved.set(descriptor.name, descriptor);
    }
  }

  return [...resolved.values()];
}

async function buildGraph(config: ResolvedConfig, baseDir: string): Promise<BuildResult> {
  const result = await buildPatternGraph({
    input: [...config.project.sources.typescript],
    features: [...config.project.sources.features],
    baseDir,
    mergeConflictStrategy: 'fatal',
    tagRegistry: config.instance.registry,
    ...(config.project.sources.exclude.length > 0
      ? { exclude: [...config.project.sources.exclude] }
      : {}),
  });

  if (!result.ok) {
    throw new Error(`Pipeline error [${result.error.step}]: ${result.error.message}`);
  }

  return result.value;
}

function renderProjectionDocument(
  context: ProjectionContext,
  generator: ProjectionGenerator,
  disclosureLevel: ProgressiveDisclosureLevel | undefined,
): { files: readonly GeneratedFile[]; rootDocument: GeneratedRootDocument } {
  const projection = buildDocumentationProjection(context, generator.documentType, disclosureLevel);
  const rendered = renderMarkdown(projection, {
    includeChildren: true,
    includeFrontmatter: true,
    splitStrategy: 'never',
    ...(disclosureLevel !== undefined ? { disclosureLevel } : {}),
  });

  const rootPath = generator.outputPath;
  const files =
    typeof rendered === 'string'
      ? [{ path: generator.outputPath, content: rendered }]
      : Object.entries(rendered)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([filePath, content]) => ({ path: filePath, content }));

  return {
    files,
    rootDocument: {
      title: deriveGeneratedDocumentTitle(rootPath),
      path: rootPath,
    },
  };
}

function renderIndexDocument(): {
  files: readonly GeneratedFile[];
  rootDocument: GeneratedRootDocument;
} {
  return {
    files: [{ path: 'INDEX.md', content: renderDocumentationIndex() }],
    rootDocument: {
      title: 'INDEX',
      path: 'INDEX.md',
    },
  };
}

function buildDocumentationProjection(
  context: ProjectionContext,
  documentType: SupportedDocumentationType,
  disclosureLevel: ProgressiveDisclosureLevel | undefined,
): MarkdownProjection {
  getProjectionGeneratorMetadata(documentType);
  return parseAndProjectDocumentationBundle(context, {
    documentType,
    ...(disclosureLevel !== undefined ? { disclosureLevel } : {}),
  });
}

function getProjectionGeneratorMetadata(
  documentType: SupportedDocumentationType,
): SupportedDocumentationTypeMetadata {
  const metadata = SUPPORTED_DOCUMENTATION_TYPE_REGISTRY.find(
    (entry) => entry.key === documentType,
  );

  if (metadata === undefined) {
    throw new Error(`Unsupported documentation type: ${documentType}`);
  }

  return metadata;
}

function deriveGeneratedDocumentTitle(filePath: string): string {
  const basename = path.basename(filePath).replace(/\.md$/i, '');
  return basename.length > 0 ? basename : filePath;
}

function resolveOutputDirectory(
  config: ResolvedConfig,
  args: ParsedArgs,
  generatorName: string,
  baseDir: string,
): string {
  const configuredOutputDir =
    args.outputDir ??
    config.project.generatorOverrides[generatorName]?.outputDirectory ??
    config.project.output.directory;

  return path.resolve(baseDir, configuredOutputDir);
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function writeGeneratedFiles(
  outputDir: string,
  files: readonly GeneratedFile[],
  overwrite: boolean,
): Promise<void> {
  for (const file of files) {
    const absolutePath = path.resolve(outputDir, file.path);
    await mkdir(path.dirname(absolutePath), { recursive: true });

    if (!overwrite && (await pathExists(absolutePath))) {
      throw new Error(`File already exists: ${file.path}. Re-run with --overwrite to replace it.`);
    }

    await writeFile(absolutePath, file.content, 'utf8');
  }
}

function renderGeneratorExecution(
  context: ProjectionContext,
  generator: GeneratorDescriptor,
  disclosureLevel: ProgressiveDisclosureLevel | undefined,
): GeneratorExecution {
  if (generator.kind === 'projection') {
    const projectionResult = renderProjectionDocument(context, generator, disclosureLevel);
    return {
      generator,
      files: projectionResult.files,
      rootDocument: projectionResult.rootDocument,
    };
  }

  const indexResult = renderIndexDocument();
  return {
    generator,
    files: indexResult.files,
    rootDocument: indexResult.rootDocument,
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  if (args.version) {
    printVersion();
    return;
  }

  const config = await loadGenerationConfig(args.baseDir);
  const effectiveConfig: ResolvedConfig =
    args.input.length > 0
      ? {
          ...config,
          project: {
            ...config.project,
            sources: {
              ...config.project.sources,
              typescript: [...args.input],
            },
          },
        }
      : config;

  if (args.listGenerators) {
    for (const generator of GENERATORS) {
      process.stdout.write(`${generator.name}\t${generator.description}\n`);
    }
    return;
  }

  if (effectiveConfig.project.sources.typescript.length === 0) {
    throw new Error('No source files specified');
  }

  const requestedGeneratorNames = args.all
    ? GENERATORS.map((generator) => generator.name)
    : args.generators.length > 0
      ? args.generators
      : effectiveConfig.project.generators;
  const requestedGenerators = resolveRequestedGenerators(requestedGeneratorNames);
  const build = await buildGraph(effectiveConfig, args.baseDir);
  const projectionContext = createCliProjectionContext({
    graph: build.graph,
    packageEntries: effectiveConfig.project.packages,
    ...(args.projectionFilter !== undefined ? { projectionFilter: args.projectionFilter } : {}),
    ...(effectiveConfig.project.project !== undefined
      ? { projectMetadata: effectiveConfig.project.project }
      : {}),
    ...(effectiveConfig.project.tagExampleOverrides !== undefined
      ? { tagExampleOverrides: effectiveConfig.project.tagExampleOverrides }
      : {}),
  });
  const overwrite = args.overwrite || effectiveConfig.project.output.overwrite;

  // Phase 1: render each generator's projection. Rendering is synchronous
  // and pure on the projection context, so this is a plain map. Write and
  // manifest phases below parallelise the IO work.
  const executions = requestedGenerators.map((generator) => {
    const execution = renderGeneratorExecution(projectionContext, generator, args.disclosureLevel);
    const outputDir = resolveOutputDirectory(effectiveConfig, args, generator.name, args.baseDir);
    return { execution, outputDir };
  });

  // Guardrail: detect file-path collisions across generators. With the old
  // sequential loop a later generator could silently overwrite an earlier
  // generator's output; with parallel writes that same case would race.
  // Fail loudly either way.
  const seenAbsolutePaths = new Map<string, string>();
  for (const { execution, outputDir } of executions) {
    for (const file of execution.files) {
      const absolute = path.resolve(outputDir, file.path);
      const prior = seenAbsolutePaths.get(absolute);
      if (prior !== undefined && prior !== execution.generator.name) {
        throw new Error(
          `File-path collision: ${absolute} would be written by both ${prior} and ${execution.generator.name}`,
        );
      }
      seenAbsolutePaths.set(absolute, execution.generator.name);
    }
  }

  // Phase 2: write files in parallel. Each generator's file set is disjoint
  // (verified above), so concurrent writes are safe.
  await Promise.all(
    executions.map(({ execution, outputDir }) =>
      writeGeneratedFiles(outputDir, execution.files, overwrite),
    ),
  );

  // Phase 3: upsert the generated-docs manifest sequentially per outputDir.
  // The manifest is a read-modify-write JSON file; multiple generators that
  // target the same outputDir would race if parallelised. Group by outputDir
  // so cross-directory manifests stay parallel.
  const byOutputDir = new Map<string, typeof executions>();
  for (const entry of executions) {
    const existing = byOutputDir.get(entry.outputDir);
    if (existing === undefined) {
      byOutputDir.set(entry.outputDir, [entry]);
    } else {
      existing.push(entry);
    }
  }
  await Promise.all(
    [...byOutputDir.values()].map(async (group) => {
      for (const { execution, outputDir } of group) {
        await upsertGeneratedDocsManifest({
          outputDir,
          generatorName: execution.generator.name,
          kind: execution.generator.kind,
          rootPath: execution.rootDocument.path,
          entries: createPublishedEntries(
            execution.rootDocument.path,
            execution.files.map((file) => file.path),
          ),
          ...(execution.generator.kind === 'projection'
            ? { documentType: execution.generator.documentType }
            : {}),
          pruneStaleFiles: overwrite,
        });
      }
    }),
  );

  // Deterministic summary: generators in user-requested order, output
  // directories sorted.
  const fileCount = executions.reduce((total, { execution }) => total + execution.files.length, 0);
  const outputDirs = [...new Set(executions.map((entry) => entry.outputDir))].sort();
  const generatorList = requestedGenerators.map((generator) => generator.name).join(', ');

  process.stdout.write(
    `Generated ${String(fileCount)} files from ${String(build.graph.counts.total)} patterns using ${generatorList} in ${outputDirs.join(', ')}.\n`,
  );
}

void main().catch((error: unknown) => {
  handleCliError(error, error instanceof BoundaryParseError ? 2 : 1);
});
