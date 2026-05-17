#!/usr/bin/env node

/**
 * @architect
 * @architect-pattern LintPatternsCLI
 * @architect-cli
 * @architect-status completed
 * @architect-role:service
 * @architect-bounded-context:cli
 * @architect-uses LintEngine, LintRules, PatternScanner
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

// ─── Error Convention ───────────────────────────────────────────────────
// CLI modules use throw/catch + process.exit(). Pipeline modules use Result<T,E>.
// See src/cli/error-handler.ts for the unified handler.
// ────────────────────────────────────────────────────────────────────────

import { printVersionAndExit, handleCliError, isDirectCliEntrypoint } from './shared.js';
import { scanPatterns } from '@libar-dev/architect-core';
import { ScannerConfigSchema } from '@libar-dev/architect-core';
import { loadConfig, formatConfigError } from '@libar-dev/architect-core';
import type { DocDirective, LintViolation } from '@libar-dev/architect-core';
import {
  defaultRules,
  filterRulesBySeverity,
  lintFiles,
  hasFailures,
  formatPretty,
  formatJson,
  type DirectiveWithLocation,
  type LintSeverity,
  type LintSummary,
} from '../lint/index.js';
import { applyTierABaseline, summarizeLintResults } from '../lint/tier-a-baseline.js';

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
  format: 'pretty' | 'json';
  /** Only show errors (suppress warnings/info) */
  quiet: boolean;
  /** Minimum severity to report */
  minSeverity: LintSeverity;
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
    format: 'pretty',
    quiet: false,
    minSeverity: 'info',
    help: false,
    version: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--help' || arg === '-h') {
      config.help = true;
    } else if (arg === '--input' || arg === '-i') {
      const nextArg = argv[++i];
      if (!nextArg) {
        throw new Error(`Missing value for ${arg} flag`);
      }
      config.input.push(nextArg);
    } else if (arg === '--exclude' || arg === '-e') {
      const nextArg = argv[++i];
      if (!nextArg) {
        throw new Error(`Missing value for ${arg} flag`);
      }
      config.exclude.push(nextArg);
    } else if (arg === '--base-dir' || arg === '-b') {
      const nextArg = argv[++i];
      if (!nextArg) {
        throw new Error(`Missing value for ${arg} flag`);
      }
      config.baseDir = nextArg;
    } else if (arg === '--strict') {
      config.strict = true;
    } else if (arg === '--format' || arg === '-f') {
      const nextArg = argv[++i];
      if (!nextArg) {
        throw new Error(`Missing value for ${arg} flag`);
      }
      if (nextArg !== 'pretty' && nextArg !== 'json') {
        throw new Error(`Invalid format: ${nextArg}. Use "pretty" or "json"`);
      }
      config.format = nextArg;
    } else if (arg === '--quiet' || arg === '-q') {
      config.quiet = true;
    } else if (arg === '--min-severity') {
      const nextArg = argv[++i];
      if (!nextArg) {
        throw new Error(`Missing value for ${arg} flag`);
      }
      if (nextArg !== 'error' && nextArg !== 'warning' && nextArg !== 'info') {
        throw new Error(`Invalid severity: ${nextArg}. Use "error", "warning", or "info"`);
      }
      config.minSeverity = nextArg;
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
export function printHelp(): void {
  process.stdout.write(`
architect-lint-patterns - Validate pattern annotation quality

Usage:
  architect-lint-patterns [options]

Options:
  -i, --input <pattern>     Glob pattern for TypeScript files (required, repeatable)
  -e, --exclude <pattern>   Glob pattern to exclude (repeatable)
  -b, --base-dir <dir>      Base directory for paths (default: cwd)
  --strict                  Treat warnings as errors (Tier-A errors always fail)
  -f, --format <type>       Output format: "pretty" (default) or "json"
  -q, --quiet               Only show errors (suppress warnings/info)
  --min-severity <level>    Minimum severity to report: error|warning|info (default: info)
  -h, --help                Show this help message
  -v, --version             Show version number

Exit Codes:
  0  No errors (warnings allowed unless --strict)
  1  Errors found, including Tier-A relationship/name violations (or warnings with --strict)

Lint Rules:
  error    missing-pattern-name      Pattern must declare a pattern name
  error    tautological-description  Description should not repeat pattern name
  error    missing-relationship-target  Relationship targets must reference existing patterns
  error    invalid-pattern-name      Pattern identifiers must use PascalCase
  warning  missing-status            Pattern should have @architect-status
  warning  missing-when-to-use       Pattern should have "When to Use" section
  info     missing-relationships     Consider adding @architect-uses

Examples:
  # Lint all @libar-dev/platform-* patterns
  architect-lint-patterns -i "packages/@libar-dev/platform-*/src/**/*.ts"

  # Strict mode for CI (fail on warnings)
  architect-lint-patterns -i "packages/@libar-dev/platform-*/src/**/*.ts" --strict

  # JSON output for tooling
  architect-lint-patterns -i "src/**/*.ts" --format json

  # Only show errors
  architect-lint-patterns -i "src/**/*.ts" --quiet
  \n`);
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  const config = parseArgs();

  if (config.version) {
    printVersionAndExit('architect-lint-patterns');
  }

  if (config.help) {
    printHelp();
    process.exit(0);
  }

  if (config.input.length === 0) {
    console.error('Error: No input patterns specified. Use --input <pattern>');
    printHelp();
    process.exit(1);
  }

  try {
    // Load configuration (discovers architect.config.ts)
    const configResult = await loadConfig(config.baseDir);
    if (!configResult.ok) {
      console.error(formatConfigError(configResult.error));
      process.exit(1);
    }

    const { instance: dpInstance, isDefault, path: configPath } = configResult.value;

    // Log configuration source (for transparency)
    if (!isDefault && configPath) {
      process.stdout.write(`  Config: ${configPath}\n`);
    } else {
      process.stdout.write('  Config: (built-in default role set)\n');
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
      throw new Error('Unexpected scan failure');
    }
    const { files: scanned, errors: scanErrors, skippedDirectives } = scanResult.value;

    // Report scan errors
    if (scanErrors.length > 0 && config.format === 'pretty') {
      process.stdout.write(`Warning: ${String(scanErrors.length)} files failed to scan:\n`);
      for (const { file, error } of scanErrors) {
        process.stdout.write(`  - ${file}: ${error.reason}\n`);
      }
      process.stdout.write('\n');
    }

    // Report skipped directives (these are already validation failures)
    if (skippedDirectives.length > 0 && config.format === 'pretty') {
      process.stdout.write(
        `Warning: ${String(skippedDirectives.length)} directives skipped due to validation:\n`,
      );
      for (const { file, error } of skippedDirectives) {
        process.stdout.write(`  - ${file}:${String(error.line)}: ${error.reason}\n`);
      }
      process.stdout.write('\n');
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

    const knownPatterns = new Set<string>();
    const patternLevels = new Map<string, NonNullable<DocDirective['level']>>();
    for (const directives of fileDirectives.values()) {
      for (const { directive } of directives) {
        if (directive.patternName !== undefined) {
          knownPatterns.add(directive.patternName);
          if (directive.level !== undefined) {
            patternLevels.set(directive.patternName, directive.level);
          }
        }
      }
    }

    const validationViolations = skippedDirectives.flatMap(({ file, error }) =>
      createValidationViolations(file, error.line, error.reason),
    );

    // Run lint
    const lintSummary = lintFiles(fileDirectives, rules, {
      knownPatterns,
      patternLevels,
      registry: dpInstance.registry,
    });
    const summary = applyTierABaseline(mergeLintSummary(lintSummary, validationViolations), {
      baseDir: config.baseDir,
    });

    // Format and output results
    if (config.format === 'json') {
      const jsonResult = formatJson(summary);
      if (!jsonResult.ok) {
        handleCliError(jsonResult.error, 1);
      }
      process.stdout.write(`${jsonResult.value}\n`);
    } else {
      const output = formatPretty(summary, { quiet: config.quiet });
      process.stdout.write(`${output}\n`);
    }

    // Determine exit code
    process.exit(hasFailures(summary, config.strict) ? 1 : 0);
  } catch (error) {
    handleCliError(error, 1);
  }
}

function mergeLintSummary(summary: LintSummary, violations: readonly LintViolation[]): LintSummary {
  if (violations.length === 0) {
    return summary;
  }

  const resultsByFile = new Map<string, LintViolation[]>();
  for (const result of summary.results) {
    resultsByFile.set(result.file, [...result.violations]);
  }
  for (const violation of violations) {
    const fileViolations = resultsByFile.get(violation.file) ?? [];
    fileViolations.push(violation);
    resultsByFile.set(violation.file, fileViolations);
  }

  const results = [...resultsByFile.entries()].map(([file, fileViolations]) => ({
    file,
    violations: fileViolations,
  }));
  return summarizeLintResults(results, summary.filesScanned, summary.directivesChecked);
}

function createValidationViolations(
  file: string,
  line: number,
  reason: string,
): readonly LintViolation[] {
  if (reason.includes('patternName:')) {
    return [
      {
        file,
        line,
        rule: 'invalid-pattern-name',
        severity: 'error',
        message: reason,
      },
    ];
  }

  if (reason.includes('uses:') || reason.includes('implements:')) {
    return [
      {
        file,
        line,
        rule: 'missing-relationship-target',
        severity: 'error',
        message: reason,
      },
    ];
  }

  return [];
}

// Entry point
export async function runLintPatternsCli(argv: string[] = process.argv.slice(2)): Promise<void> {
  process.argv = [process.argv[0] ?? 'node', process.argv[1] ?? 'architect-lint-patterns', ...argv];
  await main();
}

if (isDirectCliEntrypoint(import.meta.url)) {
  void main();
}
