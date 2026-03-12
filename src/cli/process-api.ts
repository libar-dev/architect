#!/usr/bin/env node
/**
 * @libar-docs
 * @libar-docs-core @libar-docs-cli
 * @libar-docs-pattern ProcessAPICLIImpl
 * @libar-docs-status active
 * @libar-docs-implements ProcessStateAPICLI
 * @libar-docs-arch-role service
 * @libar-docs-arch-context cli
 * @libar-docs-arch-layer application
 * @libar-docs-uses ProcessStateAPI, MasterDataset, PipelineFactory, RulesQueryModule, PatternSummarizerImpl, FuzzyMatcherImpl, OutputPipelineImpl
 * @libar-docs-used-by npm scripts, Claude Code sessions
 * @libar-docs-usecase "When querying delivery process state from CLI"
 * @libar-docs-usecase "When Claude Code needs real-time delivery state queries"
 *
 * ## process-api - CLI Query Interface to ProcessStateAPI
 *
 * Exposes ProcessStateAPI methods as CLI subcommands with JSON output.
 * Runs pipeline steps 1-8 (config -> scan -> extract -> transform),
 * then routes subcommands to API methods.
 *
 * ### When to Use
 *
 * - When Claude Code needs real-time delivery state queries
 * - When AI agents need structured JSON instead of regenerating markdown
 * - When scripting delivery process queries in CI/CD
 *
 * ### Key Concepts
 *
 * - **Subcommand Routing**: CLI subcommands map to ProcessStateAPI methods
 * - **JSON Output**: All output is JSON to stdout, errors to stderr
 * - **Pipeline Reuse**: Steps 1-8 match generate-docs exactly
 * - **QueryResult Envelope**: All output wrapped in success/error discriminated union
 * - **Output Shaping**: 594KB -> 4KB via summarization and modifiers
 */

import * as path from 'path';
import * as fs from 'fs';
import { applyProjectSourceDefaults } from '../config/config-loader.js';
import {
  buildMasterDataset,
  type PipelineResult,
  type ValidationSummary,
  type RuntimeMasterDataset,
} from '../generators/pipeline/index.js';
import { createProcessStateAPI } from '../api/process-state.js';
import type { ProcessStateAPI } from '../api/process-state.js';
import type { ExtractedPattern } from '../validation-schemas/index.js';
import type { TagRegistry } from '../validation-schemas/tag-registry.js';
import { createSuccess, createError, QueryApiError } from '../api/types.js';
import { handleCliError } from './error-handler.js';
import { printVersionAndExit } from './version.js';
import { CLI_SCHEMA } from './cli-schema.js';
import type { CLIOptionGroup } from './cli-schema.js';
import {
  VALID_TRANSITIONS,
  isValidTransition as fsmIsValidTransition,
  getValidTransitionsFrom as fsmGetValidTransitionsFrom,
} from '../validation/fsm/transitions.js';
import {
  validateTransition as fsmValidateTransition,
  getProtectionSummary as fsmGetProtectionSummary,
} from '../validation/fsm/validator.js';
import type { ProcessStatusValue } from '../taxonomy/index.js';
import { fuzzyMatchPatterns } from '../api/fuzzy-match.js';
import {
  allPatternNames,
  suggestPattern,
  firstImplements,
  getPatternName,
} from '../api/pattern-helpers.js';
import {
  findStubPatterns,
  resolveStubs,
  groupStubsByPattern,
  extractDecisionItems,
  findPdrReferences,
} from '../api/stub-resolver.js';
import {
  applyOutputPipeline,
  applyListFilters,
  validateModifiers,
  formatOutput,
  PATTERN_ARRAY_METHODS,
  DEFAULT_OUTPUT_MODIFIERS,
  type OutputModifiers,
  type PipelineInput,
  type ListFilters,
} from './output-pipeline.js';
import {
  assembleContext,
  buildDepTree,
  buildFileReadingList,
  buildOverview,
  isValidSessionType,
  type SessionType,
} from '../api/context-assembler.js';
import {
  formatContextBundle,
  formatDepTree,
  formatFileReadingList,
  formatOverview,
} from '../api/context-formatter.js';
import {
  computeNeighborhood,
  compareContexts,
  aggregateTagUsage,
  buildSourceInventory,
  findOrphanPatterns,
} from '../api/arch-queries.js';
import { analyzeCoverage, findUnannotatedFiles } from '../api/coverage-analyzer.js';
import { validateScope, formatScopeValidation, type ScopeType } from '../api/scope-validator.js';
import {
  generateHandoff,
  formatHandoff,
  type HandoffSessionType,
} from '../api/handoff-generator.js';
import { execSync } from 'child_process';
import { queryBusinessRules } from '../api/rules-query.js';
import type { RulesFilters } from '../api/rules-query.js';

// =============================================================================
// CLI Config
// =============================================================================

interface ProcessAPICLIConfig {
  input: string[];
  features: string[];
  baseDir: string;
  workflowPath: string | null;
  subcommand: string | null;
  subArgs: string[];
  help: boolean;
  version: boolean;
  modifiers: OutputModifiers;
  format: 'json' | 'compact';
  sessionType: SessionType | null;
}

// =============================================================================
// Argument Parsing
// =============================================================================

function parseArgs(argv: string[] = process.argv.slice(2)): ProcessAPICLIConfig {
  const config: ProcessAPICLIConfig = {
    input: [],
    features: [],
    baseDir: process.cwd(),
    workflowPath: null,
    subcommand: null,
    subArgs: [],
    help: false,
    version: false,
    modifiers: { ...DEFAULT_OUTPUT_MODIFIERS },
    format: 'json',
    sessionType: null,
  };

  // Mutable modifiers for parsing
  let namesOnly = false;
  let count = false;
  let fields: string[] | null = null;
  let full = false;
  let parsingFlags = true;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const nextArg = argv[i + 1];

    // pnpm passes '--' as a literal arg separator — skip it
    if (arg === '--') {
      parsingFlags = false;
      continue;
    }

    // Handle --help and --version regardless of position
    if (arg === '-h' || arg === '--help') {
      config.help = true;
      continue;
    }
    if (arg === '-v' || arg === '--version') {
      config.version = true;
      continue;
    }

    // Handle output modifiers regardless of position (before or after subcommand)
    if (arg === '--names-only') {
      namesOnly = true;
      continue;
    }
    if (arg === '--count') {
      count = true;
      continue;
    }
    if (arg === '--fields') {
      if (!nextArg || nextArg.startsWith('-')) {
        throw new Error(`${arg} requires a value (comma-separated field names)`);
      }
      fields = nextArg.split(',').map((f) => f.trim());
      i++;
      continue;
    }
    if (arg === '--full') {
      full = true;
      continue;
    }
    if (arg === '--format') {
      if (nextArg !== 'json' && nextArg !== 'compact') {
        throw new Error(`${arg} must be "json" or "compact"`);
      }
      config.format = nextArg;
      i++;
      continue;
    }

    if (parsingFlags && arg?.startsWith('-') === true) {
      switch (arg) {
        case '-i':
        case '--input':
          if (!nextArg || nextArg.startsWith('-')) {
            throw new Error(`${arg} requires a value`);
          }
          config.input.push(nextArg);
          i++;
          break;

        case '-f':
        case '--features':
          if (!nextArg || nextArg.startsWith('-')) {
            throw new Error(`${arg} requires a value`);
          }
          config.features.push(nextArg);
          i++;
          break;

        case '-b':
        case '--base-dir':
          if (!nextArg || nextArg.startsWith('-')) {
            throw new Error(`${arg} requires a value`);
          }
          config.baseDir = nextArg;
          i++;
          break;

        case '-w':
        case '--workflow':
          if (!nextArg || nextArg.startsWith('-')) {
            throw new Error(`${arg} requires a value`);
          }
          config.workflowPath = nextArg;
          i++;
          break;

        case '--session':
          if (!nextArg || !isValidSessionType(nextArg)) {
            throw new Error(`${arg} must be "planning", "design", or "implement"`);
          }
          config.sessionType = nextArg;
          i++;
          break;

        default:
          throw new Error(`Unknown option: ${arg}`);
      }
    } else if (arg !== undefined) {
      if (config.subcommand === null) {
        config.subcommand = arg;
        parsingFlags = false;
      } else {
        config.subArgs.push(arg);
      }
    }
  }

  config.modifiers = { namesOnly, count, fields, full };
  return config;
}

// =============================================================================
// Help
// =============================================================================

function formatHelpOptions(group: CLIOptionGroup): string {
  return group.options
    .map((opt) => {
      const short = opt.short !== undefined ? `${opt.short}, ` : '    ';
      // Extract bare flag name (without value placeholder) for alignment
      const flag = opt.flag.padEnd(24);
      return `  ${short}${flag}${opt.description}`;
    })
    .join('\n');
}

function showHelp(): void {
  const options = formatHelpOptions(CLI_SCHEMA.globalOptions);
  const modifiers = formatHelpOptions(CLI_SCHEMA.outputModifiers);
  const filters = formatHelpOptions(CLI_SCHEMA.listFilters);
  const sessions = formatHelpOptions(CLI_SCHEMA.sessionOptions);

  console.log(`
process-api - Query delivery process state from annotated sources

  Use this instead of reading generated markdown or launching explore agents.
  Targeted queries use 5-10x less context than file reads.

Usage: process-api [options] <subcommand> [args...]

Quick Start — Session Recipe:

  1. overview                              Project health (progress, blockers)
  2. scope-validate <pattern> implement    Pre-flight check (FSM, deps, prereqs)
  3. context <pattern> --session design    Curated context bundle for the session

Session Workflow Commands (text output — use these first):

  overview                          Executive summary: progress, active phases, blockers
  scope-validate <pat> <type>       Pre-flight readiness check (PASS/BLOCKED/WARN verdict)
                                      Catches FSM violations and missing deps BEFORE you start.
                                      Types: implement, design
  context <pat> --session <type>    Curated context bundle tailored to session type
                                      planning  — minimal: pattern metadata and spec file
                                      design    — full: metadata, stubs, deps, deliverables
                                      implement — focused: deliverables, FSM state, test files
  dep-tree <pat> [--depth N]        Dependency chain with status
  files <pat> [--related]           File reading list with implementation paths
  handoff --pattern <pat>           Session-end state: deliverables, blockers, date
                                      Options: --git (include recent commits), --session <id>

Pattern Discovery (JSON output):

  status                    Status counts and completion percentage
  list [filters]            Filtered pattern listing (composable with modifiers below)
  search <query>            Fuzzy name search with match scores
  pattern <name>            Full detail for one pattern
                              Warning: ~66KB for completed patterns — prefer 'context --session'
  stubs [pattern]           Design stubs with target paths and resolution status
  stubs --unresolved        Only stubs with missing target files
  decisions <pattern>       AD-N design decisions from stub descriptions
  pdr <number>              Cross-reference patterns mentioning a PDR number
  rules [filters]           Business rules and invariants from feature specs
                              --product-area <name>  Filter by product area
                              --pattern <name>       Filter by pattern name
                              --only-invariants      Only rules with explicit invariants

Architecture Queries (JSON output):

  arch neighborhood <pat>   What does this pattern touch? (uses/usedBy/sameContext)
  arch blocking             What's stuck? Patterns blocked by incomplete deps
  arch dangling             Broken references (pattern names that don't exist)
  arch orphans              Isolated patterns with no relationships
  arch coverage             Annotation completeness across input files
  arch roles                All arch-roles with pattern counts
  arch context [name]       Patterns in bounded context (list all if no name)
  arch layer [name]         Patterns in architecture layer (list all if no name)
  arch compare <c1> <c2>    Cross-context shared deps and integration points

Design Review:

  sequence [name]           Sequence diagram data for design reviews
                              No args: list patterns with sequence annotations
                              With name: steps, participants, data flow types

Metadata & Inventory:

  tags                      Tag usage report (counts per tag and value)
  sources                   File inventory by type (TS, Gherkin, Stubs)
  unannotated [--path dir]  TypeScript files missing @libar-docs annotations
  query <method> [args...]  Execute any query API method directly

Options:

${options}

Output Modifiers (composable with any list/query):

${modifiers}

List Filters (for 'list' subcommand):

${filters}

Session Types (for 'context' and 'scope-validate'):

${sessions}

Common Recipes:

  Starting a session:
    process-api overview
    process-api scope-validate MyPattern implement
    process-api context MyPattern --session implement

  Finding what to work on:
    process-api list --status roadmap --names-only
    process-api arch blocking
    process-api query getRoadmapItems --names-only

  Investigating a pattern:
    process-api search EventStore
    process-api dep-tree EventStoreDurability --depth 2
    process-api arch neighborhood EventStoreDurability
    process-api stubs EventStoreDurability

  Design session prep:
    process-api context MyPattern --session design
    process-api decisions MyPattern
    process-api stubs --unresolved

  Ending a session:
    process-api handoff --pattern MyPattern

Session Types (for --session flag):

  planning    Minimal: pattern metadata and spec file only
  design      Full: metadata, description, stubs, deps, deliverables
  implement   Focused: deliverables, FSM state, test files

  Which session? Start coding -> implement. Complex decisions -> design.
                 New pattern -> planning. Not sure -> run 'overview' first.

Available API Methods (for 'query'):

  Status:   getPatternsByNormalizedStatus, getPatternsByStatus, getStatusCounts,
            getStatusDistribution, getCompletionPercentage
  Phase:    getPatternsByPhase, getPhaseProgress, getActivePhases, getAllPhases
  FSM:      isValidTransition, checkTransition, getValidTransitionsFrom,
            getProtectionInfo
  Pattern:  getPattern, getPatternDependencies, getPatternRelationships,
            getRelatedPatterns, getApiReferences, getPatternDeliverables,
            getPatternsByCategory, getCategories
  Timeline: getPatternsByQuarter, getQuarters, getCurrentWork, getRoadmapItems,
            getRecentlyCompleted
  Raw:      getMasterDataset
`);
}

// =============================================================================
// Config File Default Resolution
// =============================================================================

/**
 * If --input and --features are not provided, try to load defaults from config.
 * Prefers loadProjectConfig() for repos with delivery-process.config.ts,
 * falls back to filesystem auto-detection for repos without one.
 */
async function applyConfigDefaults(config: ProcessAPICLIConfig): Promise<void> {
  const applied = await applyProjectSourceDefaults(config);
  if (applied) {
    return;
  }

  // Fall back to existing filesystem auto-detection for repos without config
  applyConfigDefaultsFallback(config);
}

/**
 * Filesystem-based auto-detection fallback for repos without a config file.
 * Checks for conventional directory structures and applies defaults.
 */
function applyConfigDefaultsFallback(config: ProcessAPICLIConfig): void {
  const baseDir = path.resolve(config.baseDir);

  if (config.input.length === 0) {
    // Check for config file existence as signal to use defaults
    const configPath = path.join(baseDir, 'delivery-process.config.ts');
    if (fs.existsSync(configPath)) {
      config.input.push('src/**/*.ts');
      // Also check for stubs directory
      const stubsDir = path.join(baseDir, 'delivery-process', 'stubs');
      if (fs.existsSync(stubsDir)) {
        config.input.push('delivery-process/stubs/**/*.ts');
      }
    }
  }

  if (config.features.length === 0) {
    const specsDir = path.join(baseDir, 'delivery-process', 'specs');
    if (fs.existsSync(specsDir)) {
      config.features.push('delivery-process/specs/*.feature');
    }
    const releasesDir = path.join(baseDir, 'delivery-process', 'releases');
    if (fs.existsSync(releasesDir)) {
      config.features.push('delivery-process/releases/*.feature');
    }
  }
}

// =============================================================================
// Pipeline
// =============================================================================

async function buildPipeline(config: ProcessAPICLIConfig): Promise<PipelineResult> {
  const result = await buildMasterDataset({
    input: config.input,
    features: config.features,
    baseDir: config.baseDir,
    mergeConflictStrategy: 'fatal',
    ...(config.workflowPath !== null ? { workflowPath: config.workflowPath } : {}),
  });
  if (!result.ok) {
    console.error(`Pipeline error [${result.error.step}]: ${result.error.message}`);
    process.exit(1);
  }
  for (const w of result.value.warnings) {
    console.warn(`⚠️  ${w.message}`);
  }
  return result.value;
}

// =============================================================================
// FSM Short-Circuit (bypass pipeline for static FSM queries)
// =============================================================================

/**
 * FSM methods that operate on static const data and do not need the pipeline.
 * When `query <method>` matches one of these, we dispatch directly to the FSM
 * module, saving the 2-5 second pipeline build.
 */
const FSM_SHORT_CIRCUIT_METHODS: ReadonlySet<string> = new Set([
  'isValidTransition',
  'checkTransition',
  'getValidTransitionsFrom',
  'getProtectionInfo',
]);

/**
 * Validate and parse a CLI string as a ProcessStatusValue.
 * Rejects unknown status values with a helpful error message.
 */
function parseProcessStatus(
  value: string | undefined,
  usage: string,
  label: string
): ProcessStatusValue {
  if (value === undefined) {
    throw new QueryApiError('INVALID_ARGUMENT', usage);
  }
  if (!(value in VALID_TRANSITIONS)) {
    const valid = Object.keys(VALID_TRANSITIONS).join(', ');
    throw new QueryApiError(
      'INVALID_ARGUMENT',
      `Unknown ${label}: "${value}". Expected one of: ${valid}`
    );
  }
  return value as ProcessStatusValue;
}

/**
 * Attempt to handle an FSM query without building the pipeline.
 *
 * @returns The FSM result data if this is a short-circuit candidate, or
 *          `undefined` if the query should go through the normal pipeline path.
 */
function tryFsmShortCircuit(subcommand: string, subArgs: readonly string[]): unknown {
  if (subcommand !== 'query') return undefined;

  const methodName = subArgs[0];
  if (methodName === undefined || !FSM_SHORT_CIRCUIT_METHODS.has(methodName)) {
    return undefined;
  }

  const fsmArgs = subArgs.slice(1);

  switch (methodName) {
    case 'isValidTransition': {
      const usage = 'Usage: process-api query isValidTransition <fromStatus> <toStatus>';
      const from = parseProcessStatus(fsmArgs[0], usage, 'fromStatus');
      const to = parseProcessStatus(fsmArgs[1], usage, 'toStatus');
      return fsmIsValidTransition(from, to);
    }

    case 'checkTransition': {
      const from = fsmArgs[0];
      const to = fsmArgs[1];
      if (from === undefined || to === undefined) {
        throw new QueryApiError(
          'INVALID_ARGUMENT',
          'Usage: process-api query checkTransition <fromStatus> <toStatus>'
        );
      }
      const result = fsmValidateTransition(from, to);
      return {
        from: result.from,
        to: result.to,
        valid: result.valid,
        error: result.error,
        validAlternatives: result.validAlternatives,
      };
    }

    case 'getValidTransitionsFrom': {
      const status = parseProcessStatus(
        fsmArgs[0],
        'Usage: process-api query getValidTransitionsFrom <status>',
        'status'
      );
      return fsmGetValidTransitionsFrom(status);
    }

    case 'getProtectionInfo': {
      const status = parseProcessStatus(
        fsmArgs[0],
        'Usage: process-api query getProtectionInfo <status>',
        'status'
      );
      const summary = fsmGetProtectionSummary(status);
      return {
        status,
        level: summary.level,
        description: summary.description,
        canAddDeliverables: summary.canAddDeliverables,
        requiresUnlock: summary.requiresUnlock,
      };
    }

    default:
      return undefined;
  }
}

// =============================================================================
// Subcommand Handlers
// =============================================================================

function handleStatus(api: ProcessStateAPI): unknown {
  return {
    counts: api.getStatusCounts(),
    completionPercentage: api.getCompletionPercentage(),
    distribution: api.getStatusDistribution(),
  };
}

function coerceArg(arg: string): string | number {
  const asInt = parseInt(arg, 10);
  if (!isNaN(asInt) && String(asInt) === arg) {
    return asInt;
  }
  return arg;
}

const API_METHODS = [
  'getPatternsByNormalizedStatus',
  'getPatternsByStatus',
  'getStatusCounts',
  'getStatusDistribution',
  'getCompletionPercentage',
  'getPatternsByPhase',
  'getPhaseProgress',
  'getActivePhases',
  'getAllPhases',
  'isValidTransition',
  'checkTransition',
  'getValidTransitionsFrom',
  'getProtectionInfo',
  'getPattern',
  'getPatternDependencies',
  'getPatternRelationships',
  'getRelatedPatterns',
  'getApiReferences',
  'getPatternDeliverables',
  'getPatternsByCategory',
  'getCategories',
  'getPatternsByQuarter',
  'getQuarters',
  'getCurrentWork',
  'getRoadmapItems',
  'getRecentlyCompleted',
  'getMasterDataset',
] as const satisfies ReadonlyArray<keyof ProcessStateAPI>;

function handleQuery(
  api: ProcessStateAPI,
  args: string[]
): { methodName: string; result: unknown } {
  const methodName = args[0];
  if (!methodName) {
    throw new QueryApiError(
      'INVALID_ARGUMENT',
      'Usage: process-api query <method> [args...]\nMethods: ' + API_METHODS.join(', ')
    );
  }

  if (!API_METHODS.includes(methodName as (typeof API_METHODS)[number])) {
    throw new QueryApiError(
      'UNKNOWN_METHOD',
      `Unknown API method: ${methodName}\nAvailable: ${API_METHODS.join(', ')}`
    );
  }

  // Safe to cast: we validated methodName is in API_METHODS above
  const apiRecord = api as unknown as Record<string, (...a: unknown[]) => unknown>;
  const method = apiRecord[methodName];
  if (method === undefined) {
    throw new QueryApiError('UNKNOWN_METHOD', `Method not found on API: ${methodName}`);
  }
  const coercedArgs = args.slice(1).map(coerceArg);
  return { methodName, result: method.apply(api, coercedArgs) };
}

function handlePattern(api: ProcessStateAPI, args: string[]): unknown {
  const name = args[0];
  if (!name) {
    throw new QueryApiError('INVALID_ARGUMENT', 'Usage: process-api pattern <name>');
  }

  const pattern = api.getPattern(name);
  if (!pattern) {
    const hint = suggestPattern(name, allPatternNames(api.getMasterDataset()));
    throw new QueryApiError('PATTERN_NOT_FOUND', `Pattern not found: "${name}".${hint}`);
  }

  return {
    ...pattern,
    deliverables: api.getPatternDeliverables(name),
    dependencies: api.getPatternDependencies(name),
    relationships: api.getPatternRelationships(name),
  };
}

/**
 * Parse list-specific filter flags from subArgs.
 */
function parseListFilters(subArgs: string[]): ListFilters {
  let status: string | null = null;
  let phase: number | null = null;
  let category: string | null = null;
  let source: 'typescript' | 'gherkin' | null = null;
  let archContext: string | null = null;
  let productArea: string | null = null;
  let limit: number | null = null;
  let offset: number | null = null;

  for (let i = 0; i < subArgs.length; i++) {
    const arg = subArgs[i];
    const next = subArgs[i + 1];

    switch (arg) {
      case '--status':
        status = next ?? null;
        i++;
        break;
      case '--phase': {
        const parsed = next !== undefined ? parseInt(next, 10) : NaN;
        if (isNaN(parsed)) {
          throw new QueryApiError(
            'INVALID_ARGUMENT',
            `Invalid --phase value: "${next ?? ''}". Expected an integer.`
          );
        }
        phase = parsed;
        i++;
        break;
      }
      case '--category':
        category = next ?? null;
        i++;
        break;
      case '--source':
        if (next === 'typescript' || next === 'ts') {
          source = 'typescript';
        } else if (next === 'gherkin' || next === 'feature') {
          source = 'gherkin';
        }
        i++;
        break;
      case '--limit': {
        const parsed = next !== undefined ? parseInt(next, 10) : NaN;
        if (isNaN(parsed) || parsed < 1) {
          throw new QueryApiError(
            'INVALID_ARGUMENT',
            `Invalid --limit value: "${next ?? ''}". Expected a positive integer.`
          );
        }
        limit = parsed;
        i++;
        break;
      }
      case '--offset': {
        const parsed = next !== undefined ? parseInt(next, 10) : NaN;
        if (isNaN(parsed) || parsed < 0) {
          throw new QueryApiError(
            'INVALID_ARGUMENT',
            `Invalid --offset value: "${next ?? ''}". Expected a non-negative integer.`
          );
        }
        offset = parsed;
        i++;
        break;
      }
      case '--arch-context':
        archContext = next ?? null;
        i++;
        break;
      case '--product-area':
        productArea = next ?? null;
        i++;
        break;
      default:
        if (arg?.startsWith('-') === true) {
          console.warn(`Warning: Unknown flag '${arg}' ignored`);
        }
        break;
    }
  }

  return { status, phase, category, source, archContext, productArea, limit, offset };
}

/**
 * Generate contextual hint for empty list results.
 */
function generateEmptyHint(
  dataset: RuntimeMasterDataset,
  filters: ListFilters
): string | undefined {
  if (filters.status !== null) {
    const counts = dataset.counts;
    const alternatives: string[] = [];
    if (counts.active > 0 && filters.status !== 'active') {
      alternatives.push(`${counts.active} active`);
    }
    if (counts.planned > 0 && filters.status !== 'roadmap') {
      alternatives.push(`${counts.planned} roadmap`);
    }
    if (counts.completed > 0 && filters.status !== 'completed') {
      alternatives.push(`${counts.completed} completed`);
    }
    if (alternatives.length > 0) {
      // Pick the first available alternative for the suggestion command
      const statusPriority = [
        { status: 'active', count: counts.active },
        { status: 'roadmap', count: counts.planned },
        { status: 'completed', count: counts.completed },
      ];
      const altStatus =
        statusPriority.find((s) => s.count > 0 && s.status !== filters.status)?.status ?? 'active';
      return `No ${filters.status} patterns. ${alternatives.join(', ')} exist. Try: list --status ${altStatus}`;
    }
  }
  return undefined;
}

function handleList(
  dataset: RuntimeMasterDataset,
  subArgs: string[],
  modifiers: OutputModifiers
): unknown {
  const filters = parseListFilters(subArgs);
  const filtered = applyListFilters(dataset, filters);

  if (filtered.length === 0) {
    const hint = generateEmptyHint(dataset, filters);
    return { patterns: [], hint };
  }

  const input: PipelineInput = { kind: 'patterns', data: filtered };
  return applyOutputPipeline(input, modifiers);
}

function handleSearch(api: ProcessStateAPI, subArgs: string[]): unknown {
  const query = subArgs[0];
  if (!query) {
    throw new QueryApiError('INVALID_ARGUMENT', 'Usage: process-api search <query>');
  }

  const names = allPatternNames(api.getMasterDataset());
  const matches = fuzzyMatchPatterns(query, names);

  if (matches.length === 0) {
    const hint = `No patterns matched "${query}".${suggestPattern(query, names)}`;
    return { matches: [], hint };
  }

  return { matches };
}

async function handleArch(ctx: RouteContext): Promise<unknown> {
  const args = ctx.subArgs;
  const subCmd = args[0];

  // Graph health commands work on relationshipIndex/validation, not archIndex
  if (subCmd === 'dangling') return ctx.validation.danglingReferences;
  if (subCmd === 'orphans') return findOrphanPatterns(ctx.dataset);
  if (subCmd === 'blocking') return buildOverview(ctx.dataset).blocking;

  const archIndex = ctx.dataset.archIndex;

  if (!archIndex || archIndex.all.length === 0) {
    throw new QueryApiError(
      'PATTERN_NOT_FOUND',
      'No architecture data available. Ensure patterns have @libar-docs-arch-role annotations.'
    );
  }

  switch (subCmd) {
    case 'roles':
      return Object.entries(archIndex.byRole).map(([role, patterns]) => ({
        role,
        count: patterns.length,
        patterns: patterns.map((p) => p.name),
      }));

    case 'context': {
      const contextName = args[1];
      if (!contextName) {
        return Object.entries(archIndex.byContext).map(([ctxName, patterns]) => ({
          context: ctxName,
          count: patterns.length,
          patterns: patterns.map((p) => p.name),
        }));
      }
      const contextPatterns = archIndex.byContext[contextName];
      if (!contextPatterns) {
        throw new QueryApiError(
          'CATEGORY_NOT_FOUND',
          `Context not found: "${contextName}"\nAvailable: ${Object.keys(archIndex.byContext).join(', ')}`
        );
      }
      const ctxInput: PipelineInput = { kind: 'patterns', data: contextPatterns };
      return applyOutputPipeline(ctxInput, ctx.modifiers);
    }

    case 'layer': {
      const layerName = args[1];
      if (!layerName) {
        return Object.entries(archIndex.byLayer).map(([layer, patterns]) => ({
          layer,
          count: patterns.length,
          patterns: patterns.map((p) => p.name),
        }));
      }
      const layerPatterns = archIndex.byLayer[layerName];
      if (!layerPatterns) {
        throw new QueryApiError(
          'CATEGORY_NOT_FOUND',
          `Layer not found: "${layerName}"\nAvailable: ${Object.keys(archIndex.byLayer).join(', ')}`
        );
      }
      const layerInput: PipelineInput = { kind: 'patterns', data: layerPatterns };
      return applyOutputPipeline(layerInput, ctx.modifiers);
    }

    case 'neighborhood': {
      const patternName = args[1];
      if (!patternName) {
        throw new QueryApiError(
          'INVALID_ARGUMENT',
          'Usage: process-api arch neighborhood <pattern>'
        );
      }
      const neighborhood = computeNeighborhood(patternName, ctx.dataset);
      if (neighborhood === undefined) {
        const hint = suggestPattern(patternName, allPatternNames(ctx.dataset));
        throw new QueryApiError('PATTERN_NOT_FOUND', `Pattern not found: "${patternName}".${hint}`);
      }
      return neighborhood;
    }

    case 'compare': {
      const ctx1Name = args[1];
      const ctx2Name = args[2];
      if (!ctx1Name || !ctx2Name) {
        throw new QueryApiError(
          'INVALID_ARGUMENT',
          'Usage: process-api arch compare <ctx1> <ctx2>'
        );
      }
      const comparison = compareContexts(ctx1Name, ctx2Name, ctx.dataset);
      if (comparison === undefined) {
        const available = Object.keys(archIndex.byContext).join(', ');
        throw new QueryApiError('CONTEXT_NOT_FOUND', `Context not found. Available: ${available}`);
      }
      return comparison;
    }

    case 'coverage':
      try {
        return await analyzeCoverage(
          ctx.dataset,
          ctx.cliConfig.input,
          ctx.cliConfig.baseDir,
          ctx.registry
        );
      } catch (err) {
        throw new QueryApiError(
          'INVALID_ARGUMENT',
          `Coverage analysis failed: ${err instanceof Error ? err.message : String(err)}`
        );
      }

    default:
      throw new QueryApiError(
        'UNKNOWN_METHOD',
        `Unknown arch subcommand: ${subCmd ?? '(none)'}\nAvailable: roles, context [name], layer [name], neighborhood <pattern>, compare <ctx1> <ctx2>, coverage, dangling, orphans, blocking`
      );
  }
}

// =============================================================================
// Stub Integration Handlers
// =============================================================================

function handleSequence(dataset: RuntimeMasterDataset, subArgs: string[]): unknown {
  const index = dataset.sequenceIndex;

  if (!index || Object.keys(index).length === 0) {
    return { message: 'No patterns with sequence annotations found', patterns: [] };
  }

  if (subArgs.length === 0) {
    return {
      patterns: Object.keys(index),
      count: Object.keys(index).length,
    };
  }

  const patternName = subArgs[0] ?? '';
  const entry = index[patternName];
  if (!entry) {
    const available = Object.keys(index);
    const hint = suggestPattern(patternName, available);
    throw new QueryApiError(
      'PATTERN_NOT_FOUND',
      `No sequence data for "${patternName}".${hint} Available: ${available.join(', ')}`
    );
  }

  return entry;
}

// =============================================================================

function handleStubs(dataset: RuntimeMasterDataset, subArgs: string[], baseDir: string): unknown {
  const stubs = findStubPatterns(dataset);
  const resolutions = resolveStubs(stubs, baseDir);

  // Parse optional pattern name and --unresolved flag
  let patternFilter: string | undefined;
  let unresolvedOnly = false;

  for (const arg of subArgs) {
    if (arg === '--unresolved') {
      unresolvedOnly = true;
    } else {
      patternFilter = arg;
    }
  }

  let filtered = resolutions;

  // Filter by pattern name if provided
  if (patternFilter !== undefined) {
    const lowerFilter = patternFilter.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.implementsPattern?.toLowerCase() === lowerFilter ||
        r.stubName.toLowerCase() === lowerFilter
    );
    if (filtered.length === 0) {
      const stubNames = [...new Set(resolutions.map((r) => r.implementsPattern ?? r.stubName))];
      const hint = suggestPattern(patternFilter, stubNames);
      throw new QueryApiError(
        'STUB_NOT_FOUND',
        `No stubs found for pattern: "${patternFilter}".${hint}`
      );
    }
  }

  // Filter unresolved only
  if (unresolvedOnly) {
    filtered = filtered.filter((r) => !r.targetExists);
  }

  return groupStubsByPattern(filtered);
}

function handleDecisions(dataset: RuntimeMasterDataset, subArgs: string[]): unknown {
  const patternName = subArgs[0];
  if (patternName === undefined) {
    throw new QueryApiError('INVALID_ARGUMENT', 'Usage: decisions <pattern>');
  }

  // Find stubs implementing this pattern
  const stubs = findStubPatterns(dataset);
  const patternStubs = stubs.filter((s) => {
    const implName = firstImplements(s);
    return (
      implName?.toLowerCase() === patternName.toLowerCase() ||
      getPatternName(s).toLowerCase() === patternName.toLowerCase()
    );
  });

  if (patternStubs.length === 0) {
    const stubNames = [...new Set(stubs.map((s) => firstImplements(s) ?? getPatternName(s)))];
    const hint = suggestPattern(patternName, stubNames);
    throw new QueryApiError(
      'STUB_NOT_FOUND',
      `No decisions found for pattern: "${patternName}".${hint}`
    );
  }

  // Extract decisions from each stub's description
  const decisions = patternStubs.map((stub) => ({
    stub: getPatternName(stub),
    file: stub.source.file,
    since: stub.since,
    decisions: extractDecisionItems(stub.directive.description),
  }));

  return {
    pattern: patternName,
    stubs: decisions,
    totalDecisions: decisions.reduce((sum, d) => sum + d.decisions.length, 0),
  };
}

function handlePdr(dataset: RuntimeMasterDataset, subArgs: string[]): unknown {
  const pdrNumber = subArgs[0];
  if (pdrNumber === undefined) {
    throw new QueryApiError('INVALID_ARGUMENT', 'Usage: pdr <number> (e.g., pdr 012)');
  }

  // Normalize: strip leading "PDR-" if user passed it
  const normalizedNumber = pdrNumber.replace(/^PDR-/i, '').padStart(3, '0');

  const references = findPdrReferences(dataset.patterns, normalizedNumber);

  if (references.length === 0) {
    throw new QueryApiError('PDR_NOT_FOUND', `No patterns reference PDR-${normalizedNumber}`);
  }

  return {
    pdr: `PDR-${normalizedNumber}`,
    referenceCount: references.length,
    references,
  };
}

// =============================================================================
// Business Rules Handler
// =============================================================================

function parseRulesFilters(subArgs: string[]): RulesFilters {
  let productArea: string | null = null;
  let patternName: string | null = null;
  let onlyInvariants = false;

  for (let i = 0; i < subArgs.length; i++) {
    const arg = subArgs[i];
    if (arg === '--product-area') {
      if (i + 1 >= subArgs.length || subArgs[i + 1]?.startsWith('-') === true) {
        throw new QueryApiError('INVALID_ARGUMENT', '--product-area requires a value');
      }
      productArea = subArgs[++i] ?? null;
    } else if (arg === '--pattern') {
      if (i + 1 >= subArgs.length || subArgs[i + 1]?.startsWith('-') === true) {
        throw new QueryApiError('INVALID_ARGUMENT', '--pattern requires a value');
      }
      patternName = subArgs[++i] ?? null;
    } else if (arg === '--only-invariants') {
      onlyInvariants = true;
    } else if (typeof arg === 'string' && arg.startsWith('-')) {
      console.warn(`Warning: Unknown flag '${arg}' ignored`);
    }
  }

  return { productArea, patternName, onlyInvariants };
}

function handleRules(ctx: RouteContext): unknown {
  const filters = parseRulesFilters(ctx.subArgs);
  const result = queryBusinessRules(ctx.dataset, filters);

  // Empty-result hint (delegated from query, applied per output modifier)
  if (result.totalRules === 0 && (filters.productArea !== null || filters.patternName !== null)) {
    if (ctx.modifiers.count) {
      return { totalRules: 0, totalInvariants: 0, hint: result.hint };
    }
    if (ctx.modifiers.namesOnly) {
      return { names: [], hint: result.hint };
    }
    return { productAreas: [], totalRules: 0, totalInvariants: 0, hint: result.hint };
  }

  // Handle output modifiers
  if (ctx.modifiers.count) {
    return { totalRules: result.totalRules, totalInvariants: result.totalInvariants };
  }
  if (ctx.modifiers.namesOnly) {
    return result.allRuleNames;
  }

  return {
    productAreas: result.productAreas,
    totalRules: result.totalRules,
    totalInvariants: result.totalInvariants,
  };
}

// =============================================================================
// Context Assembly & Session Handlers
// =============================================================================

interface RouteContext {
  api: ProcessStateAPI;
  dataset: RuntimeMasterDataset;
  validation: ValidationSummary;
  subcommand: string;
  subArgs: string[];
  modifiers: OutputModifiers;
  sessionType: SessionType | null;
  baseDir: string;
  cliConfig: {
    readonly input: readonly string[];
    readonly features: readonly string[];
    readonly baseDir: string;
  };
  registry: TagRegistry;
}

// =============================================================================
// Context Assembly Handlers (text output — ADR-008)
// =============================================================================

function parseSessionFromSubArgs(subArgs: string[]): SessionType | null {
  const idx = subArgs.indexOf('--session');
  if (idx === -1) return null;
  const val = subArgs[idx + 1];
  if (val !== undefined && isValidSessionType(val)) return val;
  return null;
}

function handleContext(ctx: RouteContext): string {
  const patternNames: string[] = [];
  for (let i = 0; i < ctx.subArgs.length; i++) {
    const arg = ctx.subArgs[i];
    if (arg === '--session') {
      i++; // skip the value
      continue;
    }
    if (arg !== undefined && !arg.startsWith('-')) {
      patternNames.push(arg);
    }
  }

  if (patternNames.length === 0) {
    throw new QueryApiError(
      'CONTEXT_ASSEMBLY_ERROR',
      'Usage: process-api context <pattern> [pattern2...] [--session planning|design|implement]'
    );
  }

  const sessionType = ctx.sessionType ?? parseSessionFromSubArgs(ctx.subArgs) ?? 'design';
  const bundle = assembleContext(ctx.dataset, ctx.api, {
    patterns: patternNames,
    sessionType,
    baseDir: ctx.baseDir,
  });
  return formatContextBundle(bundle);
}

function handleFiles(ctx: RouteContext): string {
  const patternName = ctx.subArgs.find((a) => !a.startsWith('-'));
  if (patternName === undefined) {
    throw new QueryApiError(
      'CONTEXT_ASSEMBLY_ERROR',
      'Usage: process-api files <pattern> [--related]'
    );
  }

  const includeRelated = ctx.subArgs.includes('--related');
  const list = buildFileReadingList(ctx.dataset, patternName, includeRelated);
  return formatFileReadingList(list);
}

function handleDepTreeCmd(ctx: RouteContext): string {
  const patternName = ctx.subArgs.find((a) => !a.startsWith('-'));
  if (patternName === undefined) {
    throw new QueryApiError(
      'CONTEXT_ASSEMBLY_ERROR',
      'Usage: process-api dep-tree <pattern> [--depth N]'
    );
  }

  // Parse --depth N
  let maxDepth = 3;
  const depthIdx = ctx.subArgs.indexOf('--depth');
  if (depthIdx !== -1) {
    const depthVal = ctx.subArgs[depthIdx + 1];
    if (depthVal !== undefined) {
      const parsed = parseInt(depthVal, 10);
      if (!isNaN(parsed) && parsed > 0) {
        maxDepth = Math.min(parsed, 10);
      }
    }
  }

  const tree = buildDepTree(ctx.dataset, {
    pattern: patternName,
    maxDepth,
    includeImplementationDeps: true,
  });
  return formatDepTree(tree);
}

function handleOverviewCmd(ctx: RouteContext): string {
  const overview = buildOverview(ctx.dataset);
  return formatOverview(overview);
}

// =============================================================================
// Session Workflow Handlers (text output — ADR-008)
// =============================================================================

const VALID_SCOPE_TYPES: ReadonlySet<string> = new Set(['implement', 'design']);

function handleScopeValidate(ctx: RouteContext): string {
  // Parse pattern name (positional, first non-flag arg)
  let patternName: string | undefined;
  let scopeType: ScopeType = 'implement';
  let strict = false;

  for (let i = 0; i < ctx.subArgs.length; i++) {
    const arg = ctx.subArgs[i];
    if (arg === '--type') {
      const val = ctx.subArgs[i + 1];
      if (val !== undefined && VALID_SCOPE_TYPES.has(val)) {
        scopeType = val as ScopeType;
      } else {
        throw new QueryApiError(
          'INVALID_ARGUMENT',
          `--type must be "implement" or "design", got: "${val ?? ''}"`
        );
      }
      i++;
    } else if (arg === '--strict') {
      // DD-4: promotes WARN → BLOCKED (consistent with lint-process --strict)
      strict = true;
    } else if (arg !== undefined && !arg.startsWith('-')) {
      if (patternName === undefined) {
        patternName = arg;
      } else if (VALID_SCOPE_TYPES.has(arg)) {
        // DD-6: positional scope type also accepted
        scopeType = arg as ScopeType;
      }
    }
  }

  if (patternName === undefined) {
    throw new QueryApiError(
      'INVALID_ARGUMENT',
      'Usage: process-api scope-validate <pattern> [implement|design] [--type implement|design] [--strict]'
    );
  }

  const result = validateScope(ctx.api, ctx.dataset, {
    patternName,
    scopeType,
    baseDir: ctx.baseDir,
    strict,
  });
  return formatScopeValidation(result);
}

// 'review' is handoff-specific — not a global session type (parsed locally, not by top-level --session)
const VALID_HANDOFF_SESSION_TYPES: ReadonlySet<string> = new Set([
  'planning',
  'design',
  'implement',
  'review',
]);

function handleHandoff(ctx: RouteContext): string {
  let patternName: string | undefined;
  let sessionType: HandoffSessionType | undefined;
  let useGit = false;

  for (let i = 0; i < ctx.subArgs.length; i++) {
    const arg = ctx.subArgs[i];
    if (arg === '--pattern') {
      patternName = ctx.subArgs[i + 1];
      if (patternName === undefined) {
        throw new QueryApiError('INVALID_ARGUMENT', '--pattern requires a value');
      }
      i++;
    } else if (arg === '--session') {
      const val = ctx.subArgs[i + 1];
      if (val !== undefined && VALID_HANDOFF_SESSION_TYPES.has(val)) {
        sessionType = val as HandoffSessionType;
      } else {
        throw new QueryApiError(
          'INVALID_ARGUMENT',
          `--session must be "planning", "design", "implement", or "review", got: "${val ?? ''}"`
        );
      }
      i++;
    } else if (arg === '--git') {
      useGit = true;
    }
  }

  // Also accept from top-level parsed --session
  if (sessionType === undefined && ctx.sessionType !== null) {
    sessionType = ctx.sessionType;
  }

  // Pattern name uses --pattern flag (not positional) to avoid ambiguity with --git and --session
  if (patternName === undefined) {
    throw new QueryApiError(
      'INVALID_ARGUMENT',
      'Usage: process-api handoff --pattern <name> [--git] [--session planning|design|implement|review]'
    );
  }

  // DD-2: git integration is opt-in — CLI handler owns the shell call
  let modifiedFiles: readonly string[] | undefined;
  if (useGit) {
    try {
      const output = execSync('git diff --name-only HEAD', { encoding: 'utf-8' });
      modifiedFiles = output
        .trim()
        .split('\n')
        .filter((line) => line.length > 0);
    } catch (err) {
      console.error(
        `Warning: git diff failed: ${err instanceof Error ? err.message : String(err)}. Handoff will not include modified files.`
      );
      modifiedFiles = undefined;
    }
  }

  const options: {
    patternName: string;
    sessionType?: HandoffSessionType;
    modifiedFiles?: readonly string[];
  } = { patternName };
  if (sessionType !== undefined) {
    options.sessionType = sessionType;
  }
  if (modifiedFiles !== undefined) {
    options.modifiedFiles = modifiedFiles;
  }

  const doc = generateHandoff(ctx.api, ctx.dataset, options);
  return formatHandoff(doc);
}

// =============================================================================
// Subcommand Router
// =============================================================================

async function routeSubcommand(ctx: RouteContext): Promise<unknown> {
  switch (ctx.subcommand) {
    case 'context':
      return handleContext(ctx);

    case 'files':
      return handleFiles(ctx);

    case 'dep-tree':
      return handleDepTreeCmd(ctx);

    case 'overview':
      return handleOverviewCmd(ctx);

    case 'scope-validate':
      return handleScopeValidate(ctx);

    case 'handoff':
      return handleHandoff(ctx);

    case 'status':
      return handleStatus(ctx.api);

    case 'query': {
      const { methodName, result } = handleQuery(ctx.api, ctx.subArgs);
      // Apply output pipeline for pattern-array methods
      if (PATTERN_ARRAY_METHODS.has(methodName)) {
        const input: PipelineInput = {
          kind: 'patterns',
          data: result as readonly ExtractedPattern[],
        };
        return applyOutputPipeline(input, ctx.modifiers);
      }
      return result;
    }

    case 'pattern':
      return handlePattern(ctx.api, ctx.subArgs);

    case 'list':
      return handleList(ctx.dataset, ctx.subArgs, ctx.modifiers);

    case 'search':
      return handleSearch(ctx.api, ctx.subArgs);

    case 'arch':
      return handleArch(ctx);

    case 'stubs':
      return handleStubs(ctx.dataset, ctx.subArgs, ctx.cliConfig.baseDir);

    case 'decisions':
      return handleDecisions(ctx.dataset, ctx.subArgs);

    case 'pdr':
      return handlePdr(ctx.dataset, ctx.subArgs);

    case 'rules':
      return handleRules(ctx);

    case 'tags':
      return aggregateTagUsage(ctx.dataset);

    case 'sources':
      return buildSourceInventory(ctx.dataset);

    case 'sequence':
      return handleSequence(ctx.dataset, ctx.subArgs);

    case 'unannotated': {
      let pathFilter: string | undefined;
      for (let i = 0; i < ctx.subArgs.length; i++) {
        if (ctx.subArgs[i] === '--path') {
          pathFilter = ctx.subArgs[i + 1];
          break;
        }
      }
      try {
        return await findUnannotatedFiles(
          ctx.cliConfig.input,
          ctx.cliConfig.baseDir,
          ctx.registry,
          pathFilter
        );
      } catch (err) {
        throw new QueryApiError(
          'INVALID_ARGUMENT',
          `Unannotated file scan failed: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    default:
      throw new QueryApiError(
        'UNKNOWN_METHOD',
        `Unknown subcommand: ${ctx.subcommand}\nAvailable: context, files, dep-tree, overview, scope-validate, handoff, status, query, pattern, list, search, arch, stubs, decisions, pdr, rules, tags, sources, sequence, unannotated`
      );
  }
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  const opts = parseArgs();

  if (opts.version) {
    printVersionAndExit('process-api');
  }

  if (opts.help || !opts.subcommand) {
    showHelp();
    process.exit(opts.help ? 0 : 1);
  }

  // Validate output modifiers before any expensive work
  validateModifiers(opts.modifiers);

  // FSM short-circuit: bypass pipeline for static FSM queries (2-5s saving)
  if (opts.subcommand === 'query') {
    const fsmResult = tryFsmShortCircuit(opts.subcommand, opts.subArgs);
    if (fsmResult !== undefined) {
      const envelope = createSuccess(fsmResult, 0);
      const output = formatOutput(envelope, opts.format);
      console.log(output);
      return;
    }
  }

  // Resolve config file defaults if --input and --features not provided
  await applyConfigDefaults(opts);

  if (opts.input.length === 0) {
    console.error(
      'Error: --input is required (or place delivery-process.config.ts in cwd for auto-detection)'
    );
    console.error('');
    console.error('Example:');
    console.error('  process-api -i "src/**/*.ts" status');
    process.exit(1);
  }

  // Build pipeline (steps 1-8)
  const { dataset: masterDataset, validation } = await buildPipeline(opts);

  // Create ProcessStateAPI
  const api = createProcessStateAPI(masterDataset);

  // Route and execute subcommand
  const result = await routeSubcommand({
    api,
    dataset: masterDataset,
    validation,
    subcommand: opts.subcommand,
    subArgs: opts.subArgs,
    modifiers: opts.modifiers,
    sessionType: opts.sessionType,
    baseDir: path.resolve(opts.baseDir),
    cliConfig: { input: opts.input, features: opts.features, baseDir: opts.baseDir },
    registry: masterDataset.tagRegistry,
  });

  // Dual output path (ADR-008):
  // Text commands (context, files, dep-tree, overview) return string → output directly.
  // JSON commands return objects → wrap in QueryResult envelope.
  if (typeof result === 'string') {
    console.log(result);
  } else {
    const envelope = createSuccess(result, masterDataset.counts.total);
    const output = formatOutput(envelope, opts.format);
    console.log(output);
  }
}

void main().catch((error: unknown) => {
  // QueryApiError -> structured error envelope
  if (error instanceof QueryApiError) {
    const envelope = createError(error.code, error.message);
    console.log(JSON.stringify(envelope, null, 2));
    process.exit(1);
    return;
  }
  handleCliError(error, 1);
});
