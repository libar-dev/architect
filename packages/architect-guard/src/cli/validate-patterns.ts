#!/usr/bin/env node

/**
 * @architect
 * @architect-pattern ValidatePatternsCLI
 * @architect-cli
 * @architect-status completed
 * @architect-role:service
 * @architect-bounded-context:validation
 * @architect-uses PatternScanner, GherkinScanner, DocExtractor, GherkinExtractor, PatternGraph, CodecUtils
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

// ─── Error Convention ───────────────────────────────────────────────────
// CLI modules use throw/catch + process.exit(). Pipeline modules use Result<T,E>.
// See src/cli/error-handler.ts for the unified handler.
// ────────────────────────────────────────────────────────────────────────

import {
  exitWithProcessError,
  getPatternName,
  getRelationships,
  scanGherkinFiles,
  scanPatterns,
} from '@libar-dev/architect-core';
import { printVersionAndExit, isDirectCliEntrypoint } from './shared.js';
import {
  loadConfig,
  applyProjectSourceDefaults,
  formatConfigError,
  type ExtractedPattern,
  type ExtractionDiagnostic,
} from '@libar-dev/architect-core';
import { buildPatternGraph } from '@libar-dev/architect-core';
import {
  ScannerConfigSchema,
  createJsonOutputCodec,
  ValidatePatternsOutputSchema,
} from '@libar-dev/architect-core';
import { normalizeStatus } from '@libar-dev/architect-core';
import type { DanglingReference, RuntimePatternGraph } from '@libar-dev/architect-core';
import {
  validateDoD,
  formatDoDSummary,
  detectAntiPatterns,
  formatAntiPatternReport,
  toValidationIssues,
  DEFAULT_THRESHOLDS,
} from '../validation/index.js';
import { getDeliverableWorkflowPatterns } from '../validation/dod-validator.js';
import {
  DANGLING_BASELINE_SOURCE_PATH,
  compareDanglingBaseline,
  writeDanglingBaseline,
} from '../lint/dangling-baseline.js';

/**
 * Codec for serializing validate-patterns JSON output
 */
const ValidatePatternsOutputCodec = createJsonOutputCodec(ValidatePatternsOutputSchema);

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
 * Output payload for validate-patterns CLI.
 *
 * Keeps cross-source validation issues separate from extraction diagnostics so
 * callers can distinguish validator findings from pipeline extraction health.
 */
export interface ValidatePatternsOutput extends ValidationSummary {
  diagnostics: readonly ExtractionDiagnostic[];
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
  /** Show info-level messages in pretty output */
  verbose: boolean;
  /** Rewrite the committed dangling-reference baseline */
  updateBaseline: boolean;
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
    verbose: false,
    updateBaseline: false,
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
    } else if (arg === '--verbose') {
      config.verbose = true;
    } else if (arg === '--update-baseline') {
      config.updateBaseline = true;
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
architect-validate - Cross-validate TypeScript patterns vs Gherkin features

Usage:
  architect-validate [options]

Options:
  -i, --input <pattern>       Glob pattern for TypeScript files (repeatable; falls back to config)
  -F, --features <pattern>    Glob pattern for Gherkin feature files (repeatable; falls back to config)
  -e, --exclude <pattern>     Glob pattern to exclude (repeatable)
  -b, --base-dir <dir>        Base directory for paths (default: cwd)
  --strict                    Treat warnings as errors (exit 2 on warnings)
  --verbose                   Show info-level messages (hidden by default)
  --update-baseline           Rewrite dangling-baseline.json from current raw data
  -f, --format <type>         Output format: "pretty" (default) or "json"
  -h, --help                  Show this help message
  -v, --version               Show version number

DoD Validation:
  --dod                       Enable Definition of Done validation
  --phase <N>                 Validate specific phase (repeatable, default: all completed)

Anti-Pattern Detection:
  --anti-patterns             Enable anti-pattern detection
  --scenario-threshold <N>    Max scenarios per feature (default: 30)
  --mega-feature-threshold <N> Max lines per feature (default: 750)
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
  error    process-in-code              Process metadata in code (should be features-only)
  error    removed-tag                  Removed tag still present (silent data loss)
  warning  magic-comments               Too many generator hints in features
  warning  scenario-bloat               Too many scenarios per feature
  warning  mega-feature                 Feature file too large

Examples:
  # Cross-source validation
  architect-validate -i "src/**/*.ts" -F "tests/features/**/*.feature"

  # DoD validation for all completed phases
  architect-validate -i "src/**/*.ts" -F "features/**/*.feature" --dod

  # DoD validation for specific phase
  architect-validate -i "src/**/*.ts" -F "features/**/*.feature" --dod --phase 14

  # Anti-pattern detection
  architect-validate -i "src/**/*.ts" -F "features/**/*.feature" --anti-patterns

  # Full validation (cross-source + DoD + anti-patterns)
  architect-validate -i "src/**/*.ts" -F "features/**/*.feature" --dod --anti-patterns --strict

  # JSON output for tooling
  architect-validate -i "src/**/*.ts" -F "features/**/*.feature" --format json
  \n`);
}

/**
 * Check whether a direct same-name counterpart is a real cross-source match.
 *
 * A same-name counterpart that explicitly implements a different pattern is a naming
 * collision, not a match for the current pattern.
 */
function isDirectNameMatch(
  patternName: string,
  counterpart: ExtractedPattern | undefined,
): counterpart is ExtractedPattern {
  if (counterpart === undefined) {
    return false;
  }

  const counterpartImplements = counterpart.implementsPatterns ?? [];
  return (
    counterpartImplements.length === 0 ||
    counterpartImplements.some((name) => name.toLowerCase() === patternName.toLowerCase())
  );
}

/**
 * Check if a pattern has a cross-source match via PatternGraph relationships.
 *
 * Uses the canonical relationshipIndex read model instead of re-deriving forward and
 * reverse implements lookups locally.
 */
function hasCrossSourceRelationshipMatch(
  patternName: string,
  counterpartByName: ReadonlyMap<string, ExtractedPattern>,
  dataset: RuntimePatternGraph,
): boolean {
  const relationships = getRelationships(dataset, patternName);
  if (relationships === undefined) {
    return false;
  }

  for (const implementedPattern of relationships.implementsPatterns) {
    if (counterpartByName.has(implementedPattern.toLowerCase())) {
      return true;
    }
  }

  for (const implementationRef of relationships.implementedBy) {
    if (counterpartByName.has(implementationRef.name.toLowerCase())) {
      return true;
    }
  }

  return false;
}

/**
 * Validate cross-source consistency using the PatternGraph read model.
 *
 * Compares TypeScript patterns against Gherkin patterns to find:
 * - Missing patterns in either source (with implements-aware resolution)
 * - Phase number mismatches
 * - Status mismatches (after normalization)
 * - Missing deliverables for completed phases
 * - Invalid dependencies
 *
 * DD-2: Consumes RuntimePatternGraph instead of raw scanner/extractor output.
 * DD-3: Two-phase matching — name-based first, then relationshipIndex fallback.
 *
 * @param dataset - The pre-computed PatternGraph read model
 * @returns Validation summary with issues and statistics
 */
export function validatePatterns(dataset: RuntimePatternGraph): ValidationSummary {
  const issues: ValidationIssue[] = [];
  const tsPatterns = dataset.bySourceType.typescript;
  const gherkinPatterns = dataset.bySourceType.gherkin;

  // Phase 1: Build name-based maps for efficient lookups
  const tsByName = new Map<string, ExtractedPattern>();
  const gherkinByName = new Map<string, ExtractedPattern>();

  for (const p of tsPatterns) {
    tsByName.set(getPatternName(p).toLowerCase(), p);
  }

  for (const p of gherkinPatterns) {
    gherkinByName.set(getPatternName(p).toLowerCase(), p);
  }

  let matched = 0;
  let missingInGherkinCount = 0;

  // Check TypeScript patterns against Gherkin
  for (const tsPattern of tsPatterns) {
    const tsName = getPatternName(tsPattern);
    const directGherkinMatch = gherkinByName.get(tsName.toLowerCase());
    const gherkinMatch = isDirectNameMatch(tsName, directGherkinMatch)
      ? directGherkinMatch
      : undefined;

    if (!gherkinMatch) {
      // Phase 2: Check implements relationships before reporting
      if (hasCrossSourceRelationshipMatch(tsName, gherkinByName, dataset)) {
        matched++;
      } else if (tsPattern.phase !== undefined) {
        // Only report for roadmap patterns (those with phase numbers)
        missingInGherkinCount++;
        issues.push({
          severity: 'warning',
          message: `Pattern "${tsName}" in TypeScript has no matching Gherkin feature`,
          source: 'cross-source',
          pattern: tsName,
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
            message: `Phase mismatch for "${tsName}": TypeScript=${String(tsPattern.phase)}, Gherkin=${String(gherkinMatch.phase)}`,
            source: 'cross-source',
            pattern: tsName,
          });
        }
      }

      // Check status consistency
      const tsStatus = normalizeStatus(tsPattern.status);
      const gherkinStatus = normalizeStatus(gherkinMatch.status);
      if (tsStatus !== gherkinStatus) {
        // Include both raw and normalized values for clarity when they differ textually
        const rawDiffers = tsPattern.status.toLowerCase() !== gherkinMatch.status.toLowerCase();
        const message = rawDiffers
          ? `Status mismatch for "${tsName}": TypeScript="${tsPattern.status}" (→${tsStatus}), Gherkin="${gherkinMatch.status}" (→${gherkinStatus})`
          : `Status mismatch for "${tsName}": TypeScript=${tsStatus}, Gherkin=${gherkinStatus}`;
        issues.push({
          severity: 'error',
          message,
          source: 'cross-source',
          pattern: tsName,
        });
      }
    }
  }

  // Check Gherkin patterns against TypeScript
  let missingInTsCount = 0;
  for (const gherkinPattern of gherkinPatterns) {
    const gherkinName = getPatternName(gherkinPattern);
    const directTsMatch = tsByName.get(gherkinName.toLowerCase());
    const tsMatch = isDirectNameMatch(gherkinName, directTsMatch) ? directTsMatch : undefined;

    if (!tsMatch) {
      // Two-phase implements resolution (symmetric with TS→Gherkin direction)
      if (!hasCrossSourceRelationshipMatch(gherkinName, tsByName, dataset)) {
        missingInTsCount++;
        issues.push({
          severity: 'info',
          message: `Pattern "${gherkinName}" in Gherkin has no matching TypeScript pattern`,
          source: 'cross-source',
          pattern: gherkinName,
          file: gherkinPattern.source.file,
        });
      }
    }
  }

  // Check deliverables for completed roadmap patterns (those with phase numbers).
  // Test features and ADRs are completed but don't participate in the deliverables workflow.
  for (const gherkinPattern of getDeliverableWorkflowPatterns(dataset)) {
    const deliverables = gherkinPattern.deliverables ?? [];
    const name = getPatternName(gherkinPattern);
    if (deliverables.length === 0) {
      issues.push({
        severity: 'warning',
        message: `Completed pattern "${name}" has no deliverables defined`,
        source: 'gherkin',
        pattern: name,
        file: gherkinPattern.source.file,
      });
    } else {
      // Validate deliverable fields
      for (const d of deliverables) {
        if (!d.name || d.name.trim() === '') {
          issues.push({
            severity: 'warning',
            message: `Deliverable in "${name}" missing name`,
            source: 'gherkin',
            pattern: name,
          });
        }
      }
    }
  }

  // Check dependencies exist
  const allPatternNames = new Set([...tsByName.keys(), ...gherkinByName.keys()]);

  for (const pattern of tsPatterns) {
    const deps = pattern.uses ?? [];
    for (const dep of deps) {
      if (!allPatternNames.has(dep.toLowerCase())) {
        const name = getPatternName(pattern);
        issues.push({
          severity: 'info',
          message: `Pattern "${name}" depends on "${dep}" which does not exist`,
          source: 'typescript',
          pattern: name,
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
      missingInGherkin: missingInGherkinCount,
      missingInTypeScript: missingInTsCount,
    },
  };
}

/**
 * Format summary for pretty output
 */
function formatPretty(output: ValidatePatternsOutput, verbose = false): string {
  const lines: string[] = [];
  const { issues, stats, diagnostics } = output;

  lines.push('Pattern Validation Summary');
  lines.push('==========================');
  lines.push('');

  // Stats
  lines.push(`TypeScript patterns: ${String(stats.typescriptPatterns)}`);
  lines.push(`Gherkin patterns:    ${String(stats.gherkinPatterns)}`);
  lines.push(`Matched:             ${String(stats.matched)}`);
  lines.push('');

  // Group issues by severity
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const infos = issues.filter((i) => i.severity === 'info');

  if (errors.length > 0) {
    lines.push(`Errors (${String(errors.length)}):`);
    for (const issue of errors) {
      lines.push(`  [ERROR] ${issue.message}`);
      if (issue.file) {
        lines.push(`          at ${issue.file}`);
      }
    }
    lines.push('');
  }

  if (warnings.length > 0) {
    lines.push(`Warnings (${String(warnings.length)}):`);
    for (const issue of warnings) {
      lines.push(`  [WARN]  ${issue.message}`);
      if (issue.file) {
        lines.push(`          at ${issue.file}`);
      }
    }
    lines.push('');
  }

  if (diagnostics.length > 0) {
    lines.push(`Extraction Diagnostics (${String(diagnostics.length)}):`);
    for (const diagnostic of diagnostics) {
      lines.push(
        `  [${diagnostic.severity.toUpperCase()}] ${diagnostic.code}: ${diagnostic.message}`,
      );
      lines.push(`          at ${diagnostic.filePath}`);
      if (diagnostic.suggestion) {
        lines.push(`          suggestion: ${diagnostic.suggestion}`);
      }
    }
    lines.push('');
  }

  if (infos.length > 0 && verbose) {
    lines.push(`Info (${String(infos.length)}):`);
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
      `Found ${String(errors.length)} error(s), ${String(warnings.length)} warning(s), ${String(infos.length)} info message(s).`,
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
function formatJson(output: ValidatePatternsOutput): string {
  const result = ValidatePatternsOutputCodec.serialize({
    summary: {
      issues: output.issues,
      stats: output.stats,
    },
    diagnostics: output.diagnostics,
  });
  if (!result.ok) {
    throw new Error(`validate-patterns output serialization failed: ${result.error.message}`);
  }
  return result.value;
}

function formatDanglingEntry(entry: DanglingReference): string {
  return `${entry.pattern}.${entry.field} -> ${entry.missing}`;
}

async function enforceDanglingBaseline(
  summary: ValidationSummary,
  entries: readonly DanglingReference[],
  updateBaseline: boolean,
): Promise<{ updatedEntryCount: number | null }> {
  let updatedEntryCount: number | null = null;

  if (updateBaseline) {
    const updatedBaseline = await writeDanglingBaseline(entries);
    updatedEntryCount = updatedBaseline.length;
  }

  const comparison = await compareDanglingBaseline(entries);

  if (comparison.newEntries.length > 0) {
    const newEntryList = comparison.newEntries.map(formatDanglingEntry).join(', ');
    summary.issues.push({
      severity: 'error',
      message:
        `Dangling reference baseline regression: ${String(comparison.newEntries.length)} current entr${comparison.newEntries.length === 1 ? 'y is' : 'ies are'} not present in ${DANGLING_BASELINE_SOURCE_PATH} ` +
        `(baseline ${String(comparison.baseline.length)}, current ${String(comparison.current.length)}). ` +
        `New entries: ${newEntryList}`,
      source: 'cross-source',
    });
  }

  return { updatedEntryCount };
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  const config = parseArgs();

  if (config.version) {
    printVersionAndExit('architect-validate');
  }

  if (config.help) {
    printHelp();
    process.exit(0);
  }

  // Apply config-based defaults if CLI flags not provided
  const configApplied = await applyProjectSourceDefaults(config);

  if (!configApplied && config.input.length === 0) {
    console.error(
      '  (No architect.config.ts or architect.config.js found; provide -i/--input flags)',
    );
  }

  // Validate that we have sources (from CLI or config)
  if (config.input.length === 0) {
    console.error('Error: No TypeScript sources specified.');
    console.error(
      'Provide -i/--input flags or configure sources in architect.config.ts or architect.config.js',
    );
    process.exit(1);
  }
  if (config.features.length === 0) {
    console.error('Error: No feature files specified.');
    console.error(
      'Provide -F/--features flags or configure sources in architect.config.ts or architect.config.js',
    );
    process.exit(1);
  }

  try {
    // Load configuration (discovers architect.config.ts or architect.config.js)
    const configResult = await loadConfig(config.baseDir);
    if (!configResult.ok) {
      console.error(formatConfigError(configResult.error));
      process.exit(1);
    }

    const { instance: dpInstance, isDefault, path: configPath } = configResult.value;
    const registry = dpInstance.registry;
    const configSource = !isDefault && configPath ? configPath : '(built-in default role set)';

    if (config.format === 'pretty') {
      process.stdout.write('Validating patterns...\n');
      process.stdout.write(`  Config: ${configSource}\n`);
      process.stdout.write(`  Base directory: ${config.baseDir}\n`);
      process.stdout.write(`  TypeScript patterns: ${config.input.join(', ')}\n`);
      process.stdout.write(`  Gherkin patterns: ${config.features.join(', ')}\n`);
      process.stdout.write('\n');
    }

    // Build PatternGraph via the shared pipeline factory.
    const pipelineResult = await buildPatternGraph({
      input: config.input,
      features: config.features,
      baseDir: config.baseDir,
      mergeConflictStrategy: 'concatenate',
      ...(config.exclude.length > 0 ? { exclude: config.exclude } : {}),
    });
    if (!pipelineResult.ok) {
      throw new Error(
        `Pipeline error [${pipelineResult.error.step}]: ${pipelineResult.error.message}`,
      );
    }
    const {
      graph: dataset,
      validation: pipelineValidation,
      warnings: pipelineWarnings,
      diagnostics,
    } = pipelineResult.value;
    if (config.format === 'pretty') {
      for (const w of pipelineWarnings) {
        console.warn(`⚠️  ${w.message}`);
      }
    }

    // Warn if no patterns found (common misconfiguration)
    if (dataset.bySourceType.typescript.length === 0) {
      console.warn('⚠️  Warning: No TypeScript patterns found. Check your --input patterns.');
    }
    if (dataset.bySourceType.gherkin.length === 0) {
      console.warn('⚠️  Warning: No Gherkin patterns found. Check your --features patterns.');
    }

    // Run cross-source validation against the read model (DD-2)
    const summary = validatePatterns(dataset);
    const { updatedEntryCount } = await enforceDanglingBaseline(
      summary,
      pipelineValidation.danglingReferences,
      config.updateBaseline,
    );

    // Output cross-source results
    if (config.format === 'pretty') {
      if (updatedEntryCount !== null) {
        process.stdout.write(
          `Updated dangling baseline at ${DANGLING_BASELINE_SOURCE_PATH} with ${String(updatedEntryCount)} entries.\n\n`,
        );
      }
      process.stdout.write(`${formatPretty({ ...summary, diagnostics }, config.verbose)}\n`);
    }

    // Run DoD validation if enabled
    let dodHasErrors = false;
    if (config.dod) {
      const dodSummary = validateDoD(dataset, config.phases);

      if (config.format === 'pretty') {
        process.stdout.write(`${formatDoDSummary(dodSummary)}\n`);
      }

      // Add DoD failures to issues
      for (const result of dodSummary.results) {
        if (!result.isDoDMet) {
          dodHasErrors = true;
          for (const msg of result.messages) {
            if (!msg.startsWith('DoD met')) {
              summary.issues.push({
                severity: 'error',
                message: `[DoD] Phase ${String(result.phase)} (${result.patternName}): ${msg}`,
                source: 'gherkin',
                pattern: result.patternName,
              });
            }
          }
        }
      }
    }

    // Run anti-pattern detection if enabled.
    // Anti-pattern rules still operate on raw scanned sources because they inspect
    // file-level text/layout concerns that are intentionally not preserved in PatternGraph.
    let antiPatternHasErrors = false;
    if (config.antiPatterns) {
      const scannerConfig = ScannerConfigSchema.parse({
        patterns: config.input,
        exclude: config.exclude.length > 0 ? config.exclude : undefined,
        baseDir: config.baseDir,
      });
      const scanResult = await scanPatterns(scannerConfig, registry);
      if (!scanResult.ok) {
        throw new Error('Unexpected scan failure');
      }

      const gherkinScanResult = await scanGherkinFiles({
        patterns: config.features,
        baseDir: config.baseDir,
      });
      if (!gherkinScanResult.ok) {
        throw new Error('Unexpected Gherkin scan failure');
      }

      const thresholds = {
        scenarioBloatThreshold: config.scenarioBloatThreshold,
        megaFeatureLineThreshold: config.megaFeatureLineThreshold,
        magicCommentThreshold: config.magicCommentThreshold,
      };

      const violations = detectAntiPatterns(scanResult.value.files, gherkinScanResult.value.files, {
        registry,
        thresholds,
      });

      if (config.format === 'pretty') {
        process.stdout.write(`${formatAntiPatternReport(violations)}\n`);
      }

      // Add anti-pattern violations to issues
      const antiPatternIssues = toValidationIssues(violations);
      summary.issues.push(...antiPatternIssues);

      antiPatternHasErrors = violations.some((v) => v.severity === 'error');
    }

    const output: ValidatePatternsOutput = {
      ...summary,
      diagnostics,
    };

    // Output JSON if requested (all results combined)
    if (config.format === 'json') {
      process.stdout.write(`${formatJson(output)}\n`);
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
    exitWithProcessError(error, 1);
  }
}

// Entry point — catch ensures parseArgs errors reach the unified handler
export async function runValidatePatternsCli(
  argv: string[] = process.argv.slice(2),
): Promise<void> {
  process.argv = [process.argv[0] ?? 'node', process.argv[1] ?? 'architect-validate', ...argv];
  await main();
}

if (isDirectCliEntrypoint(import.meta.url)) {
  void main().catch((error: unknown) => {
    exitWithProcessError(error, 1);
  });
}
