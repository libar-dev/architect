/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern DecisionDocCodec
 * @libar-docs-status completed
 *
 * ## Decision Doc Codec
 *
 * Parses decision documents (ADR/PDR in .feature format) and extracts content
 * for documentation generation. Provides parsing utilities for source mapping
 * tables, self-reference markers, and rule block extraction.
 *
 * ### When to Use
 *
 * - When extracting content from decision documents for doc generation
 * - When parsing Rule: blocks for Context/Decision/Consequences sections
 * - When extracting DocStrings (fenced code blocks) with language tags
 * - When parsing source mapping tables from decision descriptions
 *
 * ### Source Mapping Table Format
 *
 * ```
 * | Section | Source File | Extraction Method |
 * | Intro & Context | THIS DECISION | Decision rule description |
 * | API Types | src/types.ts | @extract-shapes tag |
 * ```
 *
 * ### Self-Reference Markers
 *
 * - `THIS DECISION` - Extract from the current decision document
 * - `THIS DECISION (Rule: X)` - Extract specific Rule: block
 * - `THIS DECISION (DocString)` - Extract fenced code blocks
 */
import type { BusinessRule } from '../../validation-schemas/extracted-pattern.js';
import { type PartitionedRules } from './helpers.js';
import type { SectionBlock, CodeBlock } from '../schema.js';
/**
 * Entry in a source mapping table
 *
 * Defines how a documentation section is assembled from source files.
 */
export interface SourceMappingEntry {
    /** Target section heading in generated doc (e.g., "Intro & Context", "API Types") */
    section: string;
    /** Path to source file or self-reference marker (e.g., "src/types.ts", "THIS DECISION") */
    sourceFile: string;
    /** How to extract content from source (e.g., "@extract-shapes", "Rule blocks") */
    extractionMethod: string;
}
/**
 * Partitioned rules from a decision document.
 * Re-exported from helpers for convenience.
 */
export type PartitionedDecisionRules = PartitionedRules;
/**
 * Extracted DocString with language tag
 */
export interface ExtractedDocString {
    /** Language tag from the fenced code block (e.g., "typescript", "bash") */
    language: string;
    /** Content of the DocString */
    content: string;
}
/**
 * Result of parsing a self-reference marker
 *
 * Identifies whether the reference points to:
 * - The entire document (`document`)
 * - A specific Rule: block (`rule` with name)
 * - DocStrings in the document (`docstring`)
 */
export interface SelfReferenceResult {
    /** Type of self-reference */
    type: 'document' | 'rule' | 'docstring';
    /** Name of the rule block (only for type: 'rule') */
    name?: string;
}
/**
 * Parsed content from a decision document
 *
 * Contains all extracted content from ADR/PDR feature files including:
 * - Partitioned rules (Context/Decision/Consequences)
 * - DocStrings with language tags
 * - Source mapping entries
 */
export interface DecisionDocContent {
    /** Pattern name from the decision document */
    patternName: string;
    /** Feature description text (before any rules) */
    description: string;
    /** Partitioned rules by semantic category */
    rules: PartitionedDecisionRules;
    /** Extracted DocStrings with language tags */
    docStrings: ExtractedDocString[];
    /** Source mapping entries parsed from tables */
    sourceMappings: SourceMappingEntry[];
}
/**
 * Self-reference marker indicating content should be extracted from current document
 */
export declare const SELF_REFERENCE_MARKER = "THIS DECISION";
/**
 * Pattern for self-reference with specific Rule: block
 * Matches: "THIS DECISION (Rule: SomeName)"
 */
export declare const SELF_REFERENCE_RULE_PATTERN: RegExp;
/**
 * Pattern for self-reference to DocStrings
 * Matches: "THIS DECISION (DocString)"
 */
export declare const SELF_REFERENCE_DOCSTRING_PATTERN: RegExp;
/**
 * Partition decision rules by semantic prefix
 *
 * Wrapper around shared partitionRulesByPrefix that doesn't warn about "other" rules.
 * Decision docs may have additional rules like "Proof of Concept" or "Expected Output"
 * that are valid but don't fit the standard ADR sections.
 *
 * @param rules - Business rules from the extracted pattern
 * @param _patternName - Pattern name for context (unused, kept for API compatibility)
 * @returns Partitioned rules by category
 */
export declare function partitionDecisionRules(rules: readonly BusinessRule[] | undefined, _patternName?: string): PartitionedDecisionRules;
/**
 * Extract DocStrings (fenced code blocks) from text content
 *
 * Supports two formats:
 * - Gherkin DocStrings: """language\ncontent\n"""
 * - Markdown code fences: ```language\ncontent\n```
 *
 * @param text - Text content that may contain DocStrings
 * @returns Array of extracted DocStrings with language tags
 *
 * @example
 * ```typescript
 * const docStrings = extractDocStrings(`
 *   Some text...
 *
 *   """bash
 *   npm install
 *   """
 *
 *   More text...
 *
 *   """typescript
 *   const x = 1;
 *   """
 * `);
 * // Returns: [
 * //   { language: 'bash', content: 'npm install' },
 * //   { language: 'typescript', content: 'const x = 1;' }
 * // ]
 * ```
 */
export declare function extractDocStrings(text: string): ExtractedDocString[];
/**
 * Extract DocStrings from business rules
 *
 * Iterates through rule descriptions and extracts all embedded DocStrings.
 *
 * @param rules - Business rules to extract DocStrings from
 * @returns Array of extracted DocStrings with language tags
 */
export declare function extractDocStringsFromRules(rules: readonly BusinessRule[] | undefined): ExtractedDocString[];
/**
 * Parse a source mapping table from markdown text
 *
 * Expected format:
 * ```
 * | Section | Source File | Extraction Method |
 * | Intro & Context | THIS DECISION (Rule: Context above) | Decision rule description |
 * | API Types | src/types.ts | @extract-shapes tag |
 * ```
 *
 * The table must have headers: Section, Source File (or Source), Extraction Method (or Extraction)
 *
 * @param text - Text content that may contain a source mapping table
 * @returns Array of source mapping entries, empty if no table found
 *
 * @example
 * ```typescript
 * const mappings = parseSourceMappingTable(`
 *   **Source Mapping for Process Guard:**
 *
 *   | Section | Source File | Extraction Method |
 *   | Intro & Context | THIS DECISION | Decision rule description |
 *   | API Types | src/types.ts | @extract-shapes tag |
 * `);
 * // Returns: [
 * //   { section: 'Intro & Context', sourceFile: 'THIS DECISION', extractionMethod: 'Decision rule description' },
 * //   { section: 'API Types', sourceFile: 'src/types.ts', extractionMethod: '@extract-shapes tag' }
 * // ]
 * ```
 */
export declare function parseSourceMappingTable(text: string): SourceMappingEntry[];
/**
 * Parse source mapping tables from business rules
 *
 * Searches through rule descriptions for source mapping tables.
 *
 * @param rules - Business rules to search for source mapping tables
 * @returns Array of source mapping entries from all rules
 */
export declare function parseSourceMappingsFromRules(rules: readonly BusinessRule[] | undefined): SourceMappingEntry[];
/**
 * Check if a source file reference is a self-reference
 *
 * @param sourceFile - The source file path to check
 * @returns True if the reference is to the current decision document, false for null/undefined
 */
export declare function isSelfReference(sourceFile: string): boolean;
/**
 * Parse a self-reference to extract the referenced element
 *
 * @param sourceFile - The source file reference to parse
 * @returns Object with type and optional name, or null if not a self-reference
 *
 * @example
 * ```typescript
 * parseSelfReference('THIS DECISION');
 * // Returns: { type: 'document' }
 *
 * parseSelfReference('THIS DECISION (Rule: Context above)');
 * // Returns: { type: 'rule', name: 'Context above' }
 *
 * parseSelfReference('THIS DECISION (DocString)');
 * // Returns: { type: 'docstring' }
 *
 * parseSelfReference('src/types.ts');
 * // Returns: null
 * ```
 */
export declare function parseSelfReference(sourceFile: string): SelfReferenceResult | null;
/**
 * Find a specific rule by name (flexible matching)
 *
 * Matching strategy (in order):
 * 1. Exact match on full name
 * 2. Rule name contains search term
 * 3. Both start with the same word (e.g., "Context above" matches "Context - ...")
 *
 * @param rules - Rules to search
 * @param ruleName - Name to search for (case-insensitive)
 * @returns The matching rule or undefined
 */
export declare function findRuleByName(rules: readonly BusinessRule[] | undefined, ruleName: string): BusinessRule | undefined;
/**
 * Extract content from a rule's description
 *
 * Returns the description text with DocStrings parsed as code blocks.
 *
 * @param rule - The rule to extract content from
 * @returns Array of SectionBlocks representing the rule content
 */
export declare function extractRuleContent(rule: BusinessRule): SectionBlock[];
/**
 * Parse a complete decision document
 *
 * Extracts all relevant content from an ADR/PDR pattern including:
 * - Partitioned rules (Context/Decision/Consequences/Other)
 * - DocStrings with language tags
 * - Source mapping entries
 *
 * @param patternName - The pattern name
 * @param description - The feature description
 * @param rules - Business rules from the pattern
 * @returns Parsed decision document content
 *
 * @example
 * ```typescript
 * const content = parseDecisionDocument(
 *   'DocGenerationProofOfConcept',
 *   pattern.directive.description ?? '',
 *   pattern.rules
 * );
 * ```
 */
export declare function parseDecisionDocument(patternName: string, description: string, rules: readonly BusinessRule[] | undefined): DecisionDocContent;
/**
 * Known extraction methods and their descriptions
 */
export declare const EXTRACTION_METHODS: {
    readonly DECISION_RULE_DESCRIPTION: "Decision rule description";
    readonly EXTRACT_SHAPES: "@extract-shapes tag";
    readonly RULE_BLOCKS: "Rule blocks";
    readonly SCENARIO_OUTLINE_EXAMPLES: "Scenario Outline Examples";
    readonly JSDOC_SECTION: "JSDoc section";
    readonly CREATE_VIOLATION_PATTERNS: "createViolation() patterns";
    readonly FENCED_CODE_BLOCK: "Fenced code block";
};
/**
 * Normalize an extraction method string to a known type
 *
 * @param method - The extraction method string from the source mapping
 * @returns Normalized method key or 'unknown'
 */
export declare function normalizeExtractionMethod(method: string): keyof typeof EXTRACTION_METHODS | 'unknown';
/**
 * Convert ExtractedDocStrings to CodeBlock SectionBlocks
 *
 * @param docStrings - Extracted DocStrings
 * @returns Array of CodeBlock sections
 */
export declare function docStringsToCodeBlocks(docStrings: ExtractedDocString[]): CodeBlock[];
//# sourceMappingURL=decision-doc.d.ts.map