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
 * @libar-docs-uses ProcessStateAPI, MasterDataset, Pattern Scanner, Doc Extractor, Gherkin Scanner, Gherkin Extractor
 * @libar-docs-used-by npm scripts, Claude Code sessions
 * @libar-docs-usecase "When querying delivery process state from CLI"
 * @libar-docs-usecase "When Claude Code needs real-time delivery state queries"
 *
 * ## process-api - CLI Query Interface to ProcessStateAPI
 *
 * Exposes ProcessStateAPI methods as CLI subcommands with JSON output.
 * Runs pipeline steps 1-8 (config → scan → extract → transform),
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
 */
import * as path from 'path';
import { loadConfig, formatConfigError } from '../config/config-loader.js';
import { DEFAULT_CONTEXT_INFERENCE_RULES } from '../config/defaults.js';
import { scanPatterns } from '../scanner/index.js';
import { extractPatterns } from '../extractor/doc-extractor.js';
import { scanGherkinFiles } from '../scanner/gherkin-scanner.js';
import { extractPatternsFromGherkin, computeHierarchyChildren, } from '../extractor/gherkin-extractor.js';
import { mergePatterns } from '../generators/orchestrator.js';
import { loadDefaultWorkflow, loadWorkflowFromPath } from '../config/workflow-loader.js';
import { transformToMasterDataset } from '../generators/pipeline/index.js';
import { createProcessStateAPI } from '../api/process-state.js';
import { handleCliError } from './error-handler.js';
import { printVersionAndExit } from './version.js';
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
    };
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
  --features <pattern>    Glob patterns for .feature files (repeatable)
  -b, --base-dir <dir>    Base directory (default: cwd)
  -w, --workflow <file>   Workflow config JSON file
  -h, --help              Show this help message
  -v, --version           Show version number

Subcommands:
  status                    Status counts and completion percentage
  query <method> [args...]  Execute any ProcessStateAPI method
  pattern <name>            Full detail for one pattern
  arch roles                List all arch-roles with counts
  arch context [name]       Patterns in bounded context (list all if no name)
  arch layer [name]         Patterns in architecture layer (list all if no name)
  arch graph <pattern>      Dependency graph for pattern

Examples:
  process-api -i "src/**/*.ts" --features "specs/*.feature" status
  process-api -i "src/**/*.ts" query getCurrentWork
  process-api -i "src/**/*.ts" query getPatternsByPhase 18
  process-api -i "src/**/*.ts" query isValidTransition roadmap active
  process-api -i "src/**/*.ts" pattern ProcessGuardLinter
  process-api -i "src/**/*.ts" arch roles
  process-api -i "src/**/*.ts" arch context validation

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
// Pipeline (Steps 1-8)
// =============================================================================
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
    // Step 8: Transform to MasterDataset
    const masterDataset = transformToMasterDataset({
        patterns: allPatterns,
        tagRegistry: registry,
        workflow,
        contextInferenceRules: DEFAULT_CONTEXT_INFERENCE_RULES,
    });
    return masterDataset;
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
        console.error('Usage: process-api query <method> [args...]');
        console.error(`Methods: ${API_METHODS.join(', ')}`);
        process.exit(1);
    }
    if (!API_METHODS.includes(methodName)) {
        console.error(`Unknown API method: ${methodName}`);
        console.error(`Available: ${API_METHODS.join(', ')}`);
        process.exit(1);
    }
    // Safe to cast: we validated methodName is in API_METHODS above
    const apiRecord = api;
    const method = apiRecord[methodName];
    if (method === undefined) {
        console.error(`Method not found on API: ${methodName}`);
        process.exit(1);
    }
    const coercedArgs = args.slice(1).map(coerceArg);
    return method.apply(api, coercedArgs);
}
function handlePattern(api, args) {
    const name = args[0];
    if (!name) {
        console.error('Usage: process-api pattern <name>');
        process.exit(1);
    }
    const pattern = api.getPattern(name);
    if (!pattern) {
        console.error(`Pattern not found: "${name}"`);
        process.exit(1);
    }
    return {
        ...pattern,
        deliverables: api.getPatternDeliverables(name),
        dependencies: api.getPatternDependencies(name),
        relationships: api.getPatternRelationships(name),
    };
}
function handleArch(api, args) {
    const subCmd = args[0];
    const dataset = api.getMasterDataset();
    const archIndex = dataset.archIndex;
    if (!archIndex || archIndex.all.length === 0) {
        console.error('No architecture data available. Ensure patterns have @libar-docs-arch-role annotations.');
        process.exit(1);
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
                return Object.entries(archIndex.byContext).map(([ctx, patterns]) => ({
                    context: ctx,
                    count: patterns.length,
                    patterns: patterns.map((p) => p.name),
                }));
            }
            const contextPatterns = archIndex.byContext[contextName];
            if (!contextPatterns) {
                console.error(`Context not found: "${contextName}"`);
                console.error(`Available: ${Object.keys(archIndex.byContext).join(', ')}`);
                process.exit(1);
            }
            return contextPatterns;
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
                console.error(`Layer not found: "${layerName}"`);
                console.error(`Available: ${Object.keys(archIndex.byLayer).join(', ')}`);
                process.exit(1);
            }
            return layerPatterns;
        }
        case 'graph': {
            const patternName = args[1];
            if (!patternName) {
                console.error('Usage: process-api arch graph <pattern>');
                process.exit(1);
            }
            const dependencies = api.getPatternDependencies(patternName);
            const relationships = api.getPatternRelationships(patternName);
            if (!dependencies && !relationships) {
                console.error(`Pattern not found: "${patternName}"`);
                process.exit(1);
            }
            return { pattern: patternName, dependencies, relationships };
        }
        default:
            console.error(`Unknown arch subcommand: ${subCmd ?? '(none)'}`);
            console.error('Available: roles, context [name], layer [name], graph <pattern>');
            process.exit(1);
    }
}
// =============================================================================
// Subcommand Router
// =============================================================================
function routeSubcommand(api, subcommand, subArgs) {
    switch (subcommand) {
        case 'status':
            return handleStatus(api);
        case 'query':
            return handleQuery(api, subArgs);
        case 'pattern':
            return handlePattern(api, subArgs);
        case 'arch':
            return handleArch(api, subArgs);
        default:
            console.error(`Unknown subcommand: ${subcommand}`);
            console.error('Available: status, query, pattern, arch');
            process.exit(1);
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
    if (opts.input.length === 0) {
        console.error('Error: --input is required');
        console.error('');
        console.error('Example:');
        console.error('  process-api -i "src/**/*.ts" status');
        process.exit(1);
    }
    // Build pipeline (steps 1-8)
    const masterDataset = await buildPipeline(opts);
    // Create ProcessStateAPI
    const api = createProcessStateAPI(masterDataset);
    // Route and execute subcommand
    const result = routeSubcommand(api, opts.subcommand, opts.subArgs);
    // Output JSON to stdout
    console.log(JSON.stringify(result, null, 2));
}
void main().catch((error) => {
    handleCliError(error, 1);
});
//# sourceMappingURL=process-api.js.map