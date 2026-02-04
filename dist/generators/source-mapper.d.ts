/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern SourceMapper
 * @libar-docs-status completed
 * @libar-docs-phase 27
 * @libar-docs-depends-on DecisionDocCodec,ShapeExtractor,GherkinASTParser
 *
 * ## Source Mapper - Multi-Source Content Aggregation
 *
 * Aggregates content from multiple source files based on source mapping tables
 * parsed from decision documents. Dispatches extraction to appropriate handlers
 * based on extraction method (shape extraction, rule blocks, JSDoc, etc.).
 *
 * ### When to Use
 *
 * - When generating documentation from a decision document's source mapping
 * - When aggregating content from TypeScript, Gherkin, and decision sources
 * - When building docs with progressive disclosure (compact vs detailed)
 *
 * ### Key Concepts
 *
 * - **Source Mapping Table**: Defines sections, source files, and extraction methods
 * - **Self-Reference**: `THIS DECISION` markers extract from current document
 * - **Graceful Degradation**: Missing files produce warnings, not failures
 * - **Order Preservation**: Aggregated content maintains mapping table order
 */
import type { Result } from '../types/result.js';
import { type SourceMappingEntry, type DecisionDocContent, type ExtractedDocString } from '../renderable/codecs/decision-doc.js';
import type { ExtractedShape } from '../validation-schemas/extracted-shape.js';
/**
 * Options for source mapping execution
 */
export interface SourceMapperOptions {
    /** Base directory for resolving relative paths */
    baseDir: string;
    /** Current decision document path (for self-references) */
    decisionDocPath: string;
    /** Parsed decision document content (for self-reference extraction) */
    decisionContent: DecisionDocContent;
    /** Detail level affects what content is included */
    detailLevel?: 'summary' | 'standard' | 'detailed';
}
/**
 * Warning produced during extraction
 */
export interface ExtractionWarning {
    /** Warning severity */
    severity: 'warning' | 'info';
    /** Warning message */
    message: string;
    /** Source mapping entry that produced the warning */
    sourceMapping: SourceMappingEntry;
}
/**
 * Single extracted section from a source
 */
export interface ExtractedSection {
    /** Target section name from mapping */
    section: string;
    /** Source file path or self-reference marker */
    sourceFile: string;
    /** Extraction method used */
    extractionMethod: string;
    /** Extracted content (markdown) */
    content: string;
    /** Extracted shapes (if applicable) */
    shapes?: ExtractedShape[];
    /** Extracted DocStrings (if applicable) */
    docStrings?: ExtractedDocString[];
}
/**
 * Result of source mapping execution
 */
export interface AggregatedContent {
    /** Extracted sections in mapping order */
    sections: ExtractedSection[];
    /** Warnings produced during extraction */
    warnings: ExtractionWarning[];
    /** Overall success (true if at least one section extracted) */
    success: boolean;
}
/**
 * Extract content from THIS DECISION (the current decision document)
 */
export declare function extractFromDecision(options: SourceMapperOptions, sourceMapping: SourceMappingEntry): Result<ExtractedSection>;
/**
 * Extract shapes from a TypeScript file using @extract-shapes
 */
export declare function extractFromTypeScript(filePath: string, options: SourceMapperOptions, sourceMapping: SourceMappingEntry): Result<ExtractedSection>;
/**
 * Extract Rule blocks or Scenario Outline Examples from a behavior spec
 */
export declare function extractFromBehaviorSpec(filePath: string, options: SourceMapperOptions, sourceMapping: SourceMappingEntry): Result<ExtractedSection>;
/**
 * Execute source mapping to aggregate content from multiple sources
 *
 * Takes source mapping entries from a decision document and extracts content
 * from each referenced source file. Handles self-references (THIS DECISION),
 * TypeScript files (@extract-shapes, JSDoc), and behavior specs (Rule blocks,
 * Scenario Outline Examples).
 *
 * @param sourceMappings - Source mapping entries from decision document
 * @param options - Mapper options including base directory and decision content
 * @returns Aggregated content with sections in mapping order
 *
 * @example
 * ```typescript
 * const result = executeSourceMapping(decisionContent.sourceMappings, {
 *   baseDir: process.cwd(),
 *   decisionDocPath: 'specs/my-decision.feature',
 *   decisionContent: decisionContent,
 *   detailLevel: 'detailed',
 * });
 *
 * if (result.success) {
 *   for (const section of result.sections) {
 *     console.log(`## ${section.section}\n${section.content}`);
 *   }
 * }
 * ```
 */
export declare function executeSourceMapping(sourceMappings: readonly SourceMappingEntry[], options: SourceMapperOptions): AggregatedContent;
/**
 * Validate source mappings before execution
 *
 * Checks all referenced files exist and extraction methods are valid.
 * Does not perform actual extraction.
 *
 * @param sourceMappings - Source mapping entries to validate
 * @param options - Mapper options (only baseDir is required)
 * @returns Array of validation warnings
 */
export declare function validateSourceMappings(sourceMappings: readonly SourceMappingEntry[], options: Pick<SourceMapperOptions, 'baseDir'>): ExtractionWarning[];
//# sourceMappingURL=source-mapper.d.ts.map