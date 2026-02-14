/**
 * @libar-docs
 * @libar-docs-core @libar-docs-extractor
 * @libar-docs-pattern Document Extractor
 * @libar-docs-status completed
 * @libar-docs-arch-role service
 * @libar-docs-arch-context extractor
 * @libar-docs-arch-layer application
 * @libar-docs-include pipeline-stages
 * @libar-docs-uses Pattern Scanner, Tag Registry, Zod
 * @libar-docs-used-by Orchestrator, Generators
 * @libar-docs-usecase "When converting scanned files to ExtractedPattern objects"
 * @libar-docs-usecase "When inferring pattern names and categories from exports"
 *
 * ## Document Extractor - Pattern Extraction and Metadata Generation
 *
 * Converts scanned file data into complete ExtractedPattern objects with
 * unique IDs, inferred names, categories, and timestamps. Second stage of
 * the pipeline: Scanner → **Extractor** → Generator.
 *
 * ### When to Use
 *
 * - Transforming directives to structured patterns
 * - Inferring metadata from tags and exports
 * - Validating pattern structure against schemas
 *
 * ### Key Concepts
 *
 * - **Category Inference**: Uses tag registry priorities to determine primary category
 * - **Name Inference**: Extracts from exports or JSDoc title when not explicit
 * - **Deterministic IDs**: MD5 hash of file path + line number ensures stable identifiers
 */
import type { ScannedFile } from '../scanner/index.js';
import type { ExtractedPattern, DocDirective, ExportInfo, PatternValidationError } from '../types/index.js';
import { Result } from '../types/index.js';
import { type TagRegistry } from '../validation-schemas/index.js';
/**
 * Results of pattern extraction with error collection
 */
export interface ExtractionResults {
    /** Successfully extracted patterns */
    readonly patterns: readonly ExtractedPattern[];
    /** Patterns that failed validation */
    readonly errors: readonly PatternValidationError[];
}
/**
 * Convert scanned files to extracted patterns
 *
 * **Result Pattern**: Collects both successful extractions AND validation errors,
 * enabling partial success scenarios.
 *
 * @param scannedFiles - Files scanned for directives
 * @param baseDir - Base directory for relative path calculation
 * @param registry - Tag registry for category inference and aggregation tags (optional, defaults to generic registry)
 * @returns Extraction results with patterns and errors
 *
 * @example
 * ```typescript
 * import { scanPatterns } from '@libar-dev/code-first-docs/scanner';
 * import { extractPatterns } from '@libar-dev/code-first-docs/extractor';
 *
 * const scanResult = await scanPatterns(config);
 * if (scanResult.ok) {
 *   const extraction = extractPatterns(scanResult.value.files, '/path/to/project');
 *   console.log(`Extracted ${extraction.patterns.length} patterns`);
 *   console.log(`Failed ${extraction.errors.length} validations`);
 * }
 * ```
 */
export declare function extractPatterns(scannedFiles: readonly ScannedFile[], baseDir: string, registry?: TagRegistry): ExtractionResults;
/**
 * Build a complete ExtractedPattern from components
 *
 * **Schema-First Enforcement**: Validates constructed pattern against schema
 * to ensure data integrity at the boundary.
 *
 * @param directive - Parsed JSDoc directive
 * @param code - Extracted code snippet
 * @param exports - Exported symbols from code block
 * @param filePath - Absolute file path
 * @param baseDir - Base directory for relative path calculation
 * @param registry - Tag registry for category inference
 * @returns Result containing validated pattern or validation error
 *
 * @example
 * ```typescript
 * const result = buildPattern(
 *   directive,
 *   codeSnippet,
 *   exports,
 *   '/project/src/utils.ts',
 *   '/project',
 *   tagRegistry
 * );
 *
 * if (result.ok) {
 *   console.log(result.value.id);        // 'pattern-a1b2c3d4'
 *   console.log(result.value.source.file); // 'src/utils.ts'
 * }
 * ```
 */
export declare function buildPattern(directive: DocDirective, code: string, exports: readonly ExportInfo[], filePath: string, baseDir: string, registry: TagRegistry): Result<ExtractedPattern, PatternValidationError>;
/**
 * Infer pattern name from directive or exports
 *
 * Uses fallback chain:
 * 1. Explicit pattern tag value (highest priority)
 * 2. First line of description (if not a tag)
 * 3. First export name
 * 4. Generated from primary tag
 *
 * @param directive - Parsed JSDoc directive
 * @param exports - Exported symbols from code block
 * @param registry - Tag registry for prefix-aware tag stripping
 * @returns Inferred pattern name
 *
 * @example
 * ```typescript
 * // From explicit pattern tag (highest priority)
 * const name0 = inferPatternName(
 *   { patternName: 'Decider Pattern', description: 'Some description', tags: [...] },
 *   [],
 *   registry
 * );
 * console.log(name0); // 'Decider Pattern'
 *
 * // From description
 * const name1 = inferPatternName(
 *   { description: 'User Authentication\n...', tags: [...] },
 *   [],
 *   registry
 * );
 * console.log(name1); // 'User Authentication'
 *
 * // From export
 * const name2 = inferPatternName(
 *   { description: '@docs-core', tags: [...] },
 *   [{ name: 'createUser', type: 'function' }],
 *   registry
 * );
 * console.log(name2); // 'createUser'
 *
 * // From tag
 * const name3 = inferPatternName(
 *   { description: '', tags: ['@docs-domain-auth'] },
 *   [],
 *   registry
 * );
 * console.log(name3); // 'domain-pattern'
 * ```
 */
export declare function inferPatternName(directive: DocDirective, exports: readonly ExportInfo[], registry: TagRegistry): string;
/**
 * Infer category from @libar-docs-* tags using priority system
 *
 * Categories are selected based on priority order:
 * domain > arch > infra > validation > testing > performance > security > core
 *
 * @param tags - Array of @libar-docs-* tags
 * @returns Inferred category string
 *
 * @example
 * ```typescript
 * // Priority-based selection
 * const cat1 = inferCategory([
 *   '@libar-docs-core',
 *   '@libar-docs-domain-auth'
 * ]);
 * console.log(cat1); // 'domain' (higher priority than 'core')
 *
 * // From first tag
 * const cat2 = inferCategory(['@libar-docs-validation-zod']);
 * console.log(cat2); // 'validation'
 *
 * // No tags
 * const cat3 = inferCategory([]);
 * console.log(cat3); // 'uncategorized'
 * ```
 */
export declare function inferCategory(tags: readonly string[], registry: TagRegistry): string;
/**
 * Check if directive has specific aggregation tag
 *
 * Generic helper for checking any aggregation tag. Replaces individual
 * hasOverviewTag/hasDecisionTag/hasIntroTag helpers with a unified approach.
 *
 * @param tags - Directive tags to check
 * @param aggregationTagName - Name of aggregation tag (e.g., "overview", "decision", "intro")
 * @param registry - Tag registry
 * @returns True if directive has the specified aggregation tag
 *
 * @example
 * ```typescript
 * hasAggregationTag(['@libar-docs-core', '@libar-docs-overview'], "overview", registry); // true
 * hasAggregationTag(['@libar-docs-core'], "overview", registry); // false
 * hasAggregationTag(['@libar-docs-arch', '@libar-docs-decision'], "decision", registry); // true
 * ```
 */
export declare function hasAggregationTag(tags: readonly string[], aggregationTagName: string, registry: TagRegistry): boolean;
/**
 * Result of extracting aggregation tags from pattern tags
 */
export interface AggregationTags {
    /** True if pattern should appear in OVERVIEW.md */
    readonly overview: boolean;
    /** True if pattern should appear in DECISIONS.md */
    readonly decision: boolean;
    /** True if pattern is a package introduction */
    readonly intro: boolean;
}
/**
 * Extract aggregation tags from pattern tags
 *
 * Identifies which aggregated documents a pattern should appear in.
 * Patterns can appear in multiple documents if they have multiple aggregation tags.
 *
 * @param tags - Array of @libar-docs-* tags
 * @param registry - Tag registry for aggregation tag lookup
 * @returns Object indicating which aggregated docs to include pattern in
 *
 * @example
 * ```typescript
 * // Pattern with both overview and decision tags
 * getAggregationTags(['@libar-docs-overview', '@libar-docs-decision'], registry);
 * // { overview: true, decision: true, intro: false }
 *
 * // Pattern with only core tag (no aggregation)
 * getAggregationTags(['@libar-docs-core'], registry);
 * // { overview: false, decision: false, intro: false }
 * ```
 */
export declare function getAggregationTags(tags: readonly string[], registry: TagRegistry): AggregationTags;
//# sourceMappingURL=doc-extractor.d.ts.map