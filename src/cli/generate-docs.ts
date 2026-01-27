#!/usr/bin/env node
/**
 * @libar-docs
 * @libar-docs-core @libar-docs-cli
 * @libar-docs-pattern Documentation Generator CLI
 * @libar-docs-status completed
 * @libar-docs-uses Orchestrator, Generator Registry, Tag Registry Loader, Artefact Set Loader
 * @libar-docs-used-by npm scripts, CI pipelines
 * @libar-docs-usecase "When generating documentation from command line"
 * @libar-docs-usecase "When integrating doc generation into npm scripts"
 * @libar-docs-usecase "When using JSON config files for reproducible builds"
 * @libar-docs-usecase "When using predefined artefact sets for quick setup"
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
 * - Using JSON config files for reproducible builds
 * - Using predefined artefact sets (--artefact-set minimal, --artefact-set full)
 *
 * ### Key Concepts
 *
 * - **Multi-Generator**: Run patterns, adrs, overview, custom generators together
 * - **Config Files**: JSON configuration for complex setups
 * - **Explicit Registration**: Generators must be registered before use
 * - **Artefact Sets**: Predefined generator groupings for common use cases
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { generatorRegistry } from '../generators/registry.js';
import { generateDocumentation } from '../generators/orchestrator.js';
import { GeneratorsConfigFileSchema } from '../validation-schemas/generator-config.js';
import type { GeneratorsConfigFile } from '../validation-schemas/generator-config.js';
import {
  loadArtefactSet,
  listAvailableArtefactSets,
  formatArtefactSetError,
} from '../config/artefact-set-loader.js';
import { printVersionAndExit } from './version.js';

// Import built-in generators (registers patterns, adrs, overview)
import '../generators/built-in/index.js';

interface CLIConfig {
  input: string[];
  exclude: string[];
  output: string;
  baseDir: string;
  tagRegistryPath: string | null;
  configPath: string | null;
  generators: string[];
  artefactSet: string | null;
  overwrite: boolean;
  features: string[];
  workflowPath: string | null;
  listGenerators: boolean;
  listArtefactSets: boolean;
  help: boolean;
  version: boolean;
  // PR Changes options
  gitDiffBase: string | null;
  changedFiles: string[];
  releaseFilter: string | null;
}

function parseArgs(argv: string[] = process.argv.slice(2)): CLIConfig {
  const config: CLIConfig = {
    input: [],
    exclude: [],
    output: 'docs/architecture',
    baseDir: process.cwd(),
    tagRegistryPath: null,
    configPath: null,
    generators: ['patterns'],
    artefactSet: null,
    overwrite: false,
    features: [],
    workflowPath: null,
    listGenerators: false,
    listArtefactSets: false,
    help: false,
    version: false,
    // PR Changes options
    gitDiffBase: null,
    changedFiles: [],
    releaseFilter: null,
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

      case '-R':
      case '--tag-registry':
        if (!nextArg || nextArg.startsWith('-')) {
          throw new Error(`${arg} requires a value`);
        }
        config.tagRegistryPath = nextArg;
        i++;
        break;

      case '-c':
      case '--config':
        if (!nextArg || nextArg.startsWith('-')) {
          throw new Error(`${arg} requires a value`);
        }
        config.configPath = nextArg;
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

      case '-a':
      case '--artefact-set':
        if (!nextArg || nextArg.startsWith('-')) {
          throw new Error(`${arg} requires a value`);
        }
        config.artefactSet = nextArg;
        i++;
        break;

      case '--list-artefact-sets':
        config.listArtefactSets = true;
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

function showHelp(): void {
  console.log(`
Usage: generate-docs [options]

Generate documentation from annotated TypeScript source code.

Options:
  -i, --input <pattern>        Glob patterns for TypeScript files (repeatable)
  -e, --exclude <pattern>      Glob patterns to exclude (repeatable)
  -o, --output <dir>           Output directory (default: docs/architecture)
  -b, --base-dir <dir>         Base directory for relative paths (default: cwd)
  -R, --tag-registry <file>    Tag registry JSON file (auto-discovers if not specified)
  -c, --config <file>          Generator config JSON file
  -g, --generators <names>     Generators to run (repeatable, default: patterns)
  -a, --artefact-set <name>    Use predefined artefact set (overrides --generators)
  -w, --workflow <file>        Workflow config JSON file (default: 6-phase-standard)
  -f, --overwrite              Overwrite existing files
  --features <pattern>         Glob pattern for .feature files
  --list-generators            List available generators and exit
  --list-artefact-sets         List available artefact sets and exit
  -h, --help                   Show this help message
  -v, --version                Show version number

PR Changes Options (for -g pr-changes):
  --git-diff-base <branch>     Base branch for git diff (e.g., main)
  --changed-files <file>       Explicit file list (repeatable, overrides git)
  --release-filter <version>   Filter by release version (e.g., v0.2.0)

Artefact Sets:
  Predefined generator groupings for common use cases:
  - minimal-set: Essential timeline artifacts (roadmap, milestones)
  - full-set: All platform and self-documentation generators

Examples:
  generate-docs -i "src/**/*.ts" -o docs
  generate-docs -i "src/**/*.ts" -g patterns -g adrs -f
  generate-docs -i "src/**/*.ts" --artefact-set minimal -f
  generate-docs -c generators.json -f
  generate-docs --list-generators
  generate-docs --list-artefact-sets

PR Changes Examples:
  generate-docs -g pr-changes --git-diff-base main -o docs-living -f
  generate-docs -g pr-changes --release-filter v0.2.0 -o docs-living -f
  generate-docs -g pr-changes --changed-files src/foo.ts --changed-files src/bar.ts -o docs
`);
}

async function main(): Promise<void> {
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
    } else {
      for (const name of available) {
        const gen = generatorRegistry.get(name);
        console.log(`  - ${name}: ${gen?.description ?? '(no description)'}`);
      }
    }
    return;
  }

  // List artefact sets
  if (opts.listArtefactSets) {
    console.log('Available artefact sets:');
    const available = await listAvailableArtefactSets();
    if (available.length === 0) {
      console.log('  (none found)');
      console.log('');
      console.log('Tip: Add JSON files to catalogue/artefact-sets/ directory.');
    } else {
      for (const name of available) {
        const setResult = await loadArtefactSet(name);
        if (setResult.ok) {
          const set = setResult.value;
          console.log(`  - ${name}: ${set.description ?? '(no description)'}`);
          console.log(`      Generators: ${set.generators.join(', ')}`);
        } else {
          console.log(`  - ${name}: (failed to load)`);
        }
      }
    }
    return;
  }

  // Load artefact set if specified
  let generatorsFromArtefactSet: string[] | null = null;
  if (opts.artefactSet) {
    const artefactSetResult = await loadArtefactSet(opts.artefactSet);
    if (!artefactSetResult.ok) {
      console.error(formatArtefactSetError(artefactSetResult.error));
      const available = await listAvailableArtefactSets();
      if (available.length > 0) {
        console.log('\nAvailable artefact sets:');
        for (const name of available) {
          console.log(`  - ${name}`);
        }
      }
      process.exit(1);
    }
    generatorsFromArtefactSet = artefactSetResult.value.generators;
    console.log(`Using artefact set: ${artefactSetResult.value.name}`);
  }

  // Load generator config if provided
  let config: GeneratorsConfigFile | undefined;
  if (opts.configPath) {
    const configContent = await fs.readFile(opts.configPath, 'utf-8');
    const parsed = GeneratorsConfigFileSchema.safeParse(JSON.parse(configContent));
    if (!parsed.success) {
      console.error(`Error: Invalid config file: ${opts.configPath}`);
      console.error('Validation errors:');
      for (const issue of parsed.error.issues) {
        console.error(`  ${issue.path.join('.')}: ${issue.message}`);
      }
      process.exit(1);
    }
    config = parsed.data;
  }

  // Merge CLI options with config file (CLI takes precedence)
  const input = opts.input.length > 0 ? opts.input : (config?.input ?? []);
  const exclude = opts.exclude.length > 0 ? opts.exclude : (config?.exclude ?? undefined);
  const baseDir = path.resolve(opts.baseDir);
  const tagRegistryPath = opts.tagRegistryPath ?? config?.tagRegistry ?? null;
  const features =
    opts.features.length > 0 ? opts.features : config?.features ? [config.features] : undefined;

  if (input.length === 0) {
    console.error('Error: --input is required (or provide via config file)');
    console.error('');
    console.error('Example:');
    console.error('  generate-docs -i "src/**/*.ts" -o docs');
    console.error('  generate-docs -c generators.json');
    process.exit(1);
  }

  // Determine generators to run:
  // Priority: artefact set > CLI --generators > config file > default
  const effectiveGenerators =
    generatorsFromArtefactSet ??
    (opts.generators.length === 1 && opts.generators[0] === 'patterns'
      ? opts.generators // default, may be overridden by config
      : opts.generators.flatMap((g: string) => g.split(',')));

  // Use orchestrator for generation
  console.log('Scanning source files...');

  const result = await generateDocumentation({
    input,
    ...(exclude ? { exclude } : {}),
    baseDir,
    outputDir: opts.output,
    ...(tagRegistryPath ? { tagRegistryPath } : {}),
    generators: effectiveGenerators,
    overwrite: opts.overwrite,
    ...(features ? { features } : {}),
    ...(opts.workflowPath ? { workflowPath: opts.workflowPath } : {}),
    // PR Changes options
    ...(opts.gitDiffBase ? { gitDiffBase: opts.gitDiffBase } : {}),
    ...(opts.changedFiles.length > 0 ? { changedFiles: opts.changedFiles } : {}),
    ...(opts.releaseFilter ? { releaseFilter: opts.releaseFilter } : {}),
  });

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
          const location =
            detail.line !== undefined
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
  console.log(
    `   ${successCount} files written${skippedCount > 0 ? `, ${skippedCount} skipped` : ''}`
  );
}

void main();
