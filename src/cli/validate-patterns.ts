#!/usr/bin/env node

/**
 * @libar-docs
 * @libar-docs-cli
 * @libar-docs-pattern ValidatePatternsCLI
 * @libar-docs-status completed
 * @libar-docs-uses PatternScanner, GherkinScanner, DocExtractor, GherkinExtractor, MasterDataset, CodecUtils
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
import {
  loadConfig,
  applyProjectSourceDefaults,
  formatConfigError,
} from '../config/config-loader.js';
import { buildMasterDataset } from '../generators/pipeline/index.js';
import {
  ScannerConfigSchema,
  createJsonOutputCodec,
  ValidationSummaryOutputSchema,
} from '../validation-schemas/index.js';
import type { ExtractedPattern } from '../validation-schemas/index.js';
import { normalizeStatus, isPatternComplete } from '../taxonomy/index.js';
import type { RuntimeMasterDataset } from '../generators/pipeline/index.js';
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
  -i, --input <pattern>       Glob pattern for TypeScript files (repeatable; falls back to config)
  -F, --features <pattern>    Glob pattern for Gherkin feature files (repeatable; falls back to config)
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
 * Check if a TS pattern has a cross-source match via implements relationships.
 *
 * DD-3 Phase 2: For TS patterns not matched by name, check:
 * 1. If any Gherkin pattern implements this TS pattern (implementedBy)
 * 2. If this TS pattern implements a Gherkin pattern (implementsPatterns)
 */
function hasImplementsMatch(
  tsPattern: ExtractedPattern,
  tsName: string,
  gherkinByName: ReadonlyMap<string, ExtractedPattern>,
  dataset: RuntimeMasterDataset
): boolean {
  // Check if a Gherkin pattern implements this TS pattern
  if ((dataset.relationshipIndex?.[tsName]?.implementedBy.length ?? 0) > 0) {
    return true;
  }

  // Check if this TS pattern implements a Gherkin pattern
  const implements_ = tsPattern.implementsPatterns ?? [];
  for (const implName of implements_) {
    if (gherkinByName.has(implName.toLowerCase())) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a Gherkin pattern has a cross-source match via implements relationships.
 *
 * Symmetric counterpart to hasImplementsMatch for the Gherkin→TS direction:
 * 1. If a TS pattern implements this Gherkin pattern (implementedBy)
 * 2. If this Gherkin pattern implements a TS pattern (implementsPatterns)
 */
function hasGherkinImplementsMatch(
  gherkinPattern: ExtractedPattern,
  tsByName: ReadonlyMap<string, ExtractedPattern>,
  dataset: RuntimeMasterDataset
): boolean {
  const name = getPatternName(gherkinPattern);

  // Check reverse: a TS pattern implements this Gherkin pattern
  if (
    dataset.relationshipIndex?.[name]?.implementedBy.some((ref) =>
      tsByName.has(ref.name.toLowerCase())
    ) === true
  ) {
    return true;
  }

  // Check forward: this Gherkin pattern implements a TS pattern
  const implements_ = gherkinPattern.implementsPatterns ?? [];
  for (const implName of implements_) {
    if (tsByName.has(implName.toLowerCase())) {
      return true;
    }
  }

  return false;
}

/**
 * Validate cross-source consistency using the MasterDataset read model.
 *
 * Compares TypeScript patterns against Gherkin patterns to find:
 * - Missing patterns in either source (with implements-aware resolution)
 * - Phase number mismatches
 * - Status mismatches (after normalization)
 * - Missing deliverables for completed phases
 * - Invalid dependencies
 *
 * DD-2: Consumes RuntimeMasterDataset instead of raw scanner/extractor output.
 * DD-3: Two-phase matching — name-based first, then relationshipIndex fallback.
 *
 * @param dataset - The pre-computed MasterDataset read model
 * @returns Validation summary with issues and statistics
 */
export function validatePatterns(dataset: RuntimeMasterDataset): ValidationSummary {
  const issues: ValidationIssue[] = [];
  const tsPatterns = dataset.bySource.typescript;
  const gherkinPatterns = dataset.bySource.gherkin;

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
    const tsName = getPatternName(tsPattern).toLowerCase();
    let gherkinMatch = gherkinByName.get(tsName);

    // If the Gherkin pattern explicitly implements a DIFFERENT pattern, it's not
    // a true name match — it's a naming collision. The Gherkin pattern belongs to
    // whichever pattern it declares in @libar-docs-implements.
    if (gherkinMatch !== undefined) {
      const gherkinImpl = gherkinMatch.implementsPatterns ?? [];
      if (gherkinImpl.length > 0 && !gherkinImpl.some((n) => n.toLowerCase() === tsName)) {
        gherkinMatch = undefined;
      }
    }

    if (!gherkinMatch) {
      // Phase 2: Check implements relationships before reporting
      if (hasImplementsMatch(tsPattern, getPatternName(tsPattern), gherkinByName, dataset)) {
        matched++;
      } else if (tsPattern.phase !== undefined) {
        // Only report for roadmap patterns (those with phase numbers)
        const name = getPatternName(tsPattern);
        missingInGherkinCount++;
        issues.push({
          severity: 'warning',
          message: `Pattern "${name}" in TypeScript has no matching Gherkin feature`,
          source: 'cross-source',
          pattern: name,
          file: tsPattern.source.file,
        });
      }
    } else {
      matched++;

      // Check phase consistency
      if (tsPattern.phase !== undefined && gherkinMatch.phase !== undefined) {
        if (tsPattern.phase !== gherkinMatch.phase) {
          const name = getPatternName(tsPattern);
          issues.push({
            severity: 'error',
            message: `Phase mismatch for "${name}": TypeScript=${tsPattern.phase}, Gherkin=${gherkinMatch.phase}`,
            source: 'cross-source',
            pattern: name,
          });
        }
      }

      // Check status consistency
      if (tsPattern.status && gherkinMatch.status) {
        const tsStatus = normalizeStatus(tsPattern.status);
        const gherkinStatus = normalizeStatus(gherkinMatch.status);
        if (tsStatus !== gherkinStatus) {
          const name = getPatternName(tsPattern);
          // Include both raw and normalized values for clarity when they differ textually
          const rawDiffers = tsPattern.status.toLowerCase() !== gherkinMatch.status.toLowerCase();
          const message = rawDiffers
            ? `Status mismatch for "${name}": TypeScript="${tsPattern.status}" (→${tsStatus}), Gherkin="${gherkinMatch.status}" (→${gherkinStatus})`
            : `Status mismatch for "${name}": TypeScript=${tsStatus}, Gherkin=${gherkinStatus}`;
          issues.push({
            severity: 'error',
            message,
            source: 'cross-source',
            pattern: name,
          });
        }
      }
    }
  }

  // Check Gherkin patterns against TypeScript
  let missingInTsCount = 0;
  for (const gherkinPattern of gherkinPatterns) {
    const gherkinName = getPatternName(gherkinPattern).toLowerCase();
    let tsMatch = tsByName.get(gherkinName);

    // Symmetric collision guard: if the TS pattern implements a DIFFERENT Gherkin
    // pattern, it's a naming collision, not a true match.
    if (tsMatch !== undefined) {
      const tsImpl = tsMatch.implementsPatterns ?? [];
      if (tsImpl.length > 0 && !tsImpl.some((n) => n.toLowerCase() === gherkinName)) {
        tsMatch = undefined;
      }
    }

    if (!tsMatch) {
      // Two-phase implements resolution (symmetric with TS→Gherkin direction)
      if (!hasGherkinImplementsMatch(gherkinPattern, tsByName, dataset)) {
        const name = getPatternName(gherkinPattern);
        missingInTsCount++;
        issues.push({
          severity: 'info',
          message: `Pattern "${name}" in Gherkin has no matching TypeScript pattern`,
          source: 'cross-source',
          pattern: name,
          file: gherkinPattern.source.file,
        });
      }
    }
  }

  // Check deliverables for completed roadmap patterns (those with phase numbers).
  // Test features and ADRs are completed but don't participate in the deliverables workflow.
  for (const gherkinPattern of gherkinPatterns) {
    if (isPatternComplete(gherkinPattern.status) && gherkinPattern.phase !== undefined) {
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
  }

  // Check dependencies exist
  const allPatternNames = new Set([...tsByName.keys(), ...gherkinByName.keys()]);

  for (const pattern of tsPatterns) {
    const deps = pattern.dependsOn ?? [];
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

  // Apply config-based defaults if CLI flags not provided
  const configApplied = await applyProjectSourceDefaults(config);

  if (!configApplied && config.input.length === 0) {
    console.error('  (No delivery-process.config.ts found; provide -i/--input flags)');
  }

  // Validate that we have sources (from CLI or config)
  if (config.input.length === 0) {
    console.error('Error: No TypeScript sources specified.');
    console.error('Provide -i/--input flags or configure sources in delivery-process.config.ts');
    process.exit(1);
  }
  if (config.features.length === 0) {
    console.error('Error: No feature files specified.');
    console.error('Provide -F/--features flags or configure sources in delivery-process.config.ts');
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

    // Build MasterDataset via shared pipeline factory (DD-7)
    const pipelineResult = await buildMasterDataset({
      input: config.input,
      features: config.features,
      baseDir: config.baseDir,
      mergeConflictStrategy: 'concatenate',
      ...(config.exclude.length > 0 ? { exclude: config.exclude } : {}),
    });
    if (!pipelineResult.ok) {
      throw new Error(
        `Pipeline error [${pipelineResult.error.step}]: ${pipelineResult.error.message}`
      );
    }
    const { dataset, warnings: pipelineWarnings } = pipelineResult.value;
    if (config.format === 'pretty') {
      for (const w of pipelineWarnings) {
        console.warn(`⚠️  ${w.message}`);
      }
    }

    // Raw scans for stage-1 consumers (DoD validation, anti-pattern detection)
    // These correctly use scanned file data, not the MasterDataset — see DD-7
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

    // Warn if no patterns found (common misconfiguration)
    if (dataset.bySource.typescript.length === 0) {
      console.warn('⚠️  Warning: No TypeScript patterns found. Check your --input patterns.');
    }
    if (dataset.bySource.gherkin.length === 0) {
      console.warn('⚠️  Warning: No Gherkin patterns found. Check your --features patterns.');
    }

    // Run cross-source validation against the read model (DD-2)
    const summary = validatePatterns(dataset);

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
