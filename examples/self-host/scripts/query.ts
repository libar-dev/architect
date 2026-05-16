import fs from 'node:fs';
import path from 'node:path';
import {
  applyProjectSourceDefaults,
  buildPatternGraph,
  formatConfigError,
  loadProjectConfig,
  resolveWorkspaceSources,
  type RuntimePatternGraph,
  WORKSPACE_TAG_REGISTRY,
} from '@libar-dev/architect-core';

interface ParsedArgs {
  readonly baseDir: string;
  readonly command: string;
}

function readPackageJson(): { name: string; version: string } {
  return JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
    name: string;
    version: string;
  };
}

function parseArgs(argv: readonly string[]): ParsedArgs {
  const args = argv.filter((arg) => arg !== '--');

  if (args.includes('--help') || args.includes('-h')) {
    return { baseDir: process.cwd(), command: 'help' };
  }

  if (args.includes('--version') || args.includes('-v')) {
    return { baseDir: process.cwd(), command: 'version' };
  }

  let baseDir = process.cwd();
  const positionals: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    switch (arg) {
      case '-b':
      case '--base-dir':
        if (next === undefined || next.startsWith('-')) {
          throw new Error(`${arg} requires a value`);
        }
        baseDir = path.resolve(next);
        index += 1;
        break;
      default:
        positionals.push(arg);
        break;
    }
  }

  return {
    baseDir,
    command: positionals[0] ?? 'help',
  };
}

async function loadDataset(baseDir: string): Promise<RuntimePatternGraph> {
  const workspaceSources = resolveWorkspaceSources(baseDir);
  const input = [...workspaceSources.input];
  const features = [...workspaceSources.features];
  const isWorkspace = input.length > 0 && features.length > 0;

  if (!isWorkspace) {
    const config = await loadProjectConfig(baseDir);
    if (!config.ok) {
      throw new Error(formatConfigError(config.error));
    }
    await applyProjectSourceDefaults({ baseDir, input, features });
  }

  const result = await buildPatternGraph({
    input,
    features,
    baseDir,
    mergeConflictStrategy: 'fatal',
    ...(isWorkspace ? { tagRegistry: WORKSPACE_TAG_REGISTRY } : {}),
  });

  if (!result.ok) {
    throw new Error(`Pipeline error [${result.error.step}]: ${result.error.message}`);
  }

  return result.value.graph;
}

function formatOverview(graph: RuntimePatternGraph): string {
  const activeByPhase = new Map<number, number>();

  for (const pattern of graph.patterns) {
    if (pattern.phase !== undefined && pattern.status === 'active') {
      activeByPhase.set(pattern.phase, (activeByPhase.get(pattern.phase) ?? 0) + 1);
    }
  }

  const phaseLines = [...activeByPhase.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([phase, count]) => `Phase ${String(phase)} (${String(count)} active)`);

  return [
    '=== PROGRESS ===',
    `${String(graph.counts.total)} delivery patterns (${String(graph.counts.completed)} completed, ${String(graph.counts.active)} active, ${String(graph.counts.planned)} planned)` +
      (graph.counts.candidate > 0 ? `, ${String(graph.counts.candidate)} candidate` : ''),
    phaseLines.length > 0 ? `\n=== ACTIVE PHASES ===\n${phaseLines.join('\n')}` : '',
    '',
  ].join('\n');
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.command === 'help') {
    process.stdout.write(
      'Usage: tsx packages/architect/scripts/query.ts <overview|status|version>\n'
    );
    return;
  }

  if (args.command === 'version') {
    const pkg = readPackageJson();
    process.stdout.write(`architect (${pkg.name}) v${pkg.version}\n`);
    return;
  }

  const graph = await loadDataset(args.baseDir);

  switch (args.command) {
    case 'overview':
      process.stdout.write(formatOverview(graph));
      break;
    case 'status':
      process.stdout.write(`${JSON.stringify(graph.counts, null, 2)}\n`);
      break;
    default:
      throw new Error(`Unsupported query command: ${args.command}`);
  }
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
