/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern DecisionDocGenerator
 * @libar-docs-status completed
 * @libar-docs-phase 27
 * @libar-docs-arch-context generator
 * @libar-docs-arch-layer application
 * @libar-docs-depends-on DecisionDocCodec,SourceMapper
 *
 * ## Decision Doc Generator - Documentation from Decision Documents
 *
 * Orchestrates the full pipeline for generating documentation from decision
 * documents (ADR/PDR in .feature format):
 *
 * 1. Decision parsing - Extract source mappings, rules, DocStrings
 * 2. Source mapping - Aggregate content from TypeScript, Gherkin, decision sources
 * 3. Content assembly - Build RenderableDocument from aggregated sections
 * 4. Multi-level output - Generate compact (_claude-md/) and detailed (docs/) versions
 *
 * ### When to Use
 *
 * - When generating documentation from ADR/PDR decision documents
 * - When decision documents contain source mapping tables
 * - When building progressive disclosure docs at multiple detail levels
 *
 * ### Output Path Convention
 *
 * - Compact: `_claude-md/{section}/{module}.md` (~50 lines)
 * - Detailed: `docs/{PATTERN-NAME}.md` (~300 lines)
 */
import type { DocumentGenerator, GeneratorContext, GeneratorOutput, OutputFile } from '../types.js';
import type { ExtractedPattern } from '../../validation-schemas/index.js';
import type { DetailLevel } from '../../renderable/codecs/types/base.js';
import type { RenderableDocument } from '../../renderable/schema.js';
import { type DecisionDocContent } from '../../renderable/codecs/decision-doc.js';
import { type AggregatedContent } from '../source-mapper.js';
/**
 * Options for decision doc generation
 */
export interface DecisionDocGeneratorOptions {
    /** Base directory for resolving relative paths */
    baseDir: string;
    /** Detail level for output generation */
    detailLevel?: DetailLevel;
    /** Claude MD section name (e.g., "validation" for _claude-md/validation/) */
    claudeMdSection?: string;
    /** Enable pre-flight validation of source mappings (default: true) */
    enableValidation?: boolean;
    /** Enable content deduplication after extraction (default: true) */
    enableDeduplication?: boolean;
    /** Enable warning collection across pipeline stages (default: true) */
    enableWarningCollection?: boolean;
}
/**
 * Output paths for generated documentation
 */
export interface GeneratedOutputPaths {
    /** Path for compact output (e.g., _claude-md/validation/process-guard.md) */
    compact: string;
    /** Path for detailed output (e.g., docs/PROCESS-GUARD.md) */
    detailed: string;
}
/**
 * Result of decision doc generation
 */
export interface DecisionDocGeneratorResult {
    /** Successfully generated output files */
    files: OutputFile[];
    /** Warnings produced during generation */
    warnings: string[];
    /** Errors that prevented generation */
    errors: string[];
}
/**
 * Extract claude-md-section from pattern tags
 *
 * Looks for `@libar-docs-claude-md-section:VALUE` tag and extracts the value.
 * Returns undefined if tag not found.
 *
 * @param pattern - Extracted pattern with directive tags
 * @returns Section value (e.g., "validation") or undefined
 *
 * @example
 * ```typescript
 * // Pattern with @libar-docs-claude-md-section:validation tag
 * const section = extractClaudeMdSection(pattern);
 * // Returns: "validation"
 * ```
 */
export declare function extractClaudeMdSection(pattern: ExtractedPattern): string | undefined;
/**
 * Determine output paths from decision metadata
 *
 * Uses pattern name and optional section to compute paths:
 * - Compact: _claude-md/{section}/{module}.md
 * - Detailed: docs/{PATTERN-NAME}.md
 *
 * @param patternName - Pattern name from decision document
 * @param options - Generator options including section override
 * @returns Computed output paths
 *
 * @example
 * ```typescript
 * const paths = determineOutputPaths('ProcessGuard', { section: 'validation' });
 * // Returns:
 * // {
 * //   compact: '_claude-md/validation/process-guard.md',
 * //   detailed: 'docs/PROCESS-GUARD.md'
 * // }
 * ```
 */
export declare function determineOutputPaths(patternName: string, options?: {
    section?: string;
}): GeneratedOutputPaths;
/**
 * Generate compact/summary output (~50 lines)
 *
 * Includes only essential tables and type definitions.
 * Suitable for Claude MD context files.
 *
 * @param decisionContent - Parsed decision document
 * @param aggregatedContent - Content from source mapping execution
 * @returns RenderableDocument for compact output
 */
export declare function generateCompactOutput(decisionContent: DecisionDocContent, aggregatedContent: AggregatedContent): RenderableDocument;
/**
 * Generate detailed output (~300 lines)
 *
 * Includes everything: JSDoc, examples, full descriptions.
 * Suitable for docs/ directory.
 *
 * @param decisionContent - Parsed decision document
 * @param aggregatedContent - Content from source mapping execution
 * @returns RenderableDocument for detailed output
 */
export declare function generateDetailedOutput(decisionContent: DecisionDocContent, aggregatedContent: AggregatedContent): RenderableDocument;
/**
 * Generate standard output (~150 lines)
 *
 * Balance between compact and detailed: tables, types, key descriptions.
 * Suitable for general documentation.
 *
 * @param decisionContent - Parsed decision document
 * @param aggregatedContent - Content from source mapping execution
 * @returns RenderableDocument for standard output
 */
export declare function generateStandardOutput(decisionContent: DecisionDocContent, aggregatedContent: AggregatedContent): RenderableDocument;
/**
 * Generate documentation from a decision document
 *
 * Main entry point that orchestrates the full pipeline:
 * 1. Create WarningCollector for unified warning handling
 * 2. Parse decision document to extract content
 * 3. Validate source mappings (if enabled) - fails fast on validation errors
 * 4. Execute source mapping to aggregate content from referenced files
 * 5. Deduplicate sections (if enabled)
 * 6. Generate output at specified detail level(s)
 * 7. Return output files with all warnings
 *
 * @param pattern - Extracted pattern with decision document content
 * @param options - Generator options
 * @returns Generation result with files and warnings
 *
 * @example
 * ```typescript
 * const result = await generateFromDecision(processGuardPattern, {
 *   baseDir: process.cwd(),
 *   detailLevel: 'detailed',
 *   claudeMdSection: 'validation',
 * });
 *
 * for (const file of result.files) {
 *   fs.writeFileSync(file.path, file.content);
 * }
 * ```
 */
export declare function generateFromDecision(pattern: ExtractedPattern, options: DecisionDocGeneratorOptions): DecisionDocGeneratorResult;
/**
 * Generate both compact and detailed outputs
 *
 * Runs the pipeline once and generates documentation at both detail levels.
 * More efficient than calling generateFromDecision twice.
 *
 * @param pattern - Extracted pattern with decision document content
 * @param options - Generator options
 * @returns Generation result with both output files
 */
export declare function generateFromDecisionMultiLevel(pattern: ExtractedPattern, options: DecisionDocGeneratorOptions): DecisionDocGeneratorResult;
/**
 * Decision Doc Generator for registry integration
 *
 * Implements DocumentGenerator interface for use with the generator registry.
 * Filters patterns by type to find ADR/PDR decision documents with source mappings.
 */
export declare class DecisionDocGeneratorImpl implements DocumentGenerator {
    readonly name = "doc-from-decision";
    readonly description = "Generate documentation from ADR/PDR decision documents";
    generate(patterns: readonly ExtractedPattern[], context: GeneratorContext): Promise<GeneratorOutput>;
}
/**
 * Create decision doc generator instance
 */
export declare function createDecisionDocGenerator(): DocumentGenerator;
//# sourceMappingURL=decision-doc-generator.d.ts.map