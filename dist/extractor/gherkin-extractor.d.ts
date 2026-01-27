/**
 * @libar-docs
 * @libar-docs-extractor
 * @libar-docs-pattern GherkinExtractor
 * @libar-docs-status completed
 * @libar-docs-uses GherkinTypes, GherkinASTParser
 * @libar-docs-used-by DualSourceExtractor, Orchestrator
 *
 * ## GherkinExtractor - Convert Feature Files to Pattern Documentation
 *
 * Transforms scanned Gherkin feature files into ExtractedPattern objects
 * for inclusion in generated documentation. Maps feature tags, descriptions,
 * and scenarios to pattern metadata.
 *
 * ### When to Use
 *
 * - When building multi-source documentation (TypeScript + Gherkin)
 * - When converting acceptance criteria to pattern documentation
 * - When defining roadmap patterns in .feature files before implementation
 *
 * ### Key Concepts
 *
 * - **Feature → Pattern**: Feature name becomes pattern name
 * - **Tags → Metadata**: @pattern:Name, @phase:N map to pattern fields
 * - **Scenarios → Use Cases**: Acceptance criteria become "When to Use" examples
 */
import type { ScannedGherkinFile } from '../validation-schemas/feature.js';
import { type ExtractedPattern } from '../validation-schemas/extracted-pattern.js';
import type { TagRegistry } from '../validation-schemas/tag-registry.js';
import { type GherkinPatternValidationError } from '../types/errors.js';
/**
 * Configuration for Gherkin extractor
 */
export interface GherkinExtractorConfig {
    /** Base directory for computing relative paths */
    readonly baseDir: string;
    /** Tag registry for category inference */
    readonly tagRegistry?: TagRegistry;
    /** Convert scenarios to "When to Use" examples (default: true) */
    readonly scenariosAsUseCases?: boolean;
}
/**
 * Result of Gherkin pattern extraction
 *
 * Contains both successfully extracted patterns and any validation errors
 * encountered during extraction. This enables partial success scenarios
 * where some patterns extract successfully while others fail validation.
 */
export interface GherkinExtractionResult {
    /** Successfully extracted patterns */
    readonly patterns: readonly ExtractedPattern[];
    /** Validation errors for patterns that failed extraction */
    readonly errors: readonly GherkinPatternValidationError[];
}
/**
 * Extract patterns from scanned Gherkin feature files
 *
 * Converts feature file metadata into ExtractedPattern objects that can be
 * merged with TypeScript-sourced patterns for unified documentation generation.
 *
 * Returns both successfully extracted patterns and validation errors for
 * patterns that failed extraction. This enables partial success scenarios.
 *
 * @param scannedFiles - Array of scanned Gherkin files
 * @param config - Extractor configuration (requires baseDir for relative paths)
 * @returns Object containing extracted patterns and any validation errors
 *
 * @example
 * ```typescript
 * const scanResult = await scanGherkinFiles({
 *   patterns: 'tests/features/roadmap/**\/*.feature'
 * });
 *
 * if (scanResult.ok) {
 *   const { patterns, errors } = extractPatternsFromGherkin(scanResult.value.files, {
 *     baseDir: process.cwd()
 *   });
 *   console.log(`${patterns.length} patterns extracted, ${errors.length} errors`);
 * }
 * ```
 */
export declare function extractPatternsFromGherkin(scannedFiles: readonly ScannedGherkinFile[], config: GherkinExtractorConfig): GherkinExtractionResult;
/**
 * Infer behavior file path from timeline feature file path using convention
 *
 * Convention: `timeline/phase-N[suffix]-name.feature` → `behavior/name.feature`
 *
 * Handles edge cases:
 * - `phase-37-remaining-work-enhancement.feature` → `remaining-work-enhancement.feature`
 * - `phase-02b-enhanced-dogfooding.feature` → `enhanced-dogfooding.feature`
 * - `phase-03-watch-mode.feature` → `watch-mode.feature`
 *
 * @param timelineFilePath - Relative path to timeline feature file
 * @returns Inferred behavior file path, or undefined if not a timeline file
 */
export declare function inferBehaviorFilePath(timelineFilePath: string): string | undefined;
/**
 * Extract patterns from scanned Gherkin feature files (async variant)
 *
 * This is the async version of `extractPatternsFromGherkin` that performs
 * file existence checks asynchronously in parallel, avoiding event loop blocking.
 *
 * Use this variant when processing many feature files or when running on
 * systems with slow disk I/O.
 *
 * @param scannedFiles - Array of scanned Gherkin files
 * @param config - Extractor configuration (requires baseDir for relative paths)
 * @returns Promise resolving to extracted patterns and validation errors
 *
 * @example
 * ```typescript
 * const scanResult = await scanGherkinFiles({
 *   patterns: 'tests/features/roadmap/**\/*.feature'
 * });
 *
 * if (scanResult.ok) {
 *   const { patterns, errors } = await extractPatternsFromGherkinAsync(
 *     scanResult.value.files,
 *     { baseDir: process.cwd() }
 *   );
 * }
 * ```
 */
export declare function extractPatternsFromGherkinAsync(scannedFiles: readonly ScannedGherkinFile[], config: GherkinExtractorConfig): Promise<GherkinExtractionResult>;
/**
 * Compute children arrays from parent references
 *
 * Post-processing step that populates the `children` field on each pattern
 * by finding all patterns that reference it via their `parent` field.
 *
 * This enables bidirectional hierarchy navigation:
 * - Child → Parent: via `parent` field (explicit in feature file)
 * - Parent → Children: via `children` field (computed here)
 *
 * **Performance Note:** This function does NOT re-validate patterns through
 * the schema because:
 * 1. Input patterns have already been validated by extractPatternsFromGherkin()
 * 2. We're only adding a `children: string[]` field which matches the schema
 * 3. Re-validation of the complex ExtractedPatternSchema is expensive (~320 lines)
 *
 * This invariant is safe because:
 * - The children array is derived from validated pattern names
 * - ExtractedPatternSchema.children is defined as `z.array(z.string()).readonly().optional()`
 *
 * @param patterns - Array of validated ExtractedPattern objects
 * @returns New array with `children` populated (does not mutate input)
 *
 * @example
 * ```typescript
 * const rawPatterns = extractPatternsFromGherkin(files, config);
 * const patternsWithHierarchy = computeHierarchyChildren(rawPatterns);
 *
 * // Now epic patterns have children arrays
 * const epic = patternsWithHierarchy.find(p => p.level === 'epic');
 * console.log(epic.children); // ["PhaseA", "PhaseB"]
 * ```
 */
export declare function computeHierarchyChildren(patterns: readonly ExtractedPattern[]): ExtractedPattern[];
//# sourceMappingURL=gherkin-extractor.d.ts.map