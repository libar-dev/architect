#!/usr/bin/env node
/**
 * @libar-docs
 * @libar-docs-cli
 * @libar-docs-pattern TagTaxonomyCLI
 * @libar-docs-status completed
 * @libar-docs-uses TagRegistryLoader, TagTaxonomyGenerator
 *
 * ## TagTaxonomyCLI - Tag Registry Documentation Generator
 *
 * Generates TAG_TAXONOMY.md from tag-registry.json.
 * Use to auto-generate comprehensive tag reference documentation.
 *
 * ### When to Use
 *
 * - Use after modifying tag-registry.json to update documentation
 * - Use to generate human-readable tag reference from JSON config
 * - Use in documentation regeneration workflows
 */
import * as fs from "fs/promises";
import * as path from "path";
import { loadConfig, formatConfigError } from "../config/config-loader.js";
import { generateTagTaxonomy } from "../config/tag-taxonomy-generator.js";
import { printVersionAndExit } from "./version.js";
/**
 * Parse command line arguments
 *
 * @param argv - Command line arguments (defaults to process.argv.slice(2))
 * @returns Parsed CLI configuration
 */
function parseArgs(argv = process.argv.slice(2)) {
    const config = {
        output: "docs/architecture/TAG_TAXONOMY.md",
        baseDir: process.cwd(),
        overwrite: false,
        help: false,
        version: false,
    };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === "--help" || arg === "-h") {
            config.help = true;
        }
        else if (arg === "--output" || arg === "-o") {
            const nextArg = argv[++i];
            if (!nextArg) {
                throw new Error(`Missing value for ${arg} flag`);
            }
            config.output = nextArg;
        }
        else if (arg === "--base-dir" || arg === "-b") {
            const nextArg = argv[++i];
            if (!nextArg) {
                throw new Error(`Missing value for ${arg} flag`);
            }
            config.baseDir = nextArg;
        }
        else if (arg === "--overwrite" || arg === "-f") {
            config.overwrite = true;
        }
        else if (arg === "--version" || arg === "-v") {
            config.version = true;
        }
        else if (arg?.startsWith("-") === true) {
            console.warn(`Warning: Unknown flag '${arg}' ignored`);
        }
    }
    return config;
}
/**
 * Print usage information
 */
function printHelp() {
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
  Falls back to default DDD-ES-CQRS taxonomy if no config file found.

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
async function main() {
    const config = parseArgs();
    if (config.version) {
        printVersionAndExit("generate-tag-taxonomy");
    }
    if (config.help) {
        printHelp();
        process.exit(0);
    }
    try {
        console.log("Loading configuration...");
        // Load configuration (discovers delivery-process.config.ts)
        const configResult = await loadConfig(config.baseDir);
        if (!configResult.ok) {
            console.error(formatConfigError(configResult.error));
            process.exit(1);
        }
        const { instance: dpInstance, isDefault, path: configPath } = configResult.value;
        const tagRegistry = dpInstance.registry;
        const sourcePath = !isDefault && configPath ? configPath : "(default DDD-ES-CQRS taxonomy)";
        console.log(`  Loaded: ${sourcePath}`);
        // Check if output file exists
        const outputPath = path.isAbsolute(config.output)
            ? config.output
            : path.join(config.baseDir, config.output);
        if (!config.overwrite) {
            try {
                await fs.access(outputPath);
                console.error(`Error: Output file already exists: ${outputPath}`);
                console.error("Use --overwrite (-f) to replace it");
                process.exit(1);
            }
            catch {
                // File doesn't exist, proceed
            }
        }
        // Generate taxonomy markdown
        console.log("Generating TAG_TAXONOMY.md...");
        const markdown = generateTagTaxonomy(tagRegistry, {
            sourcePath: sourcePath,
        });
        // Ensure output directory exists
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        // Write file
        await fs.writeFile(outputPath, markdown, "utf-8");
        console.log(`\n✓ Generated: ${path.relative(config.baseDir, outputPath)}`);
        console.log(`  Categories: ${tagRegistry.categories.length}`);
        console.log(`  Metadata tags: ${tagRegistry.metadataTags.length}`);
        console.log(`  Aggregation tags: ${tagRegistry.aggregationTags.length}`);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error("Error:", error.message);
            if (process.env["DEBUG"]) {
                console.error("Stack trace:", error.stack);
            }
        }
        else {
            console.error("Error:", String(error));
        }
        process.exit(1);
    }
}
// Entry point
void main();
//# sourceMappingURL=generate-tag-taxonomy.js.map