import { existsSync } from 'node:fs';
import path from 'node:path';

import type { DanglingReference, PatternGraphAPI } from '@libar-dev/architect-core';
import {
  compareDanglingBaseline,
  DANGLING_BASELINE_SOURCE_PATH,
  writeDanglingBaseline,
  type DanglingBaselineComparison,
  type DanglingBaselineEntry,
} from '@libar-dev/architect-guard';
import {
  projectAnnotationCoverage,
  projectArchitectureComparison,
  projectArchitectureGraph,
  projectBoundedContext,
  projectArchitectureNeighborhood,
  projectOrphanPatternList,
  projectOverviewDigest,
} from '@libar-dev/architect-projection';
import { z } from 'zod';
import type { CliContext } from '../../pattern-graph-cli-types.js';
import { createEnvelope, writeJson } from './output.js';
import { parseAcceptedStatusValue, parseIntegerValue, parseProcessStatusValue } from './schemas.js';

const QUERY_METHODS = [
  'getStatusCounts',
  'isValidTransition',
  'getPatternsByStatus',
  'getPatternsByPhase',
] as const;
type QueryMethod = (typeof QUERY_METHODS)[number];
const QueryMethodSchema = z.enum(QUERY_METHODS);

const ARCH_SUBCOMMANDS = [
  'roles',
  'bounded-context',
  'neighborhood',
  'graph',
  'compare',
  'coverage',
  'dangling',
  'orphans',
  'blocking',
  'packages',
] as const;
type ArchSubcommand = (typeof ARCH_SUBCOMMANDS)[number];
const ArchSubcommandSchema = z.enum(ARCH_SUBCOMMANDS);

interface ArchCommandFlags {
  readonly baseline?: string;
  readonly writeBaseline?: boolean;
  readonly strict?: boolean;
}

interface DanglingBaselineResponse {
  readonly baselinePath: string;
  readonly written: boolean;
  readonly strict: boolean;
  readonly drift: boolean;
  readonly baselineCount: number;
  readonly currentCount: number;
  readonly addedCount: number;
  readonly removedCount: number;
  readonly added: readonly DanglingBaselineEntry[];
  readonly removed: readonly DanglingBaselineEntry[];
  readonly current: readonly DanglingBaselineEntry[];
}

function parseQueryMethod(value: string): QueryMethod {
  const parsed = QueryMethodSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(
      `Unknown API method: ${value}. Whitelisted methods: ${QUERY_METHODS.join(', ')}`,
    );
  }
  return parsed.data;
}

function parseArchSubcommand(value: string): ArchSubcommand {
  const parsed = ArchSubcommandSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(
      `Unknown arch subcommand: ${value}. Supported arch subcommands: ${ARCH_SUBCOMMANDS.join(', ')}`,
    );
  }
  return parsed.data;
}

export function validateStructuredCommandArgs(
  command: 'query' | 'arch',
  args: readonly string[],
  flags: Readonly<Record<string, unknown>> = {},
): void {
  const rawValue = args[0];
  if (rawValue === undefined) {
    throw new Error(`Usage: architect ${command} <subcommand>`);
  }

  if (command === 'query') {
    parseQueryMethod(rawValue);
    return;
  }

  const archSubcommand = parseArchSubcommand(rawValue);
  const hasFlags = Object.keys(flags).length > 0;
  if (hasFlags && archSubcommand !== 'dangling') {
    throw new Error('Arch baseline flags are only supported for `architect arch dangling`.');
  }
}

function executeQueryMethod(api: PatternGraphAPI, args: readonly string[]): unknown {
  const rawMethod = args[0];
  if (rawMethod === undefined) {
    throw new Error('Usage: architect query <method> [args...]');
  }
  const method = parseQueryMethod(rawMethod);

  switch (method) {
    case 'getStatusCounts':
      return api.getStatusCounts();
    case 'isValidTransition': {
      const from = args[1];
      const to = args[2];
      if (from === undefined || to === undefined) {
        throw new Error('Usage: architect query isValidTransition <from> <to>');
      }
      return api.isValidTransition(parseProcessStatusValue(from), parseProcessStatusValue(to));
    }
    case 'getPatternsByStatus': {
      const status = args[1];
      if (status === undefined) {
        throw new Error('Usage: architect query getPatternsByStatus <status>');
      }
      return api.getPatternsByStatus(parseAcceptedStatusValue(status));
    }
    case 'getPatternsByPhase': {
      const phaseArg = args[1];
      if (phaseArg === undefined) {
        throw new Error('Usage: architect query getPatternsByPhase <phase>');
      }
      return api.getPatternsByPhase(parseIntegerValue(phaseArg, 'Phase must be an integer'));
    }
  }
}

function findExistingRelativePath(input: string): string | undefined {
  let current = process.cwd();

  for (;;) {
    const candidate = path.resolve(current, input);
    if (existsSync(candidate)) {
      return candidate;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return undefined;
    }
    current = parent;
  }
}

function resolveBaselinePath(input: string | undefined, baseDir: string): string | undefined {
  if (input === undefined) {
    return undefined;
  }
  if (path.isAbsolute(input)) {
    return input;
  }
  const baseDirCandidate = path.resolve(baseDir, input);
  if (existsSync(baseDirCandidate)) {
    return baseDirCandidate;
  }
  return findExistingRelativePath(input) ?? baseDirCandidate;
}

function createBaselineResponse(
  comparison: DanglingBaselineComparison,
  baselinePath: string,
  written: boolean,
  strict: boolean,
): DanglingBaselineResponse {
  const drift = comparison.newEntries.length > 0 || comparison.removedEntries.length > 0;
  return {
    baselinePath,
    written,
    strict,
    drift,
    baselineCount: comparison.baseline.length,
    currentCount: comparison.current.length,
    addedCount: comparison.newEntries.length,
    removedCount: comparison.removedEntries.length,
    added: comparison.newEntries,
    removed: comparison.removedEntries,
    current: comparison.current,
  };
}

async function executeDanglingCommand(
  context: CliContext,
  flags: ArchCommandFlags,
): Promise<readonly DanglingReference[] | DanglingBaselineResponse> {
  const current = context.build.validation.danglingReferences;
  const baselineRequested =
    flags.baseline !== undefined || flags.writeBaseline === true || flags.strict === true;

  if (!baselineRequested) {
    return current;
  }

  const baselinePath = resolveBaselinePath(flags.baseline, context.args.baseDir);
  if (flags.writeBaseline === true) {
    await writeDanglingBaseline(current, {
      ...(baselinePath !== undefined ? { baselinePath } : {}),
    });
  }

  const comparison = await compareDanglingBaseline(current, {
    ...(baselinePath !== undefined ? { baselinePath } : {}),
  });
  const response = createBaselineResponse(
    comparison,
    baselinePath ?? DANGLING_BASELINE_SOURCE_PATH,
    flags.writeBaseline === true,
    flags.strict === true,
  );

  if (flags.strict === true && response.drift) {
    process.exitCode = 1;
  }

  return response;
}

async function executeArchCommand(
  context: CliContext,
  args: readonly string[],
  flags: Readonly<Record<string, unknown>> = {},
): Promise<unknown> {
  const rawSubcommand = args[0];
  if (rawSubcommand === undefined) {
    throw new Error('Usage: architect arch <subcommand>');
  }
  const subcommand = parseArchSubcommand(rawSubcommand);

  switch (subcommand) {
    case 'roles':
      return context.api.listRoles();
    case 'bounded-context': {
      const boundedContextName = args[1];
      return projectBoundedContext(context.projection, boundedContextName);
    }
    case 'neighborhood': {
      const pattern = args[1];
      if (pattern === undefined) {
        throw new Error('Usage: architect arch neighborhood <pattern>');
      }
      return projectArchitectureNeighborhood(context.projection, pattern).root;
    }
    case 'graph':
      return projectArchitectureGraph(context.projection);
    case 'compare': {
      const boundedContextA = args[1];
      const boundedContextB = args[2];
      if (boundedContextA === undefined || boundedContextB === undefined) {
        throw new Error('Usage: architect arch compare <bounded-context-a> <bounded-context-b>');
      }
      return projectArchitectureComparison(context.projection, boundedContextA, boundedContextB);
    }
    case 'coverage':
      return projectAnnotationCoverage(context.projection);
    case 'dangling':
      return executeDanglingCommand(context, flags);
    case 'orphans':
      return projectOrphanPatternList(context.projection).root.items;
    case 'blocking':
      return projectOverviewDigest(context.projection).root.blocking;
    case 'packages': {
      const byPackage = context.build.graph.archIndex?.byPackage;
      if (byPackage === undefined || Object.keys(byPackage).length === 0) {
        return {};
      }
      const packageName = args[1];
      if (packageName !== undefined) {
        const pkgPatterns = byPackage[packageName];
        return pkgPatterns !== undefined
          ? pkgPatterns.map((p) => ({
              patternName: p.patternName ?? p.name,
              status: p.status,
              role: p.role,
              file: p.source.file,
            }))
          : [];
      }
      const result: Record<string, { count: number; patterns: readonly string[] }> = {};
      for (const [pkgId, pkgPatterns] of Object.entries(byPackage).sort(([a], [b]) =>
        a.localeCompare(b),
      )) {
        result[pkgId] = {
          count: pkgPatterns.length,
          patterns: pkgPatterns.map((p) => p.patternName ?? p.name).sort((a, b) => a.localeCompare(b)),
        };
      }
      return result;
    }
  }
}

export async function executeStructuredCommand(
  context: CliContext,
  command: string,
  args: readonly string[],
  flags: Readonly<Record<string, unknown>> = {},
): Promise<unknown> {
  switch (command) {
    case 'query':
      return executeQueryMethod(context.api, args);
    case 'arch':
      return executeArchCommand(context, args, flags);
    case 'diagnostics':
      return context.build.diagnostics;
    default:
      throw new Error(`Unknown subcommand: ${command}`);
  }
}

export async function writeStructuredResponse(
  context: CliContext,
  command: string,
  args: readonly string[],
  flags: Readonly<Record<string, unknown>> = {},
): Promise<void> {
  const data = await executeStructuredCommand(context, command, args, flags);
  writeJson(createEnvelope(context, data));
}
