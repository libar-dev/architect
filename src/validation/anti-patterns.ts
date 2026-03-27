/**
 * @architect
 * @architect-validation
 * @architect-pattern AntiPatternDetector
 * @architect-status completed
 * @architect-arch-role service
 * @architect-arch-context validation
 * @architect-arch-layer application
 * @architect-uses DoDValidationTypes, GherkinTypes
 * @architect-extract-shapes AntiPatternDetectionOptions, detectAntiPatterns, detectProcessInCode, detectMagicComments, detectScenarioBloat, detectMegaFeature, formatAntiPatternReport, toValidationIssues
 *
 * ## AntiPatternDetector - Documentation Anti-Pattern Detection
 *
 * Detects violations of the dual-source documentation architecture and
 * process hygiene issues that lead to documentation drift.
 *
 * ### Anti-Patterns Detected
 *
 * | ID | Severity | Description |
 * |----|----------|-------------|
 * | tag-duplication | error | Dependencies in features (should be code-only) |
 * | process-in-code | error | Process metadata in code (should be features-only) |
 * | magic-comments | warning | Generator hints in features |
 * | scenario-bloat | warning | Too many scenarios per feature |
 * | mega-feature | warning | Feature file too large |
 *
 * ### When to Use
 *
 * - Pre-commit validation to catch architecture violations early
 * - CI pipeline to enforce documentation standards
 * - Code review checklists for documentation quality
 */

import { readFileSync } from 'fs';
import type { ScannedGherkinFile } from '../validation-schemas/feature.js';
import type { TagRegistry } from '../validation-schemas/tag-registry.js';
import type { ScannedFile } from '../scanner/index.js';
import type { AntiPatternViolation, AntiPatternThresholds, WithTagRegistry } from './types.js';
import { DEFAULT_THRESHOLDS } from './types.js';
import { DEFAULT_TAG_PREFIX } from '../config/defaults.js';

// Re-export types for consumers that import from this module
export type { AntiPatternViolation, AntiPatternThresholds } from './types.js';

/**
 * Tag suffixes that should only appear in feature files, not TypeScript code.
 * These are process metadata tags that track delivery workflow state.
 */
const FEATURE_ONLY_TAG_SUFFIXES = [
  'quarter',
  'team',
  'effort',
  'workflow',
  'completed',
  'effort-actual',
] as const;

/**
 * Builds feature-only annotation list from the tag prefix.
 * These tags should appear in feature files, not TypeScript code.
 *
 * @param tagPrefix - The tag prefix (e.g., "@architect-" or "@acme-")
 * @returns Array of full annotation strings (e.g., ["@architect-quarter", "@architect-team", ...])
 */
function buildFeatureOnlyAnnotations(tagPrefix: string): readonly string[] {
  return FEATURE_ONLY_TAG_SUFFIXES.map((suffix) => `${tagPrefix}${suffix}`);
}

/**
 * Magic comment patterns that indicate generator coupling
 */
const MAGIC_COMMENT_PATTERNS = [
  /^#\s*GENERATOR:/i,
  /^#\s*PARSER:/i,
  /^#\s*AUTO-GEN:/i,
  /^#\s*DO NOT EDIT/i,
] as const;

/**
 * Configuration options for anti-pattern detection
 */
export interface AntiPatternDetectionOptions extends WithTagRegistry {
  /** Thresholds for warning triggers */
  readonly thresholds?: Partial<AntiPatternThresholds>;
}

/**
 * Detect process metadata in code anti-pattern
 *
 * Finds process tracking annotations (e.g., @architect-quarter, @architect-team, etc.)
 * in TypeScript files. Process metadata belongs in feature files.
 *
 * @param scannedFiles - Array of scanned TypeScript files
 * @param registry - Optional tag registry for prefix-aware detection (defaults to @architect-)
 * @returns Array of anti-pattern violations
 */
export function detectProcessInCode(
  scannedFiles: readonly ScannedFile[],
  registry?: TagRegistry
): AntiPatternViolation[] {
  const violations: AntiPatternViolation[] = [];
  const tagPrefix = registry?.tagPrefix ?? DEFAULT_TAG_PREFIX;
  const featureOnlyAnnotations = buildFeatureOnlyAnnotations(tagPrefix);

  for (const file of scannedFiles) {
    for (const { directive } of file.directives) {
      // Check tags array for process annotations that shouldn't be in code
      for (const tag of directive.tags) {
        const normalizedTag = (tag as string).toLowerCase();
        for (const annotation of featureOnlyAnnotations) {
          if (normalizedTag === annotation.toLowerCase()) {
            // Extract the suffix part after the prefix
            const suffix = annotation.slice(tagPrefix.length);
            violations.push({
              id: 'process-in-code',
              message: `Annotation "${tag}" found in TypeScript code. Process metadata belongs in feature files.`,
              file: file.filePath,
              line: directive.position.startLine,
              severity: 'error',
              fix: `Move to corresponding .feature file using @architect-${suffix} tag.`,
            });
          }
        }
      }
    }
  }

  return violations;
}

/**
 * Detect magic comments anti-pattern
 *
 * Finds generator hints like "# GENERATOR:", "# PARSER:" in feature files.
 * These create tight coupling between features and generators.
 *
 * @param features - Array of scanned feature files
 * @param threshold - Maximum magic comments before warning (default: 5)
 * @returns Array of anti-pattern violations
 */
export function detectMagicComments(
  features: readonly ScannedGherkinFile[],
  threshold: number = DEFAULT_THRESHOLDS.magicCommentThreshold
): AntiPatternViolation[] {
  const violations: AntiPatternViolation[] = [];

  for (const feature of features) {
    try {
      const content = readFileSync(feature.filePath, 'utf-8');
      const lines = content.split('\n');
      const magicComments: Array<{ line: number; text: string }> = [];

      for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        if (!rawLine) continue;
        const line = rawLine.trim();
        for (const pattern of MAGIC_COMMENT_PATTERNS) {
          if (pattern.test(line)) {
            magicComments.push({ line: i + 1, text: line });
            break;
          }
        }
      }

      if (magicComments.length > threshold) {
        violations.push({
          id: 'magic-comments',
          message: `Feature file has ${magicComments.length} magic comments (threshold: ${threshold}). This creates tight coupling with generators.`,
          file: feature.filePath,
          severity: 'warning',
          fix: `Reduce generator hints. Use standard Gherkin tags and structured data instead.`,
        });
      }
    } catch {
      // Ignore read errors - file may have been deleted
    }
  }

  return violations;
}

/**
 * Detect scenario bloat anti-pattern
 *
 * Finds feature files with too many scenarios, which indicates poor
 * organization and slows test suites.
 *
 * @param features - Array of scanned feature files
 * @param threshold - Maximum scenarios before warning (default: 20)
 * @returns Array of anti-pattern violations
 */
export function detectScenarioBloat(
  features: readonly ScannedGherkinFile[],
  threshold: number = DEFAULT_THRESHOLDS.scenarioBloatThreshold
): AntiPatternViolation[] {
  const violations: AntiPatternViolation[] = [];

  for (const feature of features) {
    const scenarioCount = feature.scenarios.length;
    if (scenarioCount > threshold) {
      violations.push({
        id: 'scenario-bloat',
        message: `Feature file has ${scenarioCount} scenarios (threshold: ${threshold}). Consider splitting by component or domain.`,
        file: feature.filePath,
        severity: 'warning',
        fix: `Split into multiple .feature files organized by component, use case, or business capability.`,
      });
    }
  }

  return violations;
}

/**
 * Detect mega-feature anti-pattern
 *
 * Finds feature files that are too large, which makes them hard to
 * maintain and review.
 *
 * @param features - Array of scanned feature files
 * @param threshold - Maximum lines before warning (default: 500)
 * @returns Array of anti-pattern violations
 */
export function detectMegaFeature(
  features: readonly ScannedGherkinFile[],
  threshold: number = DEFAULT_THRESHOLDS.megaFeatureLineThreshold
): AntiPatternViolation[] {
  const violations: AntiPatternViolation[] = [];

  for (const feature of features) {
    try {
      const content = readFileSync(feature.filePath, 'utf-8');
      const lineCount = content.split('\n').length;

      if (lineCount > threshold) {
        violations.push({
          id: 'mega-feature',
          message: `Feature file has ${lineCount} lines (threshold: ${threshold}). Large files are hard to review and maintain.`,
          file: feature.filePath,
          severity: 'warning',
          fix: `Split into multiple smaller .feature files organized by component or business domain.`,
        });
      }
    } catch {
      // Ignore read errors - file may have been deleted
    }
  }

  return violations;
}

/**
 * Detect all anti-patterns
 *
 * Runs all anti-pattern detectors and returns combined violations.
 *
 * @param scannedFiles - Array of scanned TypeScript files
 * @param features - Array of scanned feature files
 * @param options - Optional configuration (registry for prefix, thresholds)
 * @returns Array of all detected anti-pattern violations
 *
 * @example
 * ```typescript
 * // With default prefix (@architect-)
 * const violations = detectAntiPatterns(tsFiles, featureFiles);
 *
 * // With custom prefix
 * const registry = createDefaultTagRegistry();
 * registry.tagPrefix = "@architect-";
 * const customViolations = detectAntiPatterns(tsFiles, featureFiles, { registry });
 *
 * for (const v of violations) {
 *   console.log(`[${v.severity.toUpperCase()}] ${v.id}: ${v.message}`);
 * }
 * ```
 */
export function detectAntiPatterns(
  scannedFiles: readonly ScannedFile[],
  features: readonly ScannedGherkinFile[],
  options: AntiPatternDetectionOptions = {}
): AntiPatternViolation[] {
  const { registry, thresholds = {} } = options;
  const mergedThresholds: AntiPatternThresholds = {
    ...DEFAULT_THRESHOLDS,
    ...thresholds,
  };

  return [
    // Error-level (architectural violations)
    ...detectProcessInCode(scannedFiles, registry),
    // Warning-level (hygiene issues)
    ...detectMagicComments(features, mergedThresholds.magicCommentThreshold),
    ...detectScenarioBloat(features, mergedThresholds.scenarioBloatThreshold),
    ...detectMegaFeature(features, mergedThresholds.megaFeatureLineThreshold),
  ];
}

/**
 * Format anti-pattern violations for console output
 *
 * @param violations - Array of violations to format
 * @returns Multi-line string for pretty printing
 */
export function formatAntiPatternReport(violations: AntiPatternViolation[]): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('Anti-Pattern Detection Report');
  lines.push('=============================');
  lines.push('');

  if (violations.length === 0) {
    lines.push('No anti-patterns detected.');
    return lines.join('\n');
  }

  const errors = violations.filter((v) => v.severity === 'error');
  const warnings = violations.filter((v) => v.severity === 'warning');

  lines.push(`Total: ${violations.length} (${errors.length} errors, ${warnings.length} warnings)`);
  lines.push('');

  if (errors.length > 0) {
    lines.push('Errors (architectural violations):');
    for (const v of errors) {
      lines.push(`  [ERROR] ${v.id}`);
      lines.push(`          ${v.message}`);
      lines.push(`          at ${v.file}${v.line !== undefined ? `:${v.line}` : ''}`);
      if (v.fix) {
        lines.push(`          Fix: ${v.fix}`);
      }
      lines.push('');
    }
  }

  if (warnings.length > 0) {
    lines.push('Warnings (hygiene issues):');
    for (const v of warnings) {
      lines.push(`  [WARN]  ${v.id}`);
      lines.push(`          ${v.message}`);
      lines.push(`          at ${v.file}${v.line !== undefined ? `:${v.line}` : ''}`);
      if (v.fix) {
        lines.push(`          Fix: ${v.fix}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Convert anti-pattern violations to ValidationIssue format
 *
 * For integration with the existing validate-patterns CLI.
 */
export function toValidationIssues(violations: readonly AntiPatternViolation[]): Array<{
  severity: 'error' | 'warning' | 'info';
  message: string;
  source: 'typescript' | 'gherkin' | 'cross-source';
  pattern?: string;
  file?: string;
}> {
  return violations.map((v) => ({
    severity: v.severity,
    message: `[${v.id}] ${v.message}`,
    source: v.id === 'process-in-code' ? ('typescript' as const) : ('gherkin' as const),
    file: v.file,
  }));
}
