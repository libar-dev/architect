#!/usr/bin/env node

/**
 * @libar-docs
 * @libar-docs-cli
 * @libar-docs-pattern ValidatePatternsCLI
 * @libar-docs-status completed
 * @libar-docs-uses PatternScanner, GherkinScanner, DocExtractor, DualSourceExtractor, CodecUtils
 * @libar-docs-extract-shapes ValidateCLIConfig, ValidationIssue, ValidationSummary
 *
 * ## ValidatePatternsCLI - Cross-Source Pattern Validator
 *
 * Cross-validates TypeScript patterns vs Gherkin feature files.
 * Ensures consistency between code annotations and feature specifications.
 *
 * ### Exit Codes
 *
 * - `0` - No errors
 * - `1` - Errors found
 * - `2` - Warnings found (with --strict)
 *
 * ### When to Use
 *
 * - Pre-commit validation to ensure code and feature files stay in sync
 * - CI pipeline to catch documentation drift early
 * - Strict mode (`--strict`) for production readiness checks
 */

import { printVersionAndExit } from './version.js';
import { handleCliError } from './error-handler.js';
import { getPatternName } from '../api/pattern-helpers.js';
import { scanPatterns } from '../scanner/index.js';
import { scanGherkinFiles } from '../scanner/gherkin-scanner.js';
import { extractPatterns } from '../extractor/doc-extractor.js';
import { extractProcessMetadata, extractDeliverables } from '../extractor/dual-source-extractor.js';
import { loadConfig, formatConfigError } from '../config/config-loader.js';
import {
  ScannerConfigSchema,
  createJsonOutputCodec,
  ValidationSummaryOutputSchema,
} from '../validation-schemas/index.js';
import type { ExtractedPattern } from '../validation-schemas/index.js';
import { normalizeStatus, isPatternComplete } from '../taxonomy/index.js';
import type { Deliverable, ScannedGherkinFile } from '../validation-schemas/index.js';
import {
  validateDoD,
  formatDoDSummary,
  detectAntiPatterns,
  formatAntiPatternReport,
  toValidationIssues,
  DEFAULT_THRESHOLDS,
} from '../validation/index.js';

/**
 * Codec for serializing validation summary to JSON
 */
const ValidationSummaryCodec = createJsonOutputCodec(ValidationSummaryOutputSchema);

/**
 * Validation issue severity
 */
export type IssueSeverity = 'error' | 'warning' | 'info';

/**
 * Validation issue
 */
export interface ValidationIssue {
  severity: IssueSeverity;
  message: string;
  source: 'typescript' | 'gherkin' | 'cross-source';
  pattern?: string;
  file?: string;
}

/**
 * Gherkin pattern metadata extracted for validation
 */
export interface GherkinPatternInfo {
  name: string;
  phase?: number;
  status?: string;
  file: string;
  deliverables: readonly Deliverable[];
}

/**
 * Validation summary
 */
export interface ValidationSummary {
  issues: ValidationIssue[];
  stats: {
    typescriptPatterns: number;
    gherkinPatterns: number;
    matched: number;
    missingInGherkin: number;
    missingInTypeScript: number;
  };
}

/**
 * CLI configuration
 */
export interface ValidateCLIConfig {
  /** Glob patterns for TypeScript input files */
  input: string[];
  /** Glob patterns for Gherkin feature files */
  features: string[];
  /** Glob patterns to exclude */
  exclude: string[];
  /** Base directory for path resolution */
  baseDir: string;
  /** Treat warnings as errors */
  strict: boolean;
  /** Output format */
  format: 'pretty' | 'json';
  /** Show help */
  help: boolean;
  /** Enable DoD validation mode */
  dod: boolean;
  /** Specific phases to validate (empty = all completed phases) */
  phases: number[];
  /** Enable anti-pattern detection */
  antiPatterns: boolean;
  /** Override scenario bloat threshold */
  scenarioBloatThreshold: number;
  /** Override mega-feature line threshold */
  megaFeatureLineThreshold: number;
  /** Override magic comment threshold */
  magicCommentThreshold: number;
  /** Show version */
  version: boolean;
}

/**
 * Parse command line arguments
 */
export function parseArgs(argv: string[] = process.argv.slice(2)): ValidateCLIConfig {
  const config: ValidateCLIConfig = {
    input: [],
    features: [],
    exclude: [],
    baseDir: process.cwd(),
    strict: false,
    format: 'pretty',
    help: false,
    dod: false,
    phases: [],
    antiPatterns: false,
    scenarioBloatThreshold: DEFAULT_THRESHOLDS.scenarioBloatThreshold,
    megaFeatureLineThreshold: DEFAULT_THRESHOLDS.megaFeatureLineThreshold,
    magicCommentThreshold: DEFAULT_THRESHOLDS.magicCommentThreshold,
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
    } else if (arg === '--features' || arg === '-F') {
      const nextArg = argv[++i];
      if (!nextArg) {
        throw new Error(`Missing value for ${arg} flag`);
      }
      config.features.push(nextArg);
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
    } else if (arg === '--dod') {
      config.dod = true;
    } else if (arg === '--phase') {
      const nextArg = argv[++i];
      if (!nextArg) {
        throw new Error(`Missing value for ${arg} flag`);
      }
      const phaseNum = parseInt(nextArg, 10);
      if (isNaN(phaseNum) || phaseNum < 1) {
        throw new Error(`Invalid phase number: ${nextArg}. Must be a positive integer.`);
      }
      config.phases.push(phaseNum);
    } else if (arg === '--anti-patterns') {
      config.antiPatterns = true;
    } else if (arg === '--scenario-threshold') {
      const nextArg = argv[++i];
      if (!nextArg) {
        throw new Error(`Missing value for ${arg} flag`);
      }
      const threshold = parseInt(nextArg, 10);
      if (isNaN(threshold) || threshold < 1) {
        throw new Error(`Invalid threshold: ${nextArg}. Must be a positive integer.`);
      }
      config.scenarioBloatThreshold = threshold;
    } else if (arg === '--mega-feature-threshold') {
      const nextArg = argv[++i];
      if (!nextArg) {
        throw new Error(`Missing value for ${arg} flag`);
      }
      const threshold = parseInt(nextArg, 10);
      if (isNaN(threshold) || threshold < 1) {
        throw new Error(`Invalid threshold: ${nextArg}. Must be a positive integer.`);
      }
      config.megaFeatureLineThreshold = threshold;
    } else if (arg === '--magic-comment-threshold') {
      const nextArg = argv[++i];
      if (!nextArg) {
        throw new Error(`Missing value for ${arg} flag`);
      }
      const threshold = parseInt(nextArg, 10);
      if (isNaN(threshold) || threshold < 1) {
        throw new Error(`Invalid threshold: ${nextArg}. Must be a positive integer.`);
      }
      config.magicCommentThreshold = threshold;
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
  console.log(`
validate-patterns - Cross-validate TypeScript patterns vs Gherkin features

Usage:
  validate-patterns [options]

Options:
  -i, --input <pattern>       Glob pattern for TypeScript files (required, repeatable)
  -F, --features <pattern>    Glob pattern for Gherkin feature files (required, repeatable)
  -e, --exclude <pattern>     Glob pattern to exclude (repeatable)
  -b, --base-dir <dir>        Base directory for paths (default: cwd)
  --strict                    Treat warnings as errors (exit 2 on warnings)
  -f, --format <type>         Output format: "pretty" (default) or "json"
  -h, --help                  Show this help message
  -v, --version               Show version number

DoD Validation:
  --dod                       Enable Definition of Done validation
  --phase <N>                 Validate specific phase (repeatable, default: all completed)

Anti-Pattern Detection:
  --anti-patterns             Enable anti-pattern detection
  --scenario-threshold <N>    Max scenarios per feature (default: 20)
  --mega-feature-threshold <N> Max lines per feature (default: 500)
  --magic-comment-threshold <N> Max magic comments (default: 5)

Exit Codes:
  0  No issues found
  1  Errors found
  2  Warnings found (with --strict)

Cross-Source Validation Checks:
  error    phase-mismatch               Phase number differs between sources
  error    status-mismatch              Status differs between sources
  warning  missing-pattern-in-gherkin   Pattern in TypeScript has no matching feature
  warning  missing-deliverables         Completed phase has no deliverables defined
  warning  deliverable-missing-fields   Deliverable missing required fields
  info     missing-pattern-in-ts        Pattern in Gherkin has no matching TypeScript
  info     unmatched-dependency         Dependency references non-existent pattern

DoD Validation Checks (--dod):
  error    incomplete-deliverables      Completed phase has incomplete deliverables
  error    missing-acceptance-criteria  Completed phase has no @acceptance-criteria scenarios

Anti-Pattern Detection (--anti-patterns):
  error    tag-duplication              Dependencies in features (should be code-only)
  error    process-in-code              Process metadata in code (should be features-only)
  warning  magic-comments               Too many generator hints in features
  warning  scenario-bloat               Too many scenarios per feature
  warning  mega-feature                 Feature file too large

Examples:
  # Cross-source validation
  validate-patterns -i "src/**/*.ts" -F "tests/features/**/*.feature"

  # DoD validation for all completed phases
  validate-patterns -i "src/**/*.ts" -F "features/**/*.feature" --dod

  # DoD validation for specific phase
  validate-patterns -i "src/**/*.ts" -F "features/**/*.feature" --dod --phase 14

  # Anti-pattern detection
  validate-patterns -i "src/**/*.ts" -F "features/**/*.feature" --anti-patterns

  # Full validation (cross-source + DoD + anti-patterns)
  validate-patterns -i "src/**/*.ts" -F "features/**/*.feature" --dod --anti-patterns --strict

  # JSON output for tooling
  validate-patterns -i "src/**/*.ts" -F "features/**/*.feature" --format json
  `);
}

/**
 * Extract pattern info from Gherkin feature files
 */
function extractGherkinPatternInfo(files: readonly ScannedGherkinFile[]): GherkinPatternInfo[] {
  const patterns: GherkinPatternInfo[] = [];

  for (const file of files) {
    const metadata = extractProcessMetadata(file);
    if (metadata) {
      const deliverables = extractDeliverables(file);
      patterns.push({
        name: metadata.pattern,
        phase: metadata.phase,
        status: metadata.status,
        file: file.filePath,
        deliverables,
      });
    }
  }

  return patterns;
}

/**
 * Validate cross-source consistency
 *
 * Compares TypeScript patterns against Gherkin patterns to find:
 * - Missing patterns in either source
 * - Phase number mismatches
 * - Status mismatches (after normalization)
 * - Missing deliverables for completed phases
 * - Invalid dependencies
 *
 * @param tsPatterns - Patterns extracted from TypeScript source
 * @param gherkinPatterns - Pattern info extracted from Gherkin features
 * @returns Validation summary with issues and statistics
 */
export function validatePatterns(
  tsPatterns: readonly ExtractedPattern[],
  gherkinPatterns: GherkinPatternInfo[]
): ValidationSummary {
  const issues: ValidationIssue[] = [];

  // Build maps for efficient lookups
  const tsByName = new Map<string, ExtractedPattern>();
  const gherkinByName = new Map<string, GherkinPatternInfo>();

  for (const p of tsPatterns) {
    const name = getPatternName(p);
    tsByName.set(name.toLowerCase(), p);
  }

  for (const p of gherkinPatterns) {
    gherkinByName.set(p.name.toLowerCase(), p);
  }

  let matched = 0;

  // Check TypeScript patterns against Gherkin
  for (const tsPattern of tsPatterns) {
    const tsName = getPatternName(tsPattern).toLowerCase();
    const gherkinMatch = gherkinByName.get(tsName);

    if (!gherkinMatch) {
      // Only report for roadmap patterns (those with phase numbers)
      if (tsPattern.phase !== undefined) {
        issues.push({
          severity: 'warning',
          message: `Pattern "${getPatternName(tsPattern)}" in TypeScript has no matching Gherkin feature`,
          source: 'cross-source',
          pattern: getPatternName(tsPattern),
          file: tsPattern.source.file,
        });
      }
    } else {
      matched++;

      // Check phase consistency
      if (tsPattern.phase !== undefined && gherkinMatch.phase !== undefined) {
        if (tsPattern.phase !== gherkinMatch.phase) {
          issues.push({
            severity: 'error',
            message: `Phase mismatch for "${getPatternName(tsPattern)}": TypeScript=${tsPattern.phase}, Gherkin=${gherkinMatch.phase}`,
            source: 'cross-source',
            pattern: getPatternName(tsPattern),
          });
        }
      }

      // Check status consistency
      if (tsPattern.status && gherkinMatch.status) {
        const tsStatus = normalizeStatus(tsPattern.status);
        const gherkinStatus = normalizeStatus(gherkinMatch.status);
        if (tsStatus !== gherkinStatus) {
          // Include both raw and normalized values for clarity when they differ textually
          const rawDiffers = tsPattern.status.toLowerCase() !== gherkinMatch.status.toLowerCase();
          const message = rawDiffers
            ? `Status mismatch for "${getPatternName(tsPattern)}": TypeScript="${tsPattern.status}" (→${tsStatus}), Gherkin="${gherkinMatch.status}" (→${gherkinStatus})`
            : `Status mismatch for "${getPatternName(tsPattern)}": TypeScript=${tsStatus}, Gherkin=${gherkinStatus}`;
          issues.push({
            severity: 'error',
            message,
            source: 'cross-source',
            pattern: getPatternName(tsPattern),
          });
        }
      }
    }
  }

  // Check Gherkin patterns against TypeScript
  for (const gherkinPattern of gherkinPatterns) {
    const gherkinName = gherkinPattern.name.toLowerCase();
    const tsMatch = tsByName.get(gherkinName);

    if (!tsMatch) {
      issues.push({
        severity: 'info',
        message: `Pattern "${gherkinPattern.name}" in Gherkin has no matching TypeScript pattern`,
        source: 'cross-source',
        pattern: gherkinPattern.name,
        file: gherkinPattern.file,
      });
    }
  }

  // Check deliverables for completed patterns
  for (const gherkinPattern of gherkinPatterns) {
    if (isPatternComplete(gherkinPattern.status)) {
      if (gherkinPattern.deliverables.length === 0) {
        issues.push({
          severity: 'warning',
          message: `Completed pattern "${gherkinPattern.name}" has no deliverables defined`,
          source: 'gherkin',
          pattern: gherkinPattern.name,
          file: gherkinPattern.file,
        });
      } else {
        // Validate deliverable fields
        for (const d of gherkinPattern.deliverables) {
          if (!d.name || d.name.trim() === '') {
            issues.push({
              severity: 'warning',
              message: `Deliverable in "${gherkinPattern.name}" missing name`,
              source: 'gherkin',
              pattern: gherkinPattern.name,
            });
          }
          if (!d.status || d.status.trim() === '') {
            issues.push({
              severity: 'warning',
              message: `Deliverable "${d.name}" in "${gherkinPattern.name}" missing status`,
              source: 'gherkin',
              pattern: gherkinPattern.name,
            });
          }
        }
      }
    }
  }

  // Check dependencies exist
  const allPatternNames = new Set([...tsByName.keys(), ...gherkinByName.keys()]);

  for (const pattern of tsPatterns) {
    const deps = pattern.dependsOn ?? [];
    for (const dep of deps) {
      if (!allPatternNames.has(dep.toLowerCase())) {
        issues.push({
          severity: 'info',
          message: `Pattern "${getPatternName(pattern)}" depends on "${dep}" which does not exist`,
          source: 'typescript',
          pattern: getPatternName(pattern),
        });
      }
    }
  }

  return {
    issues,
    stats: {
      typescriptPatterns: tsPatterns.length,
      gherkinPatterns: gherkinPatterns.length,
      matched,
      missingInGherkin: tsPatterns.filter((p) => {
        const name = getPatternName(p).toLowerCase();
        return !gherkinByName.has(name) && p.phase !== undefined;
      }).length,
      missingInTypeScript: gherkinPatterns.filter((p) => {
        const name = p.name.toLowerCase();
        return !tsByName.has(name);
      }).length,
    },
  };
}

/**
 * Format summary for pretty output
 */
function formatPretty(summary: ValidationSummary): string {
  const lines: string[] = [];

  lines.push('Pattern Validation Summary');
  lines.push('==========================');
  lines.push('');

  // Stats
  lines.push(`TypeScript patterns: ${summary.stats.typescriptPatterns}`);
  lines.push(`Gherkin patterns:    ${summary.stats.gherkinPatterns}`);
  lines.push(`Matched:             ${summary.stats.matched}`);
  lines.push('');

  // Group issues by severity
  const errors = summary.issues.filter((i) => i.severity === 'error');
  const warnings = summary.issues.filter((i) => i.severity === 'warning');
  const infos = summary.issues.filter((i) => i.severity === 'info');

  if (errors.length > 0) {
    lines.push(`Errors (${errors.length}):`);
    for (const issue of errors) {
      lines.push(`  [ERROR] ${issue.message}`);
      if (issue.file) {
        lines.push(`          at ${issue.file}`);
      }
    }
    lines.push('');
  }

  if (warnings.length > 0) {
    lines.push(`Warnings (${warnings.length}):`);
    for (const issue of warnings) {
      lines.push(`  [WARN]  ${issue.message}`);
      if (issue.file) {
        lines.push(`          at ${issue.file}`);
      }
    }
    lines.push('');
  }

  if (infos.length > 0) {
    lines.push(`Info (${infos.length}):`);
    for (const issue of infos) {
      lines.push(`  [INFO]  ${issue.message}`);
      if (issue.file) {
        lines.push(`          at ${issue.file}`);
      }
    }
    lines.push('');
  }

  // Summary line
  if (errors.length === 0 && warnings.length === 0) {
    lines.push('All validations passed.');
  } else {
    lines.push(
      `Found ${errors.length} error(s), ${warnings.length} warning(s), ${infos.length} info message(s).`
    );
  }

  return lines.join('\n');
}

/**
 * Format summary as JSON
 *
 * Uses ValidationSummaryCodec for type-safe serialization.
 *
 * @throws Error if serialization fails (should never happen with valid data)
 */
function formatJson(summary: ValidationSummary): string {
  const result = ValidationSummaryCodec.serialize(summary);
  if (!result.ok) {
    throw new Error(`Validation summary serialization failed: ${result.error.message}`);
  }
  return result.value;
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  const config = parseArgs();

  if (config.version) {
    printVersionAndExit('validate-patterns');
  }

  if (config.help) {
    printHelp();
    process.exit(0);
  }

  if (config.input.length === 0) {
    console.error('Error: No TypeScript input patterns specified. Use --input <pattern>');
    printHelp();
    process.exit(1);
  }

  if (config.features.length === 0) {
    console.error('Error: No Gherkin feature patterns specified. Use --features <pattern>');
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
    const registry = dpInstance.registry;
    const configSource = !isDefault && configPath ? configPath : '(default libar-generic preset)';

    if (config.format === 'pretty') {
      console.log('Validating patterns...');
      console.log(`  Config: ${configSource}`);
      console.log(`  Base directory: ${config.baseDir}`);
      console.log(`  TypeScript patterns: ${config.input.join(', ')}`);
      console.log(`  Gherkin patterns: ${config.features.join(', ')}`);
      console.log('');
    }

    // Scan TypeScript files
    const scannerConfig = ScannerConfigSchema.parse({
      patterns: config.input,
      exclude: config.exclude.length > 0 ? config.exclude : undefined,
      baseDir: config.baseDir,
    });

    const scanResult = await scanPatterns(scannerConfig, registry);
    if (!scanResult.ok) {
      throw new Error('Unexpected scan failure');
    }

    // Extract TypeScript patterns
    const extractionResult = extractPatterns(scanResult.value.files, config.baseDir, registry);
    const tsPatterns = extractionResult.patterns;

    // Scan Gherkin files
    const gherkinScanResult = await scanGherkinFiles({
      patterns: config.features,
      baseDir: config.baseDir,
    });
    if (!gherkinScanResult.ok) {
      throw new Error('Unexpected Gherkin scan failure');
    }

    // Extract Gherkin patterns
    const gherkinPatterns = extractGherkinPatternInfo(gherkinScanResult.value.files);

    // Warn if no patterns found (common misconfiguration)
    if (tsPatterns.length === 0) {
      console.warn('⚠️  Warning: No TypeScript patterns found. Check your --input patterns.');
    }
    if (gherkinPatterns.length === 0) {
      console.warn('⚠️  Warning: No Gherkin patterns found. Check your --features patterns.');
    }

    // Run cross-source validation
    const summary = validatePatterns(tsPatterns, gherkinPatterns);

    // Output cross-source results
    if (config.format === 'pretty') {
      console.log(formatPretty(summary));
    }

    // Run DoD validation if enabled
    let dodHasErrors = false;
    if (config.dod) {
      const dodSummary = validateDoD(gherkinScanResult.value.files, config.phases);

      if (config.format === 'pretty') {
        console.log(formatDoDSummary(dodSummary));
      }

      // Add DoD failures to issues
      for (const result of dodSummary.results) {
        if (!result.isDoDMet) {
          dodHasErrors = true;
          for (const msg of result.messages) {
            if (!msg.startsWith('DoD met')) {
              summary.issues.push({
                severity: 'error',
                message: `[DoD] Phase ${result.phase} (${result.patternName}): ${msg}`,
                source: 'gherkin',
                pattern: result.patternName,
              });
            }
          }
        }
      }
    }

    // Run anti-pattern detection if enabled
    let antiPatternHasErrors = false;
    if (config.antiPatterns) {
      const thresholds = {
        scenarioBloatThreshold: config.scenarioBloatThreshold,
        megaFeatureLineThreshold: config.megaFeatureLineThreshold,
        magicCommentThreshold: config.magicCommentThreshold,
      };

      const violations = detectAntiPatterns(scanResult.value.files, gherkinScanResult.value.files, {
        thresholds,
      });

      if (config.format === 'pretty') {
        console.log(formatAntiPatternReport(violations));
      }

      // Add anti-pattern violations to issues
      const antiPatternIssues = toValidationIssues(violations);
      summary.issues.push(...antiPatternIssues);

      antiPatternHasErrors = violations.some((v) => v.severity === 'error');
    }

    // Output JSON if requested (all results combined)
    if (config.format === 'json') {
      console.log(formatJson(summary));
    }

    // Determine exit code based on all validation results
    const hasErrors =
      summary.issues.some((i) => i.severity === 'error') || dodHasErrors || antiPatternHasErrors;
    const hasWarnings = summary.issues.some((i) => i.severity === 'warning');

    if (hasErrors) {
      process.exit(1);
    } else if (hasWarnings && config.strict) {
      process.exit(2);
    } else {
      process.exit(0);
    }
  } catch (error) {
    handleCliError(error, 1);
  }
}

// Entry point
void main();
