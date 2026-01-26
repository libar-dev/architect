/**
 * @libar-docs
 * @libar-docs-extractor
 * @libar-docs-pattern DualSourceExtractor
 * @libar-docs-status completed
 * @libar-docs-uses DocExtractor, GherkinExtractor, GherkinScanner
 * @libar-docs-used-by Orchestrator
 *
 * ## DualSourceExtractor - Compose Pattern Data from Code + Features
 *
 * Extracts pattern metadata from both TypeScript code stubs (@libar-docs-*)
 * and Gherkin feature files (@libar-process-*), validates consistency,
 * and composes unified pattern data for documentation generation.
 *
 * ### When to Use
 *
 * - When implementing USDP Pattern 2 (Standard) or higher
 * - When you have both code stubs AND timeline features
 * - When generating artifacts that need both timeless and temporal data
 * - When validating cross-source consistency (pattern name, phase alignment)
 *
 * ### Key Concepts
 *
 * - **Code Source**: @libar-docs-* tags define timeless pattern graph
 * - **Feature Source**: @libar-process-* tags add temporal process metadata
 * - **Cross-Validation**: Pattern name + phase must match across sources
 * - **Deliverables**: Parsed from Gherkin Background tables in features
 */
import type { ExtractedPattern } from "../types/index.js";
import { type ScannedGherkinFile, type ProcessMetadata, type Deliverable, type CrossValidationError, type ValidationSummary } from "../validation-schemas/index.js";
export type { ProcessMetadata, Deliverable, CrossValidationError, ValidationSummary };
/**
 * Results from dual-source extraction
 *
 * Contains patterns successfully matched across sources, orphaned
 * code/feature patterns, and cross-validation errors.
 */
export interface DualSourceResults {
    /** Patterns with both code + process data */
    readonly patterns: readonly DualSourcePattern[];
    /** Patterns from code only (no matching feature) */
    readonly codeOnly: readonly ExtractedPattern[];
    /** Features without matching code stubs */
    readonly featureOnly: readonly ProcessMetadata[];
    /** Cross-validation errors */
    readonly validationErrors: readonly CrossValidationError[];
    /** Non-fatal warnings (e.g., pattern name collisions) */
    readonly warnings: readonly string[];
}
/**
 * Combined pattern data from code + features
 *
 * When multiple code files define the same pattern (e.g., ServiceIndependence
 * with ECST and Reservation sub-patterns), they are merged into a single
 * dual-source pattern with the `sources` array containing all variants.
 */
export interface DualSourcePattern extends ExtractedPattern {
    /** Process metadata from feature file (optional) */
    readonly process?: ProcessMetadata;
    /** Deliverables from feature Background table (optional) */
    readonly deliverables?: readonly Deliverable[];
    /**
     * Multiple source patterns when there's a name collision (optional)
     * Present when multiple code files use the same @libar-docs-pattern name
     */
    readonly sources?: readonly ExtractedPattern[];
}
/**
 * Extract process metadata from Gherkin feature tags
 *
 * Uses schema validation instead of type assertions to ensure data integrity.
 * Returns null if required tags are missing OR if validation fails.
 *
 * @param feature - Scanned Gherkin feature
 * @returns Process metadata or null if missing required tags or validation fails
 */
export declare function extractProcessMetadata(feature: ScannedGherkinFile): ProcessMetadata | null;
/**
 * Extract deliverables from Gherkin Background table
 *
 * Parses Background section looking for DataTables with a "Deliverable" column.
 * Expected table format:
 * | Deliverable | Status | Tests | Location |
 *
 * Optional columns for extended tracking:
 * | Deliverable | Status | Tests | Location | Finding | Release |
 *
 * - **Finding**: Review traceability ID (e.g., "CODE-001")
 * - **Release**: Semver version for changelog grouping (e.g., "v0.2.0")
 *
 * @param feature - Scanned Gherkin feature with optional background
 * @returns Array of deliverables or empty array if no table found
 *
 * @example
 * ```gherkin
 * Background: Deliverables
 *   Given the following deliverables:
 *     | Deliverable | Status | Tests | Location | Finding | Release |
 *     | Fix parseArgs() call | Done | Yes | src/cli/generate-docs.ts | CODE-001 | v0.2.0 |
 *     | Update README.md | Done | No | README.md | DOC-001 | v0.2.0 |
 * ```
 */
export declare function extractDeliverables(feature: ScannedGherkinFile): readonly Deliverable[];
/**
 * Combine patterns from code and features into dual-source patterns
 *
 * Validates that pattern names and phases match across sources.
 * Creates unified pattern objects with both code and process metadata.
 *
 * **Pattern Name Collisions:**
 * When multiple code files use the same `@libar-docs-pattern` name (e.g.,
 * ServiceIndependence with ECST and Reservation sub-patterns), they are
 * automatically merged:
 * - Categories, dependencies, and enables are unioned across all sources
 * - Primary pattern (first in array) provides base metadata
 * - All source patterns are preserved in the `sources` array
 * - Console warning is emitted for visibility
 *
 * @param codePatterns - Patterns extracted from TypeScript code
 * @param featureFiles - Scanned Gherkin feature files
 * @returns Dual-source extraction results
 *
 * @example
 * ```typescript
 * // Extract from both sources
 * const codeScan = await scanPatterns({ patterns: 'packages/**\/*.ts' });
 * const featureScan = await scanGherkinFiles({ patterns: 'tests/features/**\/*.feature' });
 *
 * if (codeScan.ok && featureScan.ok) {
 *   const codeExtraction = extractPatterns(codeScan.value.files, '/project');
 *   const dualSource = combineSources(codeExtraction.patterns, featureScan.value.files);
 *
 *   console.log(`Combined: ${dualSource.patterns.length}`);
 *   console.log(`Code-only: ${dualSource.codeOnly.length}`);
 *   console.log(`Feature-only: ${dualSource.featureOnly.length}`);
 *   console.log(`Validation errors: ${dualSource.validationErrors.length}`);
 *
 *   // Check for collisions
 *   for (const pattern of dualSource.patterns) {
 *     if (pattern.sources) {
 *       console.log(`${pattern.patternName} has ${pattern.sources.length} implementations`);
 *     }
 *   }
 * }
 * ```
 */
export declare function combineSources(codePatterns: readonly ExtractedPattern[], featureFiles: readonly ScannedGherkinFile[]): DualSourceResults;
/**
 * Validate dual-source consistency
 *
 * Checks that patterns are properly aligned across sources.
 * Reports code stubs without features and features without code.
 *
 * @param results - Dual-source extraction results
 * @returns Validation summary
 */
export declare function validateDualSource(results: DualSourceResults): ValidationSummary;
//# sourceMappingURL=dual-source-extractor.d.ts.map