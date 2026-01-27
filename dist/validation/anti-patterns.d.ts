/**
 * @libar-docs
 * @libar-docs-validation
 * @libar-docs-pattern AntiPatternDetector
 * @libar-docs-status completed
 * @libar-docs-uses DoDValidationTypes, GherkinTypes
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
import type { ScannedGherkinFile } from '../validation-schemas/feature.js';
import type { TagRegistry } from '../validation-schemas/tag-registry.js';
import type { ScannedFile } from '../scanner/index.js';
import type { AntiPatternViolation, AntiPatternThresholds, WithTagRegistry } from './types.js';
export type { AntiPatternViolation, AntiPatternThresholds } from './types.js';
/**
 * Configuration options for anti-pattern detection
 */
export interface AntiPatternDetectionOptions extends WithTagRegistry {
    /** Thresholds for warning triggers */
    readonly thresholds?: Partial<AntiPatternThresholds>;
}
/**
 * Detect tag duplication anti-pattern
 *
 * Finds code-only tags that should not appear in feature files.
 * Currently returns empty array as all deprecated tags have been migrated.
 * Kept for API stability and future extensibility.
 *
 * @param features - Array of scanned feature files
 * @param registry - Optional tag registry for prefix-aware messages (defaults to @libar-docs-)
 * @returns Array of anti-pattern violations (currently always empty)
 */
export declare function detectTagDuplication(features: readonly ScannedGherkinFile[], registry?: TagRegistry): AntiPatternViolation[];
/**
 * Detect process metadata in code anti-pattern
 *
 * Finds process tracking annotations (e.g., @docs-quarter, @docs-team, etc.)
 * in TypeScript files. Process metadata belongs in feature files.
 *
 * @param scannedFiles - Array of scanned TypeScript files
 * @param registry - Optional tag registry for prefix-aware detection (defaults to @libar-docs-)
 * @returns Array of anti-pattern violations
 */
export declare function detectProcessInCode(scannedFiles: readonly ScannedFile[], registry?: TagRegistry): AntiPatternViolation[];
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
export declare function detectMagicComments(features: readonly ScannedGherkinFile[], threshold?: number): AntiPatternViolation[];
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
export declare function detectScenarioBloat(features: readonly ScannedGherkinFile[], threshold?: number): AntiPatternViolation[];
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
export declare function detectMegaFeature(features: readonly ScannedGherkinFile[], threshold?: number): AntiPatternViolation[];
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
 * // With default prefix (@libar-docs-)
 * const violations = detectAntiPatterns(tsFiles, featureFiles);
 *
 * // With custom prefix
 * const registry = createDefaultTagRegistry();
 * registry.tagPrefix = "@docs-";
 * const customViolations = detectAntiPatterns(tsFiles, featureFiles, { registry });
 *
 * for (const v of violations) {
 *   console.log(`[${v.severity.toUpperCase()}] ${v.id}: ${v.message}`);
 * }
 * ```
 */
export declare function detectAntiPatterns(scannedFiles: readonly ScannedFile[], features: readonly ScannedGherkinFile[], options?: AntiPatternDetectionOptions): AntiPatternViolation[];
/**
 * Format anti-pattern violations for console output
 *
 * @param violations - Array of violations to format
 * @returns Multi-line string for pretty printing
 */
export declare function formatAntiPatternReport(violations: AntiPatternViolation[]): string;
/**
 * Convert anti-pattern violations to ValidationIssue format
 *
 * For integration with the existing validate-patterns CLI.
 */
export declare function toValidationIssues(violations: readonly AntiPatternViolation[]): Array<{
    severity: 'error' | 'warning' | 'info';
    message: string;
    source: 'typescript' | 'gherkin' | 'cross-source';
    pattern?: string;
    file?: string;
}>;
//# sourceMappingURL=anti-patterns.d.ts.map