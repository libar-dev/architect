#!/usr/bin/env node

/**
 * @libar-docs
 * @libar-docs-cli
 * @libar-docs-pattern LintPatternsCLI
 * @libar-docs-status completed
 * @libar-docs-uses LintEngine, LintRules, PatternScanner
 *
 * ## LintPatternsCLI - Pattern Annotation Quality Checker
 *
 * Validates pattern annotations for quality and completeness.
 * Use in CI to enforce documentation standards.
 *
 * ### When to Use
 *
 * - Use in CI pipelines to enforce annotation quality
 * - Use locally to check annotations before committing
 * - Use with `--strict` flag to treat warnings as errors
 */

import { fileURLToPath } from "url";
import { printVersionAndExit } from "./version.js";
import { handleCliError } from "./error-handler.js";
import { scanPatterns } from "../scanner/index.js";
import { ScannerConfigSchema } from "../validation-schemas/index.js";
import { loadConfig, formatConfigError } from "../config/config-loader.js";
import {
  defaultRules,
  filterRulesBySeverity,
  lintFiles,
  hasFailures,
  formatPretty,
  formatJson,
  type DirectiveWithLocation,
  type LintSeverity,
} from "../lint/index.js";

/**
 * CLI configuration
 */
export interface LintCLIConfig {
  /** Glob patterns for input files */
  input: string[];
  /** Glob patterns to exclude */
  exclude: string[];
  /** Base directory for path resolution */
  baseDir: string;
  /** Treat warnings as errors */
  strict: boolean;
  /** Output format */
  format: "pretty" | "json";
  /** Only show errors (suppress warnings/info) */
  quiet: boolean;
  /** Minimum severity to report */
  minSeverity: LintSeverity;
  /** Path to tag registry JSON (auto-discovers if not specified) */
  tagRegistryPath: string | null;
  /** Show help */
  help: boolean;
  /** Show version */
  version: boolean;
}

/**
 * Parse command line arguments
 *
 * @param argv - Command line arguments (defaults to process.argv.slice(2))
 * @returns Parsed CLI configuration
 * @throws Error if required flags are missing values
 */
export function parseArgs(argv: string[] = process.argv.slice(2)): LintCLIConfig {
  const config: LintCLIConfig = {
    input: [],
    exclude: [],
    baseDir: process.cwd(),
    strict: false,
    format: "pretty",
    quiet: false,
    minSeverity: "info",
    tagRegistryPath: null,
    help: false,
    version: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--help" || arg === "-h") {
      config.help = true;
    } else if (arg === "--input" || arg === "-i") {
      const nextArg = argv[++i];
      if (!nextArg) {
        throw new Error(`Missing value for ${arg} flag`);
      }
      config.input.push(nextArg);
    } else if (arg === "--exclude" || arg === "-e") {
      const nextArg = argv[++i];
      if (!nextArg) {
        throw new Error(`Missing value for ${arg} flag`);
      }
      config.exclude.push(nextArg);
    } else if (arg === "--base-dir" || arg === "-b") {
      const nextArg = argv[++i];
      if (!nextArg) {
        throw new Error(`Missing value for ${arg} flag`);
      }
      config.baseDir = nextArg;
    } else if (arg === "--strict") {
      config.strict = true;
    } else if (arg === "--format" || arg === "-f") {
      const nextArg = argv[++i];
      if (!nextArg) {
        throw new Error(`Missing value for ${arg} flag`);
      }
      if (nextArg !== "pretty" && nextArg !== "json") {
        throw new Error(`Invalid format: ${nextArg}. Use "pretty" or "json"`);
      }
      config.format = nextArg;
    } else if (arg === "--quiet" || arg === "-q") {
      config.quiet = true;
    } else if (arg === "--min-severity") {
      const nextArg = argv[++i];
      if (!nextArg) {
        throw new Error(`Missing value for ${arg} flag`);
      }
      if (nextArg !== "error" && nextArg !== "warning" && nextArg !== "info") {
        throw new Error(`Invalid severity: ${nextArg}. Use "error", "warning", or "info"`);
      }
      config.minSeverity = nextArg;
    } else if (arg === "--tag-registry" || arg === "-R") {
      const nextArg = argv[++i];
      if (!nextArg) {
        throw new Error(`Missing value for ${arg} flag`);
      }
      config.tagRegistryPath = nextArg;
    } else if (arg === "--version" || arg === "-v") {
      config.version = true;
    } else if (arg?.startsWith("-") === true) {
      console.warn(`Warning: Unknown flag '${arg}' ignored`);
    }
  }

  return config;
}

/**
 * Print usage information
 */
export function printHelp(): void {
  console.log(`
lint-patterns - Validate pattern annotation quality

Usage:
  lint-patterns [options]

Options:
  -i, --input <pattern>     Glob pattern for TypeScript files (required, repeatable)
  -e, --exclude <pattern>   Glob pattern to exclude (repeatable)
  -b, --base-dir <dir>      Base directory for paths (default: cwd)
  -R, --tag-registry <file> Tag registry JSON file (auto-discovers if not specified)
  --strict                  Treat warnings as errors (exit 1 on warnings)
  -f, --format <type>       Output format: "pretty" (default) or "json"
  -q, --quiet               Only show errors (suppress warnings/info)
  --min-severity <level>    Minimum severity to report: error|warning|info (default: info)
  -h, --help                Show this help message
  -v, --version             Show version number

Exit Codes:
  0  No errors (warnings allowed unless --strict)
  1  Errors found (or warnings with --strict)

Lint Rules:
  error    missing-pattern-name      Pattern must have @libar-docs-pattern name
  error    tautological-description  Description should not repeat pattern name
  warning  missing-status            Pattern should have @libar-docs-status
  warning  missing-when-to-use       Pattern should have "When to Use" section
  info     missing-relationships     Consider adding @libar-docs-uses/used-by

Examples:
  # Lint all @libar-dev/platform-* patterns
  lint-patterns -i "packages/@libar-dev/platform-*/src/**/*.ts"

  # Strict mode for CI (fail on warnings)
  lint-patterns -i "packages/@libar-dev/platform-*/src/**/*.ts" --strict

  # JSON output for tooling
  lint-patterns -i "src/**/*.ts" --format json

  # Only show errors
  lint-patterns -i "src/**/*.ts" --quiet
  `);
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  const config = parseArgs();

  if (config.version) {
    printVersionAndExit("lint-patterns");
  }

  if (config.help) {
    printHelp();
    process.exit(0);
  }

  if (config.input.length === 0) {
    console.error("Error: No input patterns specified. Use --input <pattern>");
    printHelp();
    process.exit(1);
  }

  try {
    // Load configuration (discovers delivery-process.config.ts)
    const configResult = await loadConfig(config.baseDir);
    if (!configResult.ok) {
      console.error(formatConfigError(configResult.error));
      process.exit(1);
    }

    const { instance: dpInstance, isDefault, path: configPath } = configResult.value;

    // Log configuration source (for transparency)
    if (!isDefault && configPath) {
      console.log(`  Config: ${configPath}`);
    } else if (config.tagRegistryPath) {
      console.log(`  Tag Registry: ${config.tagRegistryPath}`);
    } else {
      console.log("  Config: (default DDD-ES-CQRS taxonomy)");
    }

    // Scan files for directives
    const scannerConfig = ScannerConfigSchema.parse({
      patterns: config.input,
      exclude: config.exclude.length > 0 ? config.exclude : undefined,
      baseDir: config.baseDir,
    });

    const scanResult = await scanPatterns(scannerConfig, dpInstance.registry);

    // scanPatterns returns Result<ScanResults, never> - it always succeeds
    // with errors collected in scanResult.value.errors.
    // The `ok` check narrows the type to access `.value`
    if (!scanResult.ok) {
      // This branch is unreachable (never type), but satisfies TypeScript
      throw new Error("Unexpected scan failure");
    }
    const { files: scanned, errors: scanErrors, skippedDirectives } = scanResult.value;

    // Report scan errors
    if (scanErrors.length > 0 && config.format === "pretty") {
      console.log(`Warning: ${scanErrors.length} files failed to scan:`);
      for (const { file, error } of scanErrors) {
        console.log(`  - ${file}: ${error.reason}`);
      }
      console.log("");
    }

    // Report skipped directives (these are already validation failures)
    if (skippedDirectives.length > 0 && config.format === "pretty") {
      console.log(`Warning: ${skippedDirectives.length} directives skipped due to validation:`);
      for (const { file, error } of skippedDirectives) {
        console.log(`  - ${file}:${error.line}: ${error.reason}`);
      }
      console.log("");
    }

    // Build map of files to directives
    const fileDirectives = new Map<string, DirectiveWithLocation[]>();

    for (const file of scanned) {
      const directives: DirectiveWithLocation[] = file.directives.map((d) => ({
        directive: d.directive,
        line: d.directive.position.startLine,
      }));

      if (directives.length > 0) {
        fileDirectives.set(file.filePath, directives);
      }
    }

    // Get rules filtered by minimum severity
    const rules = filterRulesBySeverity(defaultRules, config.minSeverity);

    // Run lint
    const summary = lintFiles(fileDirectives, rules);

    // Format and output results
    if (config.format === "json") {
      const jsonResult = formatJson(summary);
      if (!jsonResult.ok) {
        handleCliError(jsonResult.error, 1);
        return; // Ensure we don't access .value on error
      }
      console.log(jsonResult.value);
    } else {
      const output = formatPretty(summary, { quiet: config.quiet });
      console.log(output);
    }

    // Determine exit code
    process.exit(hasFailures(summary, config.strict) ? 1 : 0);
  } catch (error) {
    handleCliError(error, 1);
  }
}

// Entry point - only run when executed directly, not when imported
// Using process.argv[1] check for ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const arg1 = process.argv[1];
const isDirectRun =
  arg1 === __filename ||
  arg1?.endsWith("/lint-patterns") === true ||
  arg1?.endsWith("\\lint-patterns") === true;

if (isDirectRun) {
  void main();
}
