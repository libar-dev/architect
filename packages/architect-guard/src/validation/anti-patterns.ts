/**
 * @architect
 * @architect-validation
 * @architect-pattern AntiPatternDetector
 * @architect-status completed
 * @architect-role:service
 * @architect-bounded-context:validation
 * @architect-uses AntiPatternValidationTypes, GherkinScanResultContract
 *
 * ## AntiPatternDetector - Documentation Anti-Pattern Detection
 *
 * Detects implemented anti-pattern contracts for the split guard package:
 * process metadata leaking into code, removed tags that silently drift, and
 * feature-file hygiene issues that make review and execution brittle.
 *
 * ### Anti-Patterns Detected
 *
 * | ID | Severity | Description |
 * |----|----------|-------------|
 * | process-in-code | error | Process metadata in code (should be features-only) |
 * | removed-tag | error | Removed tag still present (silent data loss) |
 * | ts-missing-architect-marker | error | Pattern JSDoc lacks leading @architect |
 * | ts-tags-after-prose | error | Architect tags after description prose |
 * | ts-uses-space-form | error | Space-separated TypeScript @architect-uses |
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
import type { ScannedGherkinFile } from '@libar-dev/architect-core';
import type { TagRegistry } from '@libar-dev/architect-core';
import type { ScannedFile } from '@libar-dev/architect-core';
import type { AntiPatternViolation, AntiPatternThresholds, WithTagRegistry } from './types.js';
import { DEFAULT_THRESHOLDS } from './types.js';
import {
  detectArchitectTagsAfterProse,
  detectMissingArchitectMarker,
  detectTsUsesSpaceForm,
} from './ts-annotation-integrity.js';
import {
  ARCHITECT_PACKAGE_FEATURE_ONLY_TAG_SUFFIXES,
  DEFAULT_TAG_PREFIX,
  extractProcessMetadata,
} from '@libar-dev/architect-core';

// Re-export types for consumers that import from this module
export type { AntiPatternViolation, AntiPatternThresholds } from './types.js';

/**
 * Tag suffixes that should only appear in feature files, not TypeScript code.
 * These are process metadata tags that track delivery workflow state.
 *
 * Per ADR-001 Rule 6 (D-3 hybrid model): the canonical minimum is `team`;
 * this package extends with `workflow` for its requirement-doc enrichment.
 * Source of truth lives in
 * `@libar-dev/architect-core`'s taxonomy module.
 */
const FEATURE_ONLY_TAG_SUFFIXES = ARCHITECT_PACKAGE_FEATURE_ONLY_TAG_SUFFIXES;

/**
 * Tag suffixes that have been removed from the registry.
 * Using these tags causes silent data loss — the scanner skips unrecognized tags.
 *
 * ADR-013 retires the temporal/release/completion-date dimensions and the
 * unpopulated process-metadata band (`effort`, `effort-actual`, `risk`,
 * `priority`, `since`, `user-role`, `business-value`). Matching is on the full
 * `<prefix><suffix>` token (exact or `<prefix><suffix>:`), so `completed` flags
 * `@architect-completed` but NOT `@architect-status:completed`, and `phase`
 * flags `@architect-phase` but NOT `@architect-level:phase`.
 */
const REMOVED_TAG_SUFFIXES = [
  'brief',
  'quarter',
  'phase',
  'release',
  'completed',
  'effort',
  'effort-actual',
  'risk',
  'priority',
  'since',
  'user-role',
  'business-value',
] as const;

/**
 * Builds feature-only annotation list from the tag prefix.
 * These tags should appear in feature files, not TypeScript code.
 *
 * @param tagPrefix - The tag prefix (e.g., "@architect-" or "@acme-")
 * @returns Array of full annotation strings (e.g., ["@architect-team", "@architect-workflow", ...])
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
 * Escape regex metacharacters so a literal tag token (which contains `-` and,
 * for non-default prefixes, possibly other metacharacters) can be embedded in a
 * dynamically constructed `RegExp` without altering its meaning.
 */
function escapeRegExp(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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
 * Finds process tracking annotations (e.g., @architect-team, @architect-workflow, etc.)
 * in TypeScript files. Process metadata belongs in feature files.
 *
 * @param scannedFiles - Array of scanned TypeScript files
 * @param registry - Optional tag registry for prefix-aware detection (defaults to @architect-)
 * @returns Array of anti-pattern violations
 */
export function detectProcessInCode(
  scannedFiles: readonly ScannedFile[],
  registry?: TagRegistry,
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
 * Detect removed tags in feature files
 *
 * Finds tags that were removed from the registry but still appear in source files.
 * These tags are silently discarded by the scanner, causing data loss without
 * any diagnostic. This detector makes the failure explicit.
 *
 * @param features - Array of scanned feature files
 * @param registry - Optional tag registry for prefix-aware detection (defaults to @architect-)
 * @returns Array of anti-pattern violations
 */
export function detectRemovedTags(
  features: readonly ScannedGherkinFile[],
  registry?: TagRegistry,
): AntiPatternViolation[] {
  const violations: AntiPatternViolation[] = [];
  const tagPrefix = registry?.tagPrefix ?? DEFAULT_TAG_PREFIX;

  for (const feature of features) {
    try {
      const content = readFileSync(feature.filePath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        if (!rawLine) continue;
        const trimmed = rawLine.trim();
        if (!trimmed.startsWith('@')) continue;

        const tokens = trimmed.split(/\s+/);
        for (const token of tokens) {
          if (!token.startsWith('@')) continue;
          const normalized = token.toLowerCase();

          for (const suffix of REMOVED_TAG_SUFFIXES) {
            const removed = `${tagPrefix}${suffix}`.toLowerCase();
            if (normalized === removed || normalized.startsWith(`${removed}:`)) {
              violations.push({
                id: 'removed-tag',
                message: `Tag "${token}" has been removed and is no longer recognized. Data annotated with this tag is silently discarded.`,
                file: feature.filePath,
                line: i + 1,
                severity: 'error',
                fix: `Remove the ${token} annotation. The "${suffix}" metadata field no longer exists.`,
              });
            }
          }
        }
      }
    } catch {
      // Ignore read errors - file may have been deleted
    }
  }

  return violations;
}

/**
 * Tags whose Gherkin (single-token) form REQUIRES a colon separator.
 *
 * On `.feature` files a tag is one whitespace-delimited token, so identity tags
 * are written colon-form (`@architect-pattern:Name`, `@architect-implements:Name`).
 * The space-form authored on TypeScript JSDoc (`@architect-pattern Name`) is a
 * silent slip on a feature file: the scanner reads only the bare
 * `@architect-pattern` token and drops the name, so the pattern identity / reverse
 * edge is lost without any diagnostic. This detector makes that slip loud.
 */
const GHERKIN_COLON_FORM_TAG_SUFFIXES = ['pattern', 'implements'] as const;

/**
 * Detect Gherkin identity tags authored in space-form instead of colon-form.
 *
 * On a `.feature` file, `@architect-pattern Name` / `@architect-implements Name`
 * (whitespace after the suffix) is invalid: Gherkin tags are single tokens, so
 * the name is silently dropped and the identity / reverse-traceability edge never
 * materializes in the graph. The correct form is `@architect-pattern:Name`.
 *
 * Matching mirrors {@link detectRemovedTags}: it scans raw lines that begin with a
 * tag, is prefix-aware via the registry, and reports `error` severity (the slip
 * causes silent data loss, exactly like a removed tag).
 *
 * @param features - Array of scanned feature files
 * @param registry - Optional tag registry for prefix-aware detection (defaults to @architect-)
 * @returns Array of anti-pattern violations
 */
export function detectGherkinTagSpaceForm(
  features: readonly ScannedGherkinFile[],
  registry?: TagRegistry,
): AntiPatternViolation[] {
  const violations: AntiPatternViolation[] = [];
  const tagPrefix = registry?.tagPrefix ?? DEFAULT_TAG_PREFIX;

  for (const feature of features) {
    try {
      const content = readFileSync(feature.filePath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        if (!rawLine) continue;
        const trimmed = rawLine.trim();
        if (!trimmed.startsWith('@')) continue;

        for (const suffix of GHERKIN_COLON_FORM_TAG_SUFFIXES) {
          // Space-form = the prefix+suffix token immediately followed by whitespace
          // (e.g. "@architect-pattern Name"). Colon-form ("@architect-pattern:Name")
          // and prefixed siblings ("@architect-pattern-foo") must NOT match.
          const spaceForm = new RegExp(`(^|\\s)${escapeRegExp(`${tagPrefix}${suffix}`)}\\s`, 'i');
          if (spaceForm.test(`${trimmed} `)) {
            violations.push({
              id: 'gherkin-tag-space-form',
              message: `Tag "${tagPrefix}${suffix}" on a .feature file uses space-form (the name is silently dropped). Gherkin tags are single tokens and must use colon form: ${tagPrefix}${suffix}:Name`,
              file: feature.filePath,
              line: i + 1,
              severity: 'error',
              fix: `Rewrite as ${tagPrefix}${suffix}:Name (colon, no space). Space-form is only valid on TypeScript JSDoc.`,
            });
          }
        }
      }
    } catch {
      // Ignore read errors - file may have been deleted
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
  threshold: number = DEFAULT_THRESHOLDS.magicCommentThreshold,
): AntiPatternViolation[] {
  const violations: AntiPatternViolation[] = [];

  for (const feature of features) {
    try {
      const content = readFileSync(feature.filePath, 'utf-8');
      const lines = content.split('\n');
      const magicComments: { line: number; text: string }[] = [];

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
          message: `Feature file has ${String(magicComments.length)} magic comments (threshold: ${String(threshold)}). This creates tight coupling with generators.`,
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
  threshold: number = DEFAULT_THRESHOLDS.scenarioBloatThreshold,
): AntiPatternViolation[] {
  const violations: AntiPatternViolation[] = [];

  for (const feature of features) {
    const scenarioCount = feature.scenarios.length;
    if (scenarioCount > threshold) {
      violations.push({
        id: 'scenario-bloat',
        message: `Feature file has ${String(scenarioCount)} scenarios (threshold: ${String(threshold)}). Consider splitting by component or domain.`,
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
  threshold: number = DEFAULT_THRESHOLDS.megaFeatureLineThreshold,
): AntiPatternViolation[] {
  const violations: AntiPatternViolation[] = [];

  for (const feature of features) {
    try {
      const content = readFileSync(feature.filePath, 'utf-8');
      const lineCount = content.split('\n').length;

      if (lineCount > threshold) {
        violations.push({
          id: 'mega-feature',
          message: `Feature file has ${String(lineCount)} lines (threshold: ${String(threshold)}). Large files are hard to review and maintain.`,
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
/**
 * Detect duplicate Gherkin pattern identities — the same feature-level
 * `@architect-pattern:<Name>` declared across more than one `.feature` file.
 *
 * ADR-001 requires exactly one file to own a pattern's identity. When two
 * features declare the same identity, the dual-source extractor's `featureIndex`
 * map silently last-write-wins (the second file's rules/scenarios are dropped),
 * and every downstream gate (`validate:all`, the `architect dangling` graph gate, the process guard)
 * passes over it because the duplicate has already collapsed to one node.
 *
 * This check runs over the RAW scanned feature files — the one place the
 * collision is still visible — and uses {@link extractProcessMetadata} (the same
 * feature-level extractor the graph builder uses), so it reads ONLY the top
 * feature tag block and never false-positives on `@architect-pattern:` tokens
 * that appear inside scenario docstrings / `"""`-fenced fixtures.
 */
export function detectDuplicateFeatureIdentities(
  features: readonly ScannedGherkinFile[],
): AntiPatternViolation[] {
  const filesByIdentity = new Map<string, string[]>();
  for (const feature of features) {
    const metadata = extractProcessMetadata(feature);
    if (!metadata?.pattern) continue;
    const files = filesByIdentity.get(metadata.pattern) ?? [];
    files.push(feature.filePath);
    filesByIdentity.set(metadata.pattern, files);
  }

  const violations: AntiPatternViolation[] = [];
  for (const [identity, files] of filesByIdentity) {
    if (files.length < 2) continue;
    const sorted = [...files].sort();
    for (const file of sorted) {
      violations.push({
        id: 'duplicate-pattern-identity',
        message: `Gherkin pattern identity "${identity}" is declared in ${String(sorted.length)} feature files: ${sorted.join(', ')}. ADR-001 requires exactly one file to own a pattern's @architect-pattern identity; the extractor silently drops all but one.`,
        file,
        line: 1,
        severity: 'error',
        fix: `Give all but one of these features a distinct @architect-pattern identity (add @architect-implements:${identity} if it realizes the same pattern, mirroring the sibling slice features).`,
      });
    }
  }
  return violations;
}

export function detectAntiPatterns(
  scannedFiles: readonly ScannedFile[],
  features: readonly ScannedGherkinFile[],
  options: AntiPatternDetectionOptions = {},
): AntiPatternViolation[] {
  const { registry, thresholds = {} } = options;
  const mergedThresholds: AntiPatternThresholds = {
    ...DEFAULT_THRESHOLDS,
    ...thresholds,
  };

  return [
    // Error-level (architectural violations)
    ...detectProcessInCode(scannedFiles, registry),
    ...detectRemovedTags(features, registry),
    ...detectGherkinTagSpaceForm(features, registry),
    ...detectMissingArchitectMarker(scannedFiles, registry),
    ...detectArchitectTagsAfterProse(scannedFiles, registry),
    ...detectTsUsesSpaceForm(scannedFiles, registry),
    ...detectDuplicateFeatureIdentities(features),
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

  lines.push(
    `Total: ${String(violations.length)} (${String(errors.length)} errors, ${String(warnings.length)} warnings)`,
  );
  lines.push('');

  if (errors.length > 0) {
    lines.push('Errors (architectural violations):');
    for (const v of errors) {
      lines.push(`  [ERROR] ${v.id}`);
      lines.push(`          ${v.message}`);
      lines.push(`          at ${v.file}${v.line !== undefined ? `:${String(v.line)}` : ''}`);
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
      lines.push(`          at ${v.file}${v.line !== undefined ? `:${String(v.line)}` : ''}`);
      if (v.fix) {
        lines.push(`          Fix: ${v.fix}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

const TYPESCRIPT_ANTI_PATTERN_IDS = new Set<AntiPatternViolation['id']>([
  'process-in-code',
  'ts-missing-architect-marker',
  'ts-tags-after-prose',
  'ts-uses-space-form',
]);

function isTypeScriptAntiPattern(id: AntiPatternViolation['id']): boolean {
  return TYPESCRIPT_ANTI_PATTERN_IDS.has(id);
}

/**
 * Convert anti-pattern violations to ValidationIssue format
 *
 * For integration with the existing validate-patterns CLI.
 */
export function toValidationIssues(violations: readonly AntiPatternViolation[]): {
  severity: 'error' | 'warning' | 'info';
  message: string;
  source: 'typescript' | 'gherkin' | 'cross-source';
  pattern?: string;
  file?: string;
}[] {
  return violations.map((v) => ({
    severity: v.severity,
    message: `[${v.id}] ${v.message}`,
    source: isTypeScriptAntiPattern(v.id) ? ('typescript' as const) : ('gherkin' as const),
    file: v.file,
  }));
}
