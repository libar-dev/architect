#!/usr/bin/env node

import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
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
  applyManagedRegions,
  ProjectionFilterSchema,
  ProgressiveDisclosureLevelSchema,
  projectTaxonomyEmbeddedShapes,
  renderTaxonomyManagedRegion,
  SUPPORTED_DOCUMENTATION_TYPE_REGISTRY,
  TAXONOMY_EMBEDDED_GENERATORS,
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
import {
  applyGeneratedDocsManifestUpsert,
  createPublishedEntries,
  EMPTY_GENERATED_DOCS_MANIFEST,
  GENERATED_DOCS_MANIFEST_FILENAME,
  loadGeneratedDocsManifest,
  resolveGeneratedDocsManifestPath,
  serializeGeneratedDocsManifest,
  upsertGeneratedDocsManifest,
} from './generated-docs-manifest.js';
import { readCliPackageMetadata, resolveCliBaseDirArg } from './runtime-helpers.js';
import { createCliProjectionContext } from './projection-context.js';
import { handleCliError } from './error-handler.js';

interface ParsedArgs {
  readonly help: boolean;
  readonly version: boolean;
  readonly listGenerators: boolean;
  readonly all: boolean;
  readonly check: boolean;
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
  readonly generator: ProjectionGenerator | IndexGenerator;
  readonly files: readonly GeneratedFile[];
  readonly rootDocument: GeneratedRootDocument;
}

/**
 * The result of rendering one embedded-region generator: the host file on disk
 * with its managed regions rewritten. `newContent` differs from `currentContent`
 * only inside the marker spans, so a `currentContent !== newContent` comparison is
 * an automatically region-scoped drift check.
 */
interface EmbeddedExecution {
  readonly generator: EmbeddedGenerator;
  readonly hostFile: string;
  readonly absolutePath: string;
  readonly currentContent: string;
  readonly newContent: string;
  readonly regionCount: number;
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

/**
 * An embedded-region generator: it does not write a whole `.md` file under the
 * output directory, it rewrites marker-bounded regions inside an authored host
 * `.md` (cluster `TaxonomyDocumentationCluster`). The host is repo-relative and
 * usually lives OUTSIDE `docs-live/`.
 */
interface EmbeddedGenerator {
  readonly name: string;
  readonly description: string;
  readonly kind: 'embedded';
  readonly hostFile: string;
  readonly aliases: readonly string[];
}

type GeneratorDescriptor = ProjectionGenerator | IndexGenerator | EmbeddedGenerator;

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

const EMBEDDED_GENERATORS: readonly EmbeddedGenerator[] = TAXONOMY_EMBEDDED_GENERATORS.map(
  (info) => ({
    name: info.name,
    description: info.description,
    kind: 'embedded' as const,
    hostFile: info.hostFile,
    aliases: [],
  }),
);

const GENERATORS: readonly GeneratorDescriptor[] = [
  ...PROJECTION_GENERATORS,
  ...EMBEDDED_GENERATORS,
  INDEX_GENERATOR,
];

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
  let check = false;
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
      case '--check':
      case '--dry-run':
        check = true;
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
    check,
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
      '      --all              Run every registered generator: all document types + index, plus\n' +
      '                         embedded-region generators that rewrite marked regions inside\n' +
      '                         authored hosts outside the output dir (formal-spec/, .agents/)\n' +
      '  -g, --generators <id>  Run specific generator(s); repeatable and comma-separated\n' +
      '  -o, --output <dir>     Override the config output directory for this run\n' +
      '  -f, --overwrite        Overwrite existing files for this run\n' +
      '      --check            Verify regenerated docs match the working tree; report drift, write nothing, exit non-zero on drift (alias --dry-run)\n' +
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

/**
 * Commit every embedded host's regenerated content as a staged temp→rename batch.
 *
 * Embedded hosts are AUTHORED files (skill `taxonomy.md`, the normative RFC) whose
 * out-of-region prose is NOT regenerable from source — unlike a `docs-live/` file, a
 * truncated or half-written host loses hand-authored content irrecoverably. A plain
 * `writeFile` truncates-then-writes, so a failed or interrupted write (disk full, a
 * sibling write rejecting the batch, a crash mid-stream) could leave a host partially
 * mutated. This stages each host to a sibling temp file and commits by `rename` only
 * AFTER every temp wrote successfully:
 *
 * - **Stage fails ⇒ nothing committed.** If any temp write rejects, all temps are
 *   removed and the run aborts having touched no authored host (fail loud, never
 *   partial — the same promise the managed-region engine makes within a host, now
 *   extended across the whole embedded-host set).
 * - **Commit is atomic per host.** `rename` of a same-directory temp over the host is
 *   atomic on POSIX, so a host is never observed truncated; a crash mid-commit leaves
 *   already-renamed hosts complete and the rest still holding their original authored
 *   content (re-running completes them — each host's content is idempotent).
 *
 * The temp lives in the host's own directory so the rename stays on one filesystem.
 */
async function commitEmbeddedHostsAtomically(
  embeddedExecutions: readonly EmbeddedExecution[],
): Promise<void> {
  if (embeddedExecutions.length === 0) {
    return;
  }
  const staged = embeddedExecutions.map((embedded) => ({
    tempPath: `${embedded.absolutePath}.${String(process.pid)}.tmp`,
    targetPath: embedded.absolutePath,
    content: embedded.newContent,
  }));

  try {
    await Promise.all(staged.map((entry) => writeFile(entry.tempPath, entry.content, 'utf8')));
  } catch (error) {
    // Stage failed: no host has been renamed yet. Remove every temp (best-effort)
    // so a failed run leaves the authored hosts and their directories untouched.
    await Promise.all(staged.map((entry) => rm(entry.tempPath, { force: true })));
    throw error;
  }

  // All temps are on disk and complete; commit each over its host.
  for (const entry of staged) {
    await rename(entry.tempPath, entry.targetPath);
  }
}

async function reportDriftAndExit(
  executions: readonly { execution: GeneratorExecution; outputDir: string }[],
  embeddedExecutions: readonly EmbeddedExecution[] = [],
): Promise<void> {
  const drift: string[] = [];
  let checked = 0;
  for (const { execution, outputDir } of executions) {
    for (const file of execution.files) {
      checked += 1;
      const absolute = path.resolve(outputDir, file.path);
      let current: string | undefined;
      try {
        current = await readFile(absolute, 'utf8');
      } catch {
        current = undefined;
      }
      if (current === undefined) {
        drift.push(`absent on disk: ${file.path}`);
      } else if (current !== file.content) {
        drift.push(`content drift: ${file.path}`);
      }
    }
  }

  // Embedded-region drift: `newContent` is the host regenerated from the live
  // digest; it differs from the on-disk `currentContent` only inside the marker
  // spans, so this comparison is automatically region-scoped — a hand-edit inside
  // a region (or a stale region the registry has moved past) fails the gate, while
  // any change to the authored voice outside the markers leaves the two equal.
  // Closes the docs-live-only coverage hole: embedded hosts live outside the
  // output directory yet are still diffed here (cluster Rule "…covered by the
  // determinism gate").
  for (const embedded of embeddedExecutions) {
    checked += 1;
    if (embedded.newContent !== embedded.currentContent) {
      drift.push(`region drift: ${embedded.hostFile}`);
    }
  }

  // The rendered files are not the whole story: `docs:all` also rewrites the
  // generated-docs manifest (Phase 3). A change that leaves every rendered file
  // byte-identical but alters the manifest — a generator's root classification,
  // documentType, or its file set (added / removed / orphaned files) — would slip
  // past a files-only check yet fail CI's `git diff --exit-code docs-live`. Fold
  // the same upserts the write path would and diff the resulting manifest, per
  // outputDir, so `--check` is a faithful proxy for the determinism gate.
  const executionsByOutputDir = new Map<string, GeneratorExecution[]>();
  for (const { execution, outputDir } of executions) {
    const group = executionsByOutputDir.get(outputDir);
    if (group === undefined) {
      executionsByOutputDir.set(outputDir, [execution]);
    } else {
      group.push(execution);
    }
  }
  for (const [outputDir, group] of executionsByOutputDir) {
    let expected = (await loadGeneratedDocsManifest(outputDir)) ?? EMPTY_GENERATED_DOCS_MANIFEST;
    for (const execution of group) {
      expected = applyGeneratedDocsManifestUpsert(expected, {
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
      });
    }
    checked += 1;
    const manifestPath = resolveGeneratedDocsManifestPath(outputDir);
    let currentManifest: string | undefined;
    try {
      currentManifest = await readFile(manifestPath, 'utf8');
    } catch {
      currentManifest = undefined;
    }
    if (currentManifest === undefined) {
      drift.push(`absent on disk: ${GENERATED_DOCS_MANIFEST_FILENAME}`);
    } else if (currentManifest !== serializeGeneratedDocsManifest(expected)) {
      drift.push(`content drift: ${GENERATED_DOCS_MANIFEST_FILENAME}`);
    }
  }

  if (drift.length > 0) {
    process.stderr.write(
      `docs:check found ${String(drift.length)} drifted file(s):\n` +
        drift.map((entry) => `  - ${entry}`).join('\n') +
        '\n',
    );
    throw new Error(
      `Documentation is not up to date (${String(drift.length)} drifted file(s)); ` +
        'regenerate with `architect-generate --all -f` and commit the drifted paths reported above ' +
        '(docs-live/ plus any embedded hosts under formal-spec/ or .agents/).',
    );
  }

  process.stdout.write(
    `docs:check: ${String(checked)} generated file(s) match the working tree — no drift.\n`,
  );
}

function renderGeneratorExecution(
  context: ProjectionContext,
  generator: ProjectionGenerator | IndexGenerator,
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

/**
 * Render one embedded-region generator: project its routed regions from the live
 * digest, read the authored host, and rewrite each region's marker span via the
 * managed-region engine. The host's authored prose is preserved byte-for-byte;
 * only inter-marker spans change.
 *
 * Host-absent handling depends on HOW the generator was requested (`skipWhenHostAbsent`):
 * under `--all` an absent host means "not applicable in this project" and is skipped
 * (returns `null`) so `--all` stays portable across repos that lack a given authored
 * host; but an EXPLICIT `-g <name>` request names that host on purpose, so an absent
 * host is a misconfiguration and **fails loud** rather than exiting 0 with nothing
 * written (a silent skip there is too easy to greenlight in CI after a bad path). A host
 * that EXISTS but lacks/​malforms its markers always throws `ManagedRegionError` (loud,
 * no partial write) regardless of mode. Throws a containment error if the resolved host
 * escapes the repo (defense in depth over the descriptor's parse-once path check).
 */
async function renderEmbeddedExecution(
  context: ProjectionContext,
  generator: EmbeddedGenerator,
  baseDir: string,
  skipWhenHostAbsent: boolean,
): Promise<EmbeddedExecution | null> {
  const [shape] = projectTaxonomyEmbeddedShapes(context, [generator.name]);
  if (shape === undefined) {
    throw new Error(`No embedded shape produced for generator: ${generator.name}`);
  }

  const baseAbsolute = path.resolve(baseDir);
  const absolutePath = path.resolve(baseDir, shape.hostFile);
  const relativeToBase = path.relative(baseAbsolute, absolutePath);
  if (relativeToBase.startsWith('..') || path.isAbsolute(relativeToBase)) {
    throw new Error(
      `Embedded host "${shape.hostFile}" resolves outside the repository root; refusing to write.`,
    );
  }

  if (!(await pathExists(absolutePath))) {
    if (!skipWhenHostAbsent) {
      throw new Error(
        `Embedded generator ${generator.name}: host ${shape.hostFile} not found. ` +
          'An explicit -g request requires the host to exist; only --all skips an absent host (portability).',
      );
    }
    process.stderr.write(
      `Skipping embedded generator ${generator.name}: host ${shape.hostFile} not found in this project.\n`,
    );
    return null;
  }
  const currentContent = await readFile(absolutePath, 'utf8');

  const regions = shape.regions.map((region) => ({
    regionId: region.regionId,
    body: renderTaxonomyManagedRegion(shape.digest, region.source),
  }));
  const newContent = applyManagedRegions(currentContent, regions, shape.hostFile);

  return {
    generator,
    hostFile: shape.hostFile,
    absolutePath,
    currentContent,
    newContent,
    regionCount: regions.length,
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
  const fileGenerators = requestedGenerators.filter(
    (generator): generator is ProjectionGenerator | IndexGenerator => generator.kind !== 'embedded',
  );
  const embeddedGenerators = requestedGenerators.filter(
    (generator): generator is EmbeddedGenerator => generator.kind === 'embedded',
  );
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

  // Phase 1: render each whole-file generator's projection. Rendering is
  // synchronous and pure on the projection context, so this is a plain map.
  // Write and manifest phases below parallelise the IO work.
  const executions = fileGenerators.map((generator) => {
    const execution = renderGeneratorExecution(projectionContext, generator, args.disclosureLevel);
    const outputDir = resolveOutputDirectory(effectiveConfig, args, generator.name, args.baseDir);
    return { execution, outputDir };
  });

  // Phase 1b: render embedded-region generators. Unlike whole-file generators
  // these read their authored host (async) and rewrite only marker-bounded
  // regions, preserving the host's authored prose byte-for-byte. A malformed or
  // missing host marker throws here (loud, no partial write) before anything is
  // committed to disk.
  const embeddedExecutions = (
    await Promise.all(
      embeddedGenerators.map((generator) =>
        renderEmbeddedExecution(projectionContext, generator, args.baseDir, args.all),
      ),
    )
  ).filter((execution): execution is EmbeddedExecution => execution !== null);

  // Guardrail: detect file-path collisions across generators. With the old
  // sequential loop a later generator could silently overwrite an earlier
  // generator's output; with parallel writes that same case would race.
  // Fail loudly either way. Embedded hosts join the same map so a host can never
  // collide with a generated whole-file target.
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
  for (const embedded of embeddedExecutions) {
    const prior = seenAbsolutePaths.get(embedded.absolutePath);
    if (prior !== undefined && prior !== embedded.generator.name) {
      throw new Error(
        `File-path collision: ${embedded.absolutePath} would be written by both ${prior} and ${embedded.generator.name}`,
      );
    }
    seenAbsolutePaths.set(embedded.absolutePath, embedded.generator.name);
  }

  // --check: prove idempotency without mutating the tree. Diff each freshly
  // rendered file (and each embedded host's regenerated regions) against its
  // on-disk counterpart and report drift, mutating nothing. Unlike
  // `git diff --exit-code docs-live`, this works mid-changeset (it compares
  // regenerated content to the working tree, not to HEAD), so a dirty tree no
  // longer conflates an uncommitted edit with a non-deterministic generator, and
  // it reaches embedded hosts that live OUTSIDE docs-live. Exits non-zero on
  // drift via handleCliError.
  if (args.check) {
    await reportDriftAndExit(executions, embeddedExecutions);
    return;
  }

  // Phase 2: write the regenerable whole-file generators in parallel. Each
  // generator's file set is disjoint (verified above), so concurrent writes are
  // safe; a `docs-live/` file is regenerable, so a failed write here is recovered
  // by re-running. This (and the manifest upsert below) run BEFORE the authored-host
  // commit, so a failure anywhere in the regenerable-output work leaves every
  // authored host untouched.
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

  // Phase 4 (LAST): commit the embedded hosts via a staged temp→rename batch.
  // Authored hosts carry hand-authored, non-regenerable prose, so mutating them is
  // the one irreversible step — it runs AFTER every fallible regenerable-output step
  // (rendering, the whole-file writes, the manifest upsert), so a failure in any of
  // those aborts before this step and leaves every authored host untouched. Within
  // this step the temps are all staged before any rename, so a staging failure
  // renames nothing (every host untouched); once renames begin each is atomic (a host
  // is never half-written), and the batch is idempotent — an interrupted commit is
  // completed by re-running, NOT rolled back, so a host already renamed stays
  // committed. See commitEmbeddedHostsAtomically.
  await commitEmbeddedHostsAtomically(embeddedExecutions);

  // Deterministic summary: generators in user-requested order, output
  // directories sorted.
  const fileCount = executions.reduce((total, { execution }) => total + execution.files.length, 0);
  const regionCount = embeddedExecutions.reduce(
    (total, embedded) => total + embedded.regionCount,
    0,
  );
  const outputDirs = [...new Set(executions.map((entry) => entry.outputDir))].sort();
  const generatorList = requestedGenerators.map((generator) => generator.name).join(', ');
  const embeddedSummary =
    embeddedExecutions.length > 0
      ? ` and ${String(regionCount)} embedded region(s) across ${String(embeddedExecutions.length)} host(s)`
      : '';

  process.stdout.write(
    `Generated ${String(fileCount)} files${embeddedSummary} from ${String(build.graph.counts.total)} patterns using ${generatorList} in ${outputDirs.join(', ')}.\n`,
  );
}

void main().catch((error: unknown) => {
  handleCliError(error, error instanceof BoundaryParseError ? 2 : 1);
});
