import { existsSync } from 'node:fs';
import path from 'node:path';

import type {
  DanglingReference,
  ExtractedPattern,
  PatternGraphAPI,
} from '@libar-dev/architect-core';
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
import {
  parseAcceptedStatusValue,
  parseIntegerValue,
  parseNormalizedStatusValue,
  parseProcessStatusValue,
  resolvePackageFilter,
} from './schemas.js';

const QUERY_METHODS = [
  // No-arg state + roadmap queries
  'getStatusCounts',
  'getStatusDistribution',
  'getCompletionPercentage',
  'getActivePhases',
  'getAllPhases',
  'listRoles',
  'getQuarters',
  'getCurrentWork',
  'getRoadmapItems',
  'getRecentlyCompleted',
  // Pattern-name lookups
  'getPattern',
  'getPatternParseFailure',
  'getPatternDependencies',
  'getDependencyContext',
  'getPatternRelationships',
  'getRelatedPatterns',
  'getApiReferences',
  'getRulesForPattern',
  'getPatternDeliverables',
  // Decision lookups
  'getRulesByDecision',
  'getPatternsByDecision',
  'listDecisions',
  // Package inventory
  'listPackages',
  // Role / quarter / phase lookups
  'getPatternsByRole',
  'getRoleInfo',
  'getPatternsByQuarter',
  'getPatternsByPhase',
  'getPhaseProgress',
  // Status lookups
  'getPatternsByNormalizedStatus',
  'getPatternsByStatus',
  // FSM transition + protection queries
  'isValidTransition',
  'checkTransition',
  'getValidTransitionsFrom',
  'getProtectionInfo',
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
  'workable',
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

function requireArg(value: string | undefined, usage: string): string {
  if (value === undefined) {
    throw new Error(usage);
  }
  return value;
}

interface CompactPatternSummary {
  readonly patternName: string;
  readonly status: ExtractedPattern['status'];
  readonly role: ExtractedPattern['role'];
  readonly file: ExtractedPattern['source']['file'];
}

/**
 * Maps full kernel patterns to the compact summary shape used by the CLI list
 * passthroughs. Returning the raw `ExtractedPattern[]` (full scenarios + rules)
 * blows an agent's context window; the compact shape matches the `list` verb.
 */
function toCompactSummaries(
  patterns: readonly ExtractedPattern[],
): readonly CompactPatternSummary[] {
  return patterns.map((p) => ({
    patternName: p.patternName ?? p.name,
    status: p.status,
    role: p.role,
    file: p.source.file,
  }));
}

function executeQueryMethod(api: PatternGraphAPI, args: readonly string[]): unknown {
  const rawMethod = args[0];
  if (rawMethod === undefined) {
    throw new Error('Usage: architect query <method> [args...]');
  }
  const method = parseQueryMethod(rawMethod);

  switch (method) {
    // ---- No-arg methods --------------------------------------------------
    case 'getStatusCounts':
      return api.getStatusCounts();
    case 'getStatusDistribution':
      return api.getStatusDistribution();
    case 'getCompletionPercentage':
      return api.getCompletionPercentage();
    case 'getActivePhases':
      return api.getActivePhases();
    case 'getAllPhases':
      return api.getAllPhases();
    case 'listRoles':
      return api.listRoles();
    case 'getQuarters':
      return api.getQuarters();
    case 'getCurrentWork':
      return toCompactSummaries(api.getCurrentWork());
    case 'getRoadmapItems':
      return toCompactSummaries(api.getRoadmapItems());
    case 'getRecentlyCompleted': {
      const limitArg = args[1];
      if (limitArg === undefined) {
        return toCompactSummaries(api.getRecentlyCompleted());
      }
      return toCompactSummaries(
        api.getRecentlyCompleted(parseIntegerValue(limitArg, 'Limit must be an integer')),
      );
    }

    // ---- Pattern-name lookups --------------------------------------------
    case 'getPattern':
      return api.getPattern(requireArg(args[1], 'Usage: architect query getPattern <name>'));
    case 'getPatternParseFailure':
      return api.getPatternParseFailure(
        requireArg(args[1], 'Usage: architect query getPatternParseFailure <name>'),
      );
    case 'getPatternDependencies':
      return api.getPatternDependencies(
        requireArg(args[1], 'Usage: architect query getPatternDependencies <name>'),
      );
    case 'getDependencyContext': {
      const name = requireArg(
        args[1],
        'Usage: architect query getDependencyContext <name> [maxDepth]',
      );
      const maxDepthArg = args[2];
      if (maxDepthArg === undefined) {
        return api.getDependencyContext(name);
      }
      return api.getDependencyContext(name, {
        maxDepth: parseIntegerValue(maxDepthArg, 'maxDepth must be an integer'),
      });
    }
    case 'getPatternRelationships':
      return api.getPatternRelationships(
        requireArg(args[1], 'Usage: architect query getPatternRelationships <name>'),
      );
    case 'getRelatedPatterns':
      return api.getRelatedPatterns(
        requireArg(args[1], 'Usage: architect query getRelatedPatterns <name>'),
      );
    case 'getApiReferences':
      return api.getApiReferences(
        requireArg(args[1], 'Usage: architect query getApiReferences <name>'),
      );
    case 'getRulesForPattern':
      return api.getRulesForPattern(
        requireArg(args[1], 'Usage: architect query getRulesForPattern <name>'),
      );
    case 'getPatternDeliverables':
      return api.getPatternDeliverables(
        requireArg(args[1], 'Usage: architect query getPatternDeliverables <name>'),
      );

    // ---- Decision lookups ------------------------------------------------
    case 'getRulesByDecision':
      return api.getRulesByDecision(
        requireArg(args[1], 'Usage: architect query getRulesByDecision <decision>'),
      );
    case 'getPatternsByDecision':
      return api.getPatternsByDecision(
        requireArg(args[1], 'Usage: architect query getPatternsByDecision <decision>'),
      );
    case 'listDecisions':
      return api.listDecisions();

    // ---- Package inventory -----------------------------------------------
    case 'listPackages':
      return api.listPackages();

    // ---- Role / quarter / phase lookups ----------------------------------
    case 'getPatternsByRole':
      return toCompactSummaries(
        api.getPatternsByRole(
          requireArg(args[1], 'Usage: architect query getPatternsByRole <role>'),
        ),
      );
    case 'getRoleInfo':
      return api.getRoleInfo(requireArg(args[1], 'Usage: architect query getRoleInfo <role>'));
    case 'getPatternsByQuarter':
      return toCompactSummaries(
        api.getPatternsByQuarter(
          requireArg(args[1], 'Usage: architect query getPatternsByQuarter <quarter>'),
        ),
      );
    case 'getPatternsByPhase': {
      const phaseArg = requireArg(args[1], 'Usage: architect query getPatternsByPhase <phase>');
      return toCompactSummaries(
        api.getPatternsByPhase(parseIntegerValue(phaseArg, 'Phase must be an integer')),
      );
    }
    case 'getPhaseProgress': {
      const phaseArg = requireArg(args[1], 'Usage: architect query getPhaseProgress <phase>');
      return api.getPhaseProgress(parseIntegerValue(phaseArg, 'Phase must be an integer'));
    }

    // ---- Status lookups --------------------------------------------------
    case 'getPatternsByNormalizedStatus': {
      const status = requireArg(
        args[1],
        'Usage: architect query getPatternsByNormalizedStatus <status>',
      );
      return toCompactSummaries(
        api.getPatternsByNormalizedStatus(parseNormalizedStatusValue(status)),
      );
    }
    case 'getPatternsByStatus': {
      const status = requireArg(args[1], 'Usage: architect query getPatternsByStatus <status>');
      return toCompactSummaries(api.getPatternsByStatus(parseAcceptedStatusValue(status)));
    }

    // ---- FSM transition + protection queries -----------------------------
    case 'isValidTransition': {
      const from = args[1];
      const to = args[2];
      if (from === undefined || to === undefined) {
        throw new Error('Usage: architect query isValidTransition <from> <to>');
      }
      return api.isValidTransition(parseProcessStatusValue(from), parseProcessStatusValue(to));
    }
    case 'checkTransition': {
      const from = args[1];
      const to = args[2];
      if (from === undefined || to === undefined) {
        throw new Error('Usage: architect query checkTransition <from> <to>');
      }
      return api.checkTransition(from, to);
    }
    case 'getValidTransitionsFrom': {
      const status = requireArg(args[1], 'Usage: architect query getValidTransitionsFrom <status>');
      return api.getValidTransitionsFrom(parseProcessStatusValue(status));
    }
    case 'getProtectionInfo': {
      const status = requireArg(args[1], 'Usage: architect query getProtectionInfo <status>');
      return api.getProtectionInfo(parseProcessStatusValue(status));
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
    case 'workable': {
      // The complement of `blocking`: roadmap-status patterns whose dependencies
      // are all complete (safe to start). The overview computes the same set but
      // only exposes a capped sample (startableSample) + a count; this returns the
      // full list as a first-class verb so "what can I start?" is one call instead
      // of a `comm -23 <(list --status roadmap) <(arch blocking)` shell stitch.
      const blockedNames = new Set(
        projectOverviewDigest(context.projection).root.blocking.map((entry) => entry.pattern),
      );
      return toCompactSummaries(
        context.api
          .getPatternsByStatus(parseAcceptedStatusValue('roadmap'))
          .filter((pattern) => !blockedNames.has(pattern.patternName ?? pattern.name)),
      );
    }
    case 'packages': {
      const byPackage = context.build.graph.archIndex?.byPackage;
      if (byPackage === undefined || Object.keys(byPackage).length === 0) {
        return {};
      }
      const packageName = args[1];
      if (packageName !== undefined) {
        const resolved = resolvePackageFilter(Object.keys(byPackage).sort(), packageName);
        const pkgPatterns = byPackage[resolved];
        return pkgPatterns !== undefined ? toCompactSummaries(pkgPatterns) : [];
      }
      const result: Record<string, { count: number; patterns: readonly string[] }> = {};
      for (const [pkgId, pkgPatterns] of Object.entries(byPackage).sort(([a], [b]) =>
        a.localeCompare(b),
      )) {
        result[pkgId] = {
          count: pkgPatterns.length,
          patterns: pkgPatterns
            .map((p) => p.patternName ?? p.name)
            .sort((a, b) => a.localeCompare(b)),
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
