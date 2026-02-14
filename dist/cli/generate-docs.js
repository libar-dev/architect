#!/usr/bin/env node
/**
 * @libar-docs
 * @libar-docs-core @libar-docs-cli
 * @libar-docs-pattern Documentation Generator CLI
 * @libar-docs-status completed
 * @libar-docs-uses Orchestrator, Generator Registry
 * @libar-docs-used-by npm scripts, CI pipelines
 * @libar-docs-usecase "When generating documentation from command line"
 * @libar-docs-usecase "When integrating doc generation into npm scripts"
 * @libar-docs-extract-shapes CLIConfig
 *
 * ## generate-docs - Single Entry Point for All Documentation Generation
 *
 * Replaces multiple specialized CLIs with one unified interface that supports
 * multiple generators in a single run.
 *
 * ### When to Use
 *
 * - Generating any documentation from annotated TypeScript source
 * - Running multiple generators in one command
 * - Using delivery-process.config.ts for reproducible builds
 *
 * ### Key Concepts
 *
 * - **Multi-Generator**: Run patterns, adrs, overview, custom generators together
 * - **Explicit Registration**: Generators must be registered before use
 */
import * as path from 'path';
import { generatorRegistry } from '../generators/registry.js';
import { generateDocumentation, generateFromConfig } from '../generators/orchestrator.js';
import { loadProjectConfig } from '../config/config-loader.js';
import { printVersionAndExit } from './version.js';
// Import built-in generators (registers patterns, adrs, overview)
import '../generators/built-in/index.js';
function parseArgs(argv = process.argv.slice(2)) {
    const config = {
        input: [],
        exclude: [],
        output: 'docs/architecture',
        baseDir: process.cwd(),
        generators: ['patterns'],
        overwrite: false,
        features: [],
        workflowPath: null,
        listGenerators: false,
        help: false,
        version: false,
        // PR Changes options
        gitDiffBase: null,
        changedFiles: [],
        releaseFilter: null,
        generatorsExplicit: false,
    };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        const nextArg = argv[i + 1];
        switch (arg) {
            case '-i':
            case '--input':
                if (!nextArg || nextArg.startsWith('-')) {
                    throw new Error(`${arg} requires a value`);
                }
                config.input.push(nextArg);
                i++;
                break;
            case '-e':
            case '--exclude':
                if (!nextArg || nextArg.startsWith('-')) {
                    throw new Error(`${arg} requires a value`);
                }
                config.exclude.push(nextArg);
                i++;
                break;
            case '-o':
            case '--output':
                if (!nextArg || nextArg.startsWith('-')) {
                    throw new Error(`${arg} requires a value`);
                }
                config.output = nextArg;
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
            case '-g':
            case '--generators':
                if (!nextArg || nextArg.startsWith('-')) {
                    throw new Error(`${arg} requires a value`);
                }
                // Replace default if generators are specified
                if (config.generators.length === 1 && config.generators[0] === 'patterns') {
                    config.generators = [];
                }
                config.generators.push(nextArg);
                config.generatorsExplicit = true;
                i++;
                break;
            case '-f':
            case '--overwrite':
                config.overwrite = true;
                break;
            case '--features':
                if (!nextArg || nextArg.startsWith('-')) {
                    throw new Error(`${arg} requires a value`);
                }
                config.features.push(nextArg);
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
            case '--list-generators':
                config.listGenerators = true;
                break;
            case '-h':
            case '--help':
                config.help = true;
                break;
            case '-v':
            case '--version':
                config.version = true;
                break;
            // PR Changes options
            case '--git-diff-base':
                if (!nextArg || nextArg.startsWith('-')) {
                    throw new Error(`${arg} requires a value (e.g., main, develop)`);
                }
                config.gitDiffBase = nextArg;
                i++;
                break;
            case '--changed-files':
                if (!nextArg || nextArg.startsWith('-')) {
                    throw new Error(`${arg} requires a value`);
                }
                config.changedFiles.push(nextArg);
                i++;
                break;
            case '--release-filter':
                if (!nextArg || nextArg.startsWith('-')) {
                    throw new Error(`${arg} requires a value (e.g., v0.2.0)`);
                }
                config.releaseFilter = nextArg;
                i++;
                break;
            default:
                throw new Error(`Unknown option: ${arg ?? ''}`);
        }
    }
    return config;
}
function showHelp() {
    console.log(`
Usage: generate-docs [options]

Generate documentation from annotated TypeScript source code.

Options:
  -i, --input <pattern>        Glob patterns for TypeScript files (repeatable)
  -e, --exclude <pattern>      Glob patterns to exclude (repeatable)
  -o, --output <dir>           Output directory (default: docs/architecture)
  -b, --base-dir <dir>         Base directory for relative paths (default: cwd)
  -g, --generators <names>     Generators to run (repeatable, default: patterns)
  -w, --workflow <file>        Workflow config JSON file (default: 6-phase-standard)
  -f, --overwrite              Overwrite existing files
  --features <pattern>         Glob pattern for .feature files
  --list-generators            List available generators and exit
  -h, --help                   Show this help message
  -v, --version                Show version number

PR Changes Options (for -g pr-changes):
  --git-diff-base <branch>     Base branch for git diff (e.g., main)
  --changed-files <file>       Explicit file list (repeatable, overrides git)
  --release-filter <version>   Filter by release version (e.g., v0.2.0)

  When delivery-process.config.ts provides sources, --input is optional.
  CLI flags override config when both are provided.

Examples:
  generate-docs -i "src/**/*.ts" -o docs
  generate-docs -i "src/**/*.ts" -g patterns -g adrs -f
  generate-docs --list-generators

PR Changes Examples:
  generate-docs -g pr-changes --git-diff-base main -o docs-living -f
  generate-docs -g pr-changes --release-filter v0.2.0 -o docs-living -f
  generate-docs -g pr-changes --changed-files src/foo.ts --changed-files src/bar.ts -o docs
`);
}
async function main() {
    const opts = parseArgs();
    // Show version
    if (opts.version) {
        printVersionAndExit('generate-docs');
    }
    // Show help
    if (opts.help) {
        showHelp();
        return;
    }
    // List generators
    if (opts.listGenerators) {
        console.log('Available generators:');
        const available = generatorRegistry.available();
        if (available.length === 0) {
            console.log('  (none registered)');
            console.log('');
            console.log('Tip: Ensure built-in generators are imported in your code.');
        }
        else {
            for (const name of available) {
                const gen = generatorRegistry.get(name);
                console.log(`  - ${name}: ${gen?.description ?? '(no description)'}`);
            }
        }
        return;
    }
    const baseDir = path.resolve(opts.baseDir);
    // Load project config
    const configResult = await loadProjectConfig(baseDir);
    if (!configResult.ok) {
        console.error(`Error loading config: ${configResult.error.message}`);
        process.exit(1);
    }
    const resolvedConfig = configResult.value;
    if (resolvedConfig.isDefault) {
        console.log('  (No delivery-process.config.ts found; using defaults)');
    }
    // Determine generators to run (CLI -g overrides config)
    const effectiveGenerators = (opts.generatorsExplicit ? opts.generators : [...resolvedConfig.project.generators]).flatMap((g) => g.split(','));
    const input = opts.input;
    const exclude = opts.exclude.length > 0 ? opts.exclude : undefined;
    const features = opts.features.length > 0 ? opts.features : undefined;
    let result;
    if (input.length > 0) {
        // CLI flags provided — use legacy path (explicit overrides)
        console.log('Scanning source files...');
        result = await generateDocumentation({
            input,
            ...(exclude ? { exclude } : {}),
            baseDir,
            outputDir: opts.output,
            generators: effectiveGenerators,
            overwrite: opts.overwrite,
            ...(features ? { features } : {}),
            ...(opts.workflowPath ? { workflowPath: opts.workflowPath } : {}),
            ...(opts.gitDiffBase ? { gitDiffBase: opts.gitDiffBase } : {}),
            ...(opts.changedFiles.length > 0 ? { changedFiles: opts.changedFiles } : {}),
            ...(opts.releaseFilter ? { releaseFilter: opts.releaseFilter } : {}),
        });
    }
    else if (resolvedConfig.project.sources.typescript.length > 0) {
        // No CLI input — use config-based sources
        console.log('Using sources from delivery-process.config.ts...');
        console.log('Scanning source files...');
        result = await generateFromConfig(resolvedConfig, {
            generators: effectiveGenerators,
            ...(opts.gitDiffBase ? { gitDiffBase: opts.gitDiffBase } : {}),
            ...(opts.changedFiles.length > 0 ? { changedFiles: opts.changedFiles } : {}),
            ...(opts.releaseFilter ? { releaseFilter: opts.releaseFilter } : {}),
        });
    }
    else {
        console.error('Error: No source files specified.');
        console.error('');
        console.error('Either provide --input flags or configure sources in delivery-process.config.ts:');
        console.error('');
        console.error('  // delivery-process.config.ts');
        console.error('  import { defineConfig } from "@libar-dev/delivery-process/config";');
        console.error('  export default defineConfig({');
        console.error('    sources: { typescript: ["src/**/*.ts"] }');
        console.error('  });');
        process.exit(1);
    }
    if (!result.ok) {
        console.error(`Error: ${result.error}`);
        process.exit(1);
    }
    const { patterns, files, warnings, errors } = result.value;
    // Report scan/extraction warnings
    for (const warning of warnings) {
        if (warning.type === 'scan') {
            console.warn(`  ⚠ ${warning.message}`);
            // Display detailed error information if available
            if (warning.details && warning.details.length > 0) {
                for (const detail of warning.details) {
                    const location = detail.line !== undefined
                        ? `:${detail.line}${detail.column !== undefined ? `:${detail.column}` : ''}`
                        : '';
                    console.warn(`    - ${detail.file}${location}`);
                    console.warn(`      ${detail.message}`);
                }
            }
        }
    }
    console.log(`  Found ${patterns.length} patterns`);
    // Report extraction warnings
    for (const warning of warnings) {
        if (warning.type === 'extraction') {
            console.warn(`  ⚠ ${warning.message}`);
        }
    }
    console.log('Extracting patterns...');
    console.log(`  Extracted ${patterns.length} patterns`);
    // Run generators and report results
    const generatorNames = [...new Set(effectiveGenerators)];
    for (const generatorName of generatorNames) {
        const trimmedName = generatorName.trim();
        console.log(`\nRunning generator: ${trimmedName}`);
        // Check for generator errors
        const generatorErrors = errors.filter((e) => e.generator === trimmedName);
        if (generatorErrors.length > 0) {
            for (const error of generatorErrors) {
                console.error(`  ✗ ${error.message}`);
            }
            continue;
        }
        // Report files written by this generator
        const generatorFiles = files.filter((f) => f.generator === trimmedName);
        const writtenFiles = generatorFiles.filter((f) => f.written);
        const skippedFiles = generatorFiles.filter((f) => !f.written);
        for (const file of writtenFiles) {
            console.log(`  ✓ ${file.path}`);
        }
        for (const file of skippedFiles) {
            console.warn(`  ⚠ Skipping ${file.path} (exists, use -f to overwrite)`);
        }
    }
    // Report any file write errors
    const fileWriteErrors = errors.filter((e) => e.type === 'file-write');
    if (fileWriteErrors.length > 0) {
        console.error('\nFile write errors:');
        for (const error of fileWriteErrors) {
            console.error(`  ✗ ${error.message}`);
        }
    }
    // Summary
    const successCount = files.filter((f) => f.written).length;
    const skippedCount = files.filter((f) => !f.written).length;
    console.log('\n✅ Documentation generation complete!');
    console.log(`   ${successCount} files written${skippedCount > 0 ? `, ${skippedCount} skipped` : ''}`);
}
void main();
//# sourceMappingURL=generate-docs.js.map