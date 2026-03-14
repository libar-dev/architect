#!/usr/bin/env node

/**
 * @libar-docs
 * @libar-docs-cli
 * @libar-docs-pattern TagTaxonomyCLI
 * @libar-docs-status deferred
 * @libar-docs-uses ConfigLoader, TagTaxonomyGenerator
 * @libar-docs-extract-shapes CLIConfig
 *
 * ## TagTaxonomyCLI - Tag Registry Documentation Generator
 *
 * @deprecated Use `pnpm docs:taxonomy` instead. This standalone CLI is replaced
 * by the codec-based TaxonomyCodec which:
 * - Fits the MasterDataset pipeline architecture
 * - Provides progressive disclosure with detail files
 * - Groups tags by domain (Core, Relationship, Timeline, ADR, Architecture)
 * - Includes presets comparison and architecture diagrams
 *
 * Generates TAG_TAXONOMY.md from the TypeScript taxonomy module.
 * Use to auto-generate comprehensive tag reference documentation.
 *
 * ### When to Use
 *
 * - Use after modifying src/taxonomy/ to update documentation
 * - Use to generate human-readable tag reference from TypeScript config
 * - Use in documentation regeneration workflows
 */

// ─── Error Convention ───────────────────────────────────────────────────
// CLI modules use throw/catch + process.exit(). Pipeline modules use Result<T,E>.
// See src/cli/error-handler.ts for the unified handler.
// ────────────────────────────────────────────────────────────────────────

import * as fs from 'fs/promises';
import * as path from 'path';
import { loadConfig, formatConfigError } from '../config/config-loader.js';
import { generateTagTaxonomy } from '../config/tag-taxonomy-generator.js';
import { printVersionAndExit } from './version.js';

/**
 * CLI configuration
 */
interface CLIConfig {
  /** Output path for TAG_TAXONOMY.md (-o, --output). Default: docs/architecture/TAG_TAXONOMY.md */
  output: string;
  /** Base directory for path resolution (-b, --base-dir). Default: cwd */
  baseDir: string;
  /** Overwrite existing file (-f, --overwrite). Default: false */
  overwrite: boolean;
  /** Show help message (-h, --help). */
  help: boolean;
  /** Show version number (-v, --version). */
  version: boolean;
}

/**
 * Parse command line arguments
 *
 * @param argv - Command line arguments (defaults to process.argv.slice(2))
 * @returns Parsed CLI configuration
 */
function parseArgs(argv: string[] = process.argv.slice(2)): CLIConfig {
  const config: CLIConfig = {
    output: 'docs/architecture/TAG_TAXONOMY.md',
    baseDir: process.cwd(),
    overwrite: false,
    help: false,
    version: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--help' || arg === '-h') {
      config.help = true;
    } else if (arg === '--output' || arg === '-o') {
      const nextArg = argv[++i];
      if (!nextArg) {
        throw new Error(`Missing value for ${arg} flag`);
      }
      config.output = nextArg;
    } else if (arg === '--base-dir' || arg === '-b') {
      const nextArg = argv[++i];
      if (!nextArg) {
        throw new Error(`Missing value for ${arg} flag`);
      }
      config.baseDir = nextArg;
    } else if (arg === '--overwrite' || arg === '-f') {
      config.overwrite = true;
    } else if (arg === '--version' || arg === '-v') {
      config.version = true;
    } else if (arg?.startsWith('-') === true) {
      console.warn(`Warning: Unknown flag '${arg}' ignored`);
    }
  }

  return config;
}

/**
 * Print usage information
 */
function printHelp(): void {
  console.log(`
generate-tag-taxonomy - Generate TAG_TAXONOMY.md from configuration

Usage:
  generate-tag-taxonomy [options]

Options:
  -o, --output <path>        Output path for TAG_TAXONOMY.md (default: docs/architecture/TAG_TAXONOMY.md)
  -b, --base-dir <dir>       Base directory for path resolution (default: cwd)
  -f, --overwrite            Overwrite existing file
  -h, --help                 Show this help message
  -v, --version              Show version number

Configuration:
  Uses delivery-process.config.ts for taxonomy configuration.
  Falls back to libar-generic preset (3 categories) if no config file found.

Examples:
  # Generate using discovered config or default
  generate-tag-taxonomy

  # Custom output path
  generate-tag-taxonomy -o docs/TAG_TAXONOMY.md

  # Overwrite existing file
  generate-tag-taxonomy -f
  `);
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  const config = parseArgs();

  if (config.version) {
    printVersionAndExit('generate-tag-taxonomy');
  }

  if (config.help) {
    printHelp();
    process.exit(0);
  }

  // Deprecation warning
  console.warn('\n⚠️  DEPRECATED: generate-tag-taxonomy is deprecated.');
  console.warn('   Use `pnpm docs:taxonomy` instead for codec-based generation.');
  console.warn('   The new approach provides progressive disclosure, domain grouping,');
  console.warn('   and fits the MasterDataset pipeline architecture.\n');

  try {
    console.log('Loading configuration...');

    // Load configuration (discovers delivery-process.config.ts)
    const configResult = await loadConfig(config.baseDir);
    if (!configResult.ok) {
      console.error(formatConfigError(configResult.error));
      process.exit(1);
    }

    const { instance: dpInstance, isDefault, path: configPath } = configResult.value;
    const tagRegistry = dpInstance.registry;
    const sourcePath =
      !isDefault && configPath
        ? path.relative(config.baseDir, configPath)
        : '(default libar-generic preset)';
    console.log(`  Loaded: ${sourcePath}`);

    // Check if output file exists
    const outputPath = path.isAbsolute(config.output)
      ? config.output
      : path.join(config.baseDir, config.output);

    if (!config.overwrite) {
      try {
        await fs.access(outputPath);
        console.error(`Error: Output file already exists: ${outputPath}`);
        console.error('Use --overwrite (-f) to replace it');
        process.exit(1);
      } catch {
        // File doesn't exist, proceed
      }
    }

    // Generate taxonomy markdown
    console.log('Generating TAG_TAXONOMY.md...');
    const markdown = generateTagTaxonomy(tagRegistry, {
      sourcePath: sourcePath,
    });

    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // Write file
    await fs.writeFile(outputPath, markdown, 'utf-8');

    console.log(`\n✓ Generated: ${path.relative(config.baseDir, outputPath)}`);
    console.log(`  Categories: ${tagRegistry.categories.length}`);
    console.log(`  Metadata tags: ${tagRegistry.metadataTags.length}`);
    console.log(`  Aggregation tags: ${tagRegistry.aggregationTags.length}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message);
      if (process.env['DEBUG']) {
        console.error('Stack trace:', error.stack);
      }
    } else {
      console.error('Error:', String(error));
    }
    process.exit(1);
  }
}

// Entry point
void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
