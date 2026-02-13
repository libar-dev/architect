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
 * @libar-docs-uses ProcessStateAPI, MasterDataset, Pattern Scanner, Doc Extractor, Gherkin Scanner, Gherkin Extractor, PatternSummarizerImpl, FuzzyMatcherImpl, OutputPipelineImpl
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
import { loadConfig, formatConfigError } from '../config/config-loader.js';
import { DEFAULT_CONTEXT_INFERENCE_RULES } from '../config/defaults.js';
import { scanPatterns } from '../scanner/index.js';
import { extractPatterns } from '../extractor/doc-extractor.js';
import { scanGherkinFiles } from '../scanner/gherkin-scanner.js';
import { extractPatternsFromGherkin, computeHierarchyChildren, } from '../extractor/gherkin-extractor.js';
import { mergePatterns } from '../generators/orchestrator.js';
import { loadDefaultWorkflow, loadWorkflowFromPath } from '../config/workflow-loader.js';
import { transformToMasterDatasetWithValidation } from '../generators/pipeline/index.js';
import { createProcessStateAPI } from '../api/process-state.js';
import { createSuccess, createError, QueryApiError } from '../api/types.js';
import { handleCliError } from './error-handler.js';
import { printVersionAndExit } from './version.js';
import { fuzzyMatchPatterns } from '../api/fuzzy-match.js';
import { allPatternNames, suggestPattern, firstImplements, getPatternName, } from '../api/pattern-helpers.js';
import { findStubPatterns, resolveStubs, groupStubsByPattern, extractDecisionItems, findPdrReferences, } from '../api/stub-resolver.js';
import { applyOutputPipeline, applyListFilters, validateModifiers, formatOutput, PATTERN_ARRAY_METHODS, DEFAULT_OUTPUT_MODIFIERS, } from './output-pipeline.js';
import { assembleContext, buildDepTree, buildFileReadingList, buildOverview, isValidSessionType, } from '../api/context-assembler.js';
import { formatContextBundle, formatDepTree, formatFileReadingList, formatOverview, } from '../api/context-formatter.js';
import { computeNeighborhood, compareContexts, aggregateTagUsage, buildSourceInventory, findOrphanPatterns, } from '../api/arch-queries.js';
import { analyzeCoverage, findUnannotatedFiles } from '../api/coverage-analyzer.js';
import { validateScope, formatScopeValidation } from '../api/scope-validator.js';
import { generateHandoff, formatHandoff, } from '../api/handoff-generator.js';
import { execSync } from 'child_process';
// =============================================================================
// Argument Parsing
// =============================================================================
function parseArgs(argv = process.argv.slice(2)) {
    const config = {
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
    let fields = null;
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
        }
        else if (arg !== undefined) {
            if (config.subcommand === null) {
                config.subcommand = arg;
                parsingFlags = false;
            }
            else {
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
function showHelp() {
    console.log(`
process-api - Query delivery process state via ProcessStateAPI

Usage: process-api [options] <subcommand> [args...]

Options:
  -i, --input <pattern>   Glob patterns for TypeScript files (repeatable)
  -f, --features <pattern> Glob patterns for .feature files (repeatable)
  -b, --base-dir <dir>    Base directory (default: cwd)
  -w, --workflow <file>   Workflow config JSON file
  -h, --help              Show this help message
  -v, --version           Show version number

Output Modifiers:
  --names-only            Return array of pattern name strings
  --count                 Return count of matching patterns
  --fields <f1,f2,...>    Return only specified fields per pattern
  --full                  Bypass summarization, return raw patterns
  --format <json|compact> Output format (default: json)

Subcommands:
  status                    Status counts and completion percentage
  query <method> [args...]  Execute any ProcessStateAPI method
  pattern <name>            Full detail for one pattern
  list [filters]            List patterns with composable filters
  search <query>            Fuzzy search for pattern names
  arch roles                List all arch-roles with counts
  arch context [name]       Patterns in bounded context (list all if no name)
  arch layer [name]         Patterns in architecture layer (list all if no name)
  arch neighborhood <pat>   Uses, usedBy, same-context siblings for pattern
  arch compare <c1> <c2>    Compare two bounded contexts (shared deps, integration)
  arch coverage             Annotation coverage analysis across input files
  arch dangling             Broken references (pattern names that don't exist)
  arch orphans              Patterns with no relationships (isolated)
  arch blocking             Patterns blocked by incomplete dependencies
  context <pattern> [--session planning|design|implement]  Curated context bundle (text)
  files <pattern> [--related]                             File reading list (text)
  dep-tree <pattern> [--depth N]                          Dependency tree (text)
  overview                                                Executive project summary (text)
  scope-validate <pat> [implement|design] [--type ...] [--strict]  Pre-flight readiness (text)
  handoff --pattern <pat> [--git] [--session ...]        Session-end handoff summary (text)
  stubs [pattern]           List design stubs with implementation status
  stubs --unresolved        Show only stubs with missing target files
  decisions <pattern>       Show AD-N design decisions from stub descriptions
  pdr <number>              Cross-reference patterns mentioning a PDR number
  tags                      Tag usage report (counts per tag and value)
  sources                   Source file inventory grouped by type
  unannotated [--path dir]  Find TypeScript files without @libar-docs annotations

List Filters:
  --status <status>         Filter by FSM status (roadmap, active, completed, deferred)
  --phase <number>          Filter by roadmap phase number
  --category <name>         Filter by category
  --source <ts|gherkin>     Filter by source type
  --limit <n>               Maximum results
  --offset <n>              Skip first n results

Examples:
  process-api -i "src/**/*.ts" -f "specs/*.feature" status
  process-api -i "src/**/*.ts" query getCurrentWork
  process-api -i "src/**/*.ts" query getCurrentWork --names-only
  process-api -i "src/**/*.ts" list --status active
  process-api -i "src/**/*.ts" list --status roadmap --category projection --count
  process-api -i "src/**/*.ts" search ProcessState
  process-api -i "src/**/*.ts" pattern ProcessGuardLinter
  process-api -i "src/**/*.ts" arch roles

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
 * When a delivery-process.config.ts exists, use conventional paths.
 */
function applyConfigDefaults(config) {
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
async function buildPipeline(config) {
    const baseDir = path.resolve(config.baseDir);
    // Step 1: Load configuration
    const configResult = await loadConfig(baseDir);
    if (!configResult.ok) {
        console.error(`Config error: ${formatConfigError(configResult.error)}`);
        process.exit(1);
    }
    const registry = configResult.value.instance.registry;
    // Step 2: Scan TypeScript source files
    const scanResult = await scanPatterns({ patterns: config.input, baseDir }, registry);
    if (!scanResult.ok) {
        console.error(`Failed to scan source files: ${String(scanResult.error)}`);
        process.exit(1);
    }
    const { files: scannedFiles } = scanResult.value;
    // Step 3: Extract patterns from TypeScript
    const extraction = extractPatterns(scannedFiles, baseDir, registry);
    // Step 4: Scan and extract Gherkin patterns
    let gherkinPatterns = [];
    if (config.features.length > 0) {
        const gherkinScanResult = await scanGherkinFiles({
            patterns: config.features,
            baseDir,
        });
        if (gherkinScanResult.ok) {
            const gherkinResult = extractPatternsFromGherkin(gherkinScanResult.value.files, {
                baseDir,
                tagRegistry: registry,
                scenariosAsUseCases: true,
            });
            gherkinPatterns = gherkinResult.patterns;
        }
        else {
            console.error(`Warning: Failed to scan Gherkin files: ${String(gherkinScanResult.error)}`);
        }
    }
    // Step 5: Merge patterns (conflict detection)
    const mergeResult = mergePatterns(extraction.patterns, gherkinPatterns);
    if (!mergeResult.ok) {
        console.error(`Merge error: ${mergeResult.error}`);
        process.exit(1);
    }
    // Step 6: Compute hierarchy children
    const allPatterns = computeHierarchyChildren(mergeResult.value);
    // Step 7: Load workflow configuration
    let workflow;
    if (config.workflowPath) {
        const workflowResult = await loadWorkflowFromPath(config.workflowPath);
        if (!workflowResult.ok) {
            console.error(`Workflow error: ${workflowResult.error.message}`);
            process.exit(1);
        }
        workflow = workflowResult.value;
    }
    else {
        try {
            workflow = await loadDefaultWorkflow();
        }
        catch {
            // Non-fatal: continue without workflow
        }
    }
    // Step 8: Transform to MasterDataset (with validation for graph health commands)
    const { dataset: masterDataset, validation } = transformToMasterDatasetWithValidation({
        patterns: allPatterns,
        tagRegistry: registry,
        workflow,
        contextInferenceRules: DEFAULT_CONTEXT_INFERENCE_RULES,
    });
    return { dataset: masterDataset, validation };
}
// =============================================================================
// Subcommand Handlers
// =============================================================================
function handleStatus(api) {
    return {
        counts: api.getStatusCounts(),
        completionPercentage: api.getCompletionPercentage(),
        distribution: api.getStatusDistribution(),
    };
}
function coerceArg(arg) {
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
];
function handleQuery(api, args) {
    const methodName = args[0];
    if (!methodName) {
        throw new QueryApiError('INVALID_ARGUMENT', 'Usage: process-api query <method> [args...]\nMethods: ' + API_METHODS.join(', '));
    }
    if (!API_METHODS.includes(methodName)) {
        throw new QueryApiError('UNKNOWN_METHOD', `Unknown API method: ${methodName}\nAvailable: ${API_METHODS.join(', ')}`);
    }
    // Safe to cast: we validated methodName is in API_METHODS above
    const apiRecord = api;
    const method = apiRecord[methodName];
    if (method === undefined) {
        throw new QueryApiError('UNKNOWN_METHOD', `Method not found on API: ${methodName}`);
    }
    const coercedArgs = args.slice(1).map(coerceArg);
    return { methodName, result: method.apply(api, coercedArgs) };
}
function handlePattern(api, args) {
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
function parseListFilters(subArgs) {
    let status = null;
    let phase = null;
    let category = null;
    let source = null;
    let limit = null;
    let offset = null;
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
                    throw new QueryApiError('INVALID_ARGUMENT', `Invalid --phase value: "${next ?? ''}". Expected an integer.`);
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
                }
                else if (next === 'gherkin' || next === 'feature') {
                    source = 'gherkin';
                }
                i++;
                break;
            case '--limit': {
                const parsed = next !== undefined ? parseInt(next, 10) : NaN;
                if (isNaN(parsed) || parsed < 1) {
                    throw new QueryApiError('INVALID_ARGUMENT', `Invalid --limit value: "${next ?? ''}". Expected a positive integer.`);
                }
                limit = parsed;
                i++;
                break;
            }
            case '--offset': {
                const parsed = next !== undefined ? parseInt(next, 10) : NaN;
                if (isNaN(parsed) || parsed < 0) {
                    throw new QueryApiError('INVALID_ARGUMENT', `Invalid --offset value: "${next ?? ''}". Expected a non-negative integer.`);
                }
                offset = parsed;
                i++;
                break;
            }
            default:
                break;
        }
    }
    return { status, phase, category, source, limit, offset };
}
/**
 * Generate contextual hint for empty list results.
 */
function generateEmptyHint(dataset, filters) {
    if (filters.status !== null) {
        const counts = dataset.counts;
        const alternatives = [];
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
            const altStatus = statusPriority.find((s) => s.count > 0 && s.status !== filters.status)?.status ?? 'active';
            return `No ${filters.status} patterns. ${alternatives.join(', ')} exist. Try: list --status ${altStatus}`;
        }
    }
    return undefined;
}
function handleList(dataset, subArgs, modifiers) {
    const filters = parseListFilters(subArgs);
    const filtered = applyListFilters(dataset, filters);
    if (filtered.length === 0) {
        const hint = generateEmptyHint(dataset, filters);
        return { patterns: [], hint };
    }
    const input = { kind: 'patterns', data: filtered };
    return applyOutputPipeline(input, modifiers);
}
function handleSearch(api, subArgs) {
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
async function handleArch(ctx) {
    const args = ctx.subArgs;
    const subCmd = args[0];
    // Graph health commands work on relationshipIndex/validation, not archIndex
    if (subCmd === 'dangling')
        return ctx.validation.danglingReferences;
    if (subCmd === 'orphans')
        return findOrphanPatterns(ctx.dataset);
    if (subCmd === 'blocking')
        return buildOverview(ctx.dataset).blocking;
    const archIndex = ctx.dataset.archIndex;
    if (!archIndex || archIndex.all.length === 0) {
        throw new QueryApiError('PATTERN_NOT_FOUND', 'No architecture data available. Ensure patterns have @libar-docs-arch-role annotations.');
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
                throw new QueryApiError('CATEGORY_NOT_FOUND', `Context not found: "${contextName}"\nAvailable: ${Object.keys(archIndex.byContext).join(', ')}`);
            }
            const ctxInput = { kind: 'patterns', data: contextPatterns };
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
                throw new QueryApiError('CATEGORY_NOT_FOUND', `Layer not found: "${layerName}"\nAvailable: ${Object.keys(archIndex.byLayer).join(', ')}`);
            }
            const layerInput = { kind: 'patterns', data: layerPatterns };
            return applyOutputPipeline(layerInput, ctx.modifiers);
        }
        case 'neighborhood': {
            const patternName = args[1];
            if (!patternName) {
                throw new QueryApiError('INVALID_ARGUMENT', 'Usage: process-api arch neighborhood <pattern>');
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
                throw new QueryApiError('INVALID_ARGUMENT', 'Usage: process-api arch compare <ctx1> <ctx2>');
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
                return await analyzeCoverage(ctx.dataset, ctx.cliConfig.input, ctx.cliConfig.baseDir, ctx.registry);
            }
            catch (err) {
                throw new QueryApiError('INVALID_ARGUMENT', `Coverage analysis failed: ${err instanceof Error ? err.message : String(err)}`);
            }
        default:
            throw new QueryApiError('UNKNOWN_METHOD', `Unknown arch subcommand: ${subCmd ?? '(none)'}\nAvailable: roles, context [name], layer [name], neighborhood <pattern>, compare <ctx1> <ctx2>, coverage, dangling, orphans, blocking`);
    }
}
// =============================================================================
// Stub Integration Handlers
// =============================================================================
function handleStubs(dataset, subArgs, baseDir) {
    const stubs = findStubPatterns(dataset);
    const resolutions = resolveStubs(stubs, baseDir);
    // Parse optional pattern name and --unresolved flag
    let patternFilter;
    let unresolvedOnly = false;
    for (const arg of subArgs) {
        if (arg === '--unresolved') {
            unresolvedOnly = true;
        }
        else {
            patternFilter = arg;
        }
    }
    let filtered = resolutions;
    // Filter by pattern name if provided
    if (patternFilter !== undefined) {
        const lowerFilter = patternFilter.toLowerCase();
        filtered = filtered.filter((r) => r.implementsPattern?.toLowerCase() === lowerFilter ||
            r.stubName.toLowerCase() === lowerFilter);
        if (filtered.length === 0) {
            const stubNames = [...new Set(resolutions.map((r) => r.implementsPattern ?? r.stubName))];
            const hint = suggestPattern(patternFilter, stubNames);
            throw new QueryApiError('STUB_NOT_FOUND', `No stubs found for pattern: "${patternFilter}".${hint}`);
        }
    }
    // Filter unresolved only
    if (unresolvedOnly) {
        filtered = filtered.filter((r) => !r.targetExists);
    }
    return groupStubsByPattern(filtered);
}
function handleDecisions(dataset, subArgs) {
    const patternName = subArgs[0];
    if (patternName === undefined) {
        throw new QueryApiError('INVALID_ARGUMENT', 'Usage: decisions <pattern>');
    }
    // Find stubs implementing this pattern
    const stubs = findStubPatterns(dataset);
    const patternStubs = stubs.filter((s) => {
        const implName = firstImplements(s);
        return (implName?.toLowerCase() === patternName.toLowerCase() ||
            getPatternName(s).toLowerCase() === patternName.toLowerCase());
    });
    if (patternStubs.length === 0) {
        const stubNames = [...new Set(stubs.map((s) => firstImplements(s) ?? getPatternName(s)))];
        const hint = suggestPattern(patternName, stubNames);
        throw new QueryApiError('STUB_NOT_FOUND', `No decisions found for pattern: "${patternName}".${hint}`);
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
function handlePdr(dataset, subArgs) {
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
// Context Assembly Handlers (text output — ADR-008)
// =============================================================================
function parseSessionFromSubArgs(subArgs) {
    const idx = subArgs.indexOf('--session');
    if (idx === -1)
        return null;
    const val = subArgs[idx + 1];
    if (val !== undefined && isValidSessionType(val))
        return val;
    return null;
}
function handleContext(ctx) {
    const patternNames = [];
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
        throw new QueryApiError('CONTEXT_ASSEMBLY_ERROR', 'Usage: process-api context <pattern> [pattern2...] [--session planning|design|implement]');
    }
    const sessionType = ctx.sessionType ?? parseSessionFromSubArgs(ctx.subArgs) ?? 'design';
    const bundle = assembleContext(ctx.dataset, ctx.api, {
        patterns: patternNames,
        sessionType,
        baseDir: ctx.baseDir,
    });
    return formatContextBundle(bundle);
}
function handleFiles(ctx) {
    const patternName = ctx.subArgs.find((a) => !a.startsWith('-'));
    if (patternName === undefined) {
        throw new QueryApiError('CONTEXT_ASSEMBLY_ERROR', 'Usage: process-api files <pattern> [--related]');
    }
    const includeRelated = ctx.subArgs.includes('--related');
    const list = buildFileReadingList(ctx.dataset, patternName, includeRelated);
    return formatFileReadingList(list);
}
function handleDepTreeCmd(ctx) {
    const patternName = ctx.subArgs.find((a) => !a.startsWith('-'));
    if (patternName === undefined) {
        throw new QueryApiError('CONTEXT_ASSEMBLY_ERROR', 'Usage: process-api dep-tree <pattern> [--depth N]');
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
function handleOverviewCmd(ctx) {
    const overview = buildOverview(ctx.dataset);
    return formatOverview(overview);
}
// =============================================================================
// Session Workflow Handlers (text output — ADR-008)
// =============================================================================
const VALID_SCOPE_TYPES = new Set(['implement', 'design']);
function handleScopeValidate(ctx) {
    // Parse pattern name (positional, first non-flag arg)
    let patternName;
    let scopeType = 'implement';
    let strict = false;
    for (let i = 0; i < ctx.subArgs.length; i++) {
        const arg = ctx.subArgs[i];
        if (arg === '--type') {
            const val = ctx.subArgs[i + 1];
            if (val !== undefined && VALID_SCOPE_TYPES.has(val)) {
                scopeType = val;
            }
            else {
                throw new QueryApiError('INVALID_ARGUMENT', `--type must be "implement" or "design", got: "${val ?? ''}"`);
            }
            i++;
        }
        else if (arg === '--strict') {
            // DD-4: promotes WARN → BLOCKED (consistent with lint-process --strict)
            strict = true;
        }
        else if (arg !== undefined && !arg.startsWith('-')) {
            if (patternName === undefined) {
                patternName = arg;
            }
            else if (VALID_SCOPE_TYPES.has(arg)) {
                // DD-6: positional scope type also accepted
                scopeType = arg;
            }
        }
    }
    if (patternName === undefined) {
        throw new QueryApiError('INVALID_ARGUMENT', 'Usage: process-api scope-validate <pattern> [implement|design] [--type implement|design] [--strict]');
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
const VALID_HANDOFF_SESSION_TYPES = new Set([
    'planning',
    'design',
    'implement',
    'review',
]);
function handleHandoff(ctx) {
    let patternName;
    let sessionType;
    let useGit = false;
    for (let i = 0; i < ctx.subArgs.length; i++) {
        const arg = ctx.subArgs[i];
        if (arg === '--pattern') {
            patternName = ctx.subArgs[i + 1];
            if (patternName === undefined) {
                throw new QueryApiError('INVALID_ARGUMENT', '--pattern requires a value');
            }
            i++;
        }
        else if (arg === '--session') {
            const val = ctx.subArgs[i + 1];
            if (val !== undefined && VALID_HANDOFF_SESSION_TYPES.has(val)) {
                sessionType = val;
            }
            else {
                throw new QueryApiError('INVALID_ARGUMENT', `--session must be "planning", "design", "implement", or "review", got: "${val ?? ''}"`);
            }
            i++;
        }
        else if (arg === '--git') {
            useGit = true;
        }
    }
    // Also accept from top-level parsed --session
    if (sessionType === undefined && ctx.sessionType !== null) {
        sessionType = ctx.sessionType;
    }
    // Pattern name uses --pattern flag (not positional) to avoid ambiguity with --git and --session
    if (patternName === undefined) {
        throw new QueryApiError('INVALID_ARGUMENT', 'Usage: process-api handoff --pattern <name> [--git] [--session planning|design|implement|review]');
    }
    // DD-2: git integration is opt-in — CLI handler owns the shell call
    let modifiedFiles;
    if (useGit) {
        try {
            const output = execSync('git diff --name-only HEAD', { encoding: 'utf-8' });
            modifiedFiles = output
                .trim()
                .split('\n')
                .filter((line) => line.length > 0);
        }
        catch {
            // git not available or not a git repo — silently omit
            modifiedFiles = undefined;
        }
    }
    const options = { patternName };
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
async function routeSubcommand(ctx) {
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
                const input = {
                    kind: 'patterns',
                    data: result,
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
        case 'tags':
            return aggregateTagUsage(ctx.dataset);
        case 'sources':
            return buildSourceInventory(ctx.dataset);
        case 'unannotated': {
            let pathFilter;
            for (let i = 0; i < ctx.subArgs.length; i++) {
                if (ctx.subArgs[i] === '--path') {
                    pathFilter = ctx.subArgs[i + 1];
                    break;
                }
            }
            try {
                return await findUnannotatedFiles(ctx.cliConfig.input, ctx.cliConfig.baseDir, ctx.registry, pathFilter);
            }
            catch (err) {
                throw new QueryApiError('INVALID_ARGUMENT', `Unannotated file scan failed: ${err instanceof Error ? err.message : String(err)}`);
            }
        }
        default:
            throw new QueryApiError('UNKNOWN_METHOD', `Unknown subcommand: ${ctx.subcommand}\nAvailable: context, files, dep-tree, overview, scope-validate, handoff, status, query, pattern, list, search, arch, stubs, decisions, pdr, tags, sources, unannotated`);
    }
}
// =============================================================================
// Main
// =============================================================================
async function main() {
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
    // Resolve config file defaults if --input and --features not provided
    applyConfigDefaults(opts);
    if (opts.input.length === 0) {
        console.error('Error: --input is required (or place delivery-process.config.ts in cwd for auto-detection)');
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
    }
    else {
        const envelope = createSuccess(result, masterDataset.counts.total);
        const output = formatOutput(envelope, opts.format);
        console.log(output);
    }
}
void main().catch((error) => {
    // QueryApiError -> structured error envelope
    if (error instanceof QueryApiError) {
        const envelope = createError(error.code, error.message);
        console.log(JSON.stringify(envelope, null, 2));
        process.exit(1);
        return;
    }
    handleCliError(error, 1);
});
//# sourceMappingURL=process-api.js.map