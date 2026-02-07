/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern RichContentHelpers
 * @libar-docs-status completed
 *
 * ## Rich Content Rendering Helpers
 *
 * Shared helper functions for rendering Gherkin rich content in document codecs.
 * Provides granular and composite helpers for DataTables, DocStrings, steps,
 * scenarios, and business rules.
 *
 * ### When to Use
 *
 * - When building custom codecs that need to render Gherkin content
 * - When transforming DataTables, DocStrings, or scenarios into markdown
 * - When implementing acceptance criteria or business rules sections
 *
 * ### Usage Pattern
 *
 * ```typescript
 * import { renderAcceptanceCriteria, renderBusinessRulesSection } from "./helpers.js";
 *
 * // Composite helpers (most common use)
 * sections.push(...renderAcceptanceCriteria(pattern.scenarios));
 * sections.push(...renderBusinessRulesSection(pattern.rules));
 *
 * // Granular helpers (for custom rendering)
 * const tableBlock = renderDataTable(step.dataTable);
 * const codeBlock = renderDocString(step.docString, "markdown");
 * ```
 */
import type { ScenarioDataTable, ScenarioStep, ScenarioRef } from '../../validation-schemas/scenario-ref.js';
import type { BusinessRule } from '../../validation-schemas/extracted-pattern.js';
import type { ExtractedShape, PropertyDoc } from '../../validation-schemas/extracted-shape.js';
import { type SectionBlock } from '../schema.js';
import type { WarningCollector } from '../../generators/warning-collector.js';
export type { BusinessRule };
/**
 * Result of partitioning business rules by ADR-style prefixes.
 */
export interface PartitionedRules {
    /** Rules with names starting with "Context" */
    context: BusinessRule[];
    /** Rules with names starting with "Decision" */
    decision: BusinessRule[];
    /** Rules with names starting with "Consequence" */
    consequences: BusinessRule[];
    /** Rules that don't match any expected prefix */
    other: BusinessRule[];
}
/**
 * Options for partitioning business rules.
 */
export interface PartitionRulesOptions {
    /**
     * Warn about rules that don't match expected prefixes (default: false).
     * When true, emits a warning for non-matching rules via onWarning callback.
     * ADR codec sets this to true; Decision Doc codec keeps false.
     */
    warnOnOther?: boolean;
    /** Pattern name for warning context (optional) */
    patternName?: string;
    /**
     * Callback for warnings (default: console.warn).
     * Allows programmatic capture of warnings for testing or custom handling.
     */
    onWarning?: (message: string) => void;
}
/**
 * Partition business rules by ADR-style name prefixes.
 *
 * Rules are categorized based on their name prefix:
 * - "Context..." → context section
 * - "Decision..." → decision section
 * - "Consequence..." → consequences section
 * - Others → other (optionally logged as warning)
 *
 * This is a shared helper used by both ADR and Decision Doc codecs.
 *
 * @param rules - Business rules from the extracted pattern
 * @param options - Partitioning options
 * @returns Partitioned rules by category
 *
 * @example
 * ```typescript
 * // ADR codec (warn about unmatched rules)
 * const partitioned = partitionRulesByPrefix(pattern.rules, {
 *   warnOnOther: true,
 *   patternName: pattern.name
 * });
 *
 * // Decision doc codec (no warning)
 * const partitioned = partitionRulesByPrefix(pattern.rules);
 * ```
 */
export declare function partitionRulesByPrefix(rules: readonly BusinessRule[] | undefined, options?: PartitionRulesOptions): PartitionedRules;
/**
 * Warning information emitted during rich content rendering
 */
export interface RichContentWarning {
    /** Warning code for programmatic handling */
    code: 'unclosed-docstring' | 'invalid-content';
    /** Human-readable warning message */
    message: string;
    /** Additional context about the warning */
    context?: string;
}
/**
 * Configuration options for rich content rendering
 */
export interface RichContentOptions {
    /** Include Given/When/Then steps (default: true) */
    includeSteps?: boolean;
    /** Include DataTables from steps (default: true) */
    includeDataTables?: boolean;
    /** Include DocStrings from steps (default: true) */
    includeDocStrings?: boolean;
    /** Include business rules section (default: true) */
    includeRules?: boolean;
    /** Default language for DocString code blocks (default: "markdown") */
    docStringLanguage?: string;
    /**
     * Base heading level for section headers (default: 4)
     *
     * Used by renderAcceptanceCriteria and renderBusinessRulesSection to set
     * the heading level for "Acceptance Criteria" and "Business Rules" sections.
     * Callers can override to maintain proper document hierarchy.
     *
     * - H2: Use when rendering as top-level section in detail documents
     * - H3: Use when rendering under a parent H2 section
     * - H4: Use when deeply nested (default for backward compatibility)
     */
    baseHeadingLevel?: 2 | 3 | 4;
    /**
     * Optional callback invoked when warnings are detected during rendering.
     *
     * If not provided or undefined, warnings are logged to stderr via console.warn.
     * Provide this callback to capture warnings programmatically or suppress them.
     */
    onWarning?: ((warning: RichContentWarning) => void) | undefined;
    /**
     * Optional WarningCollector for structured warning capture.
     *
     * When provided, warnings are captured using the collector for aggregation
     * and structured reporting. Takes precedence over `onWarning` callback.
     * Use this for CI/CD pipelines that need machine-readable warning output.
     */
    warningCollector?: WarningCollector | undefined;
}
/**
 * Default options type - all fields are required values from RichContentOptions.
 * Since RichContentOptions.onWarning explicitly allows undefined in its type definition,
 * Required<RichContentOptions> correctly allows undefined for onWarning.
 */
export type ResolvedRichContentOptions = Required<RichContentOptions>;
/**
 * Default rich content options
 *
 * Note: onWarning and warningCollector are intentionally undefined by default.
 * When undefined, warnings fall back to console.warn via emitWarning().
 */
export declare const DEFAULT_RICH_CONTENT_OPTIONS: ResolvedRichContentOptions;
/**
 * Merge user options with defaults
 */
export declare function mergeRichContentOptions(options?: RichContentOptions): ResolvedRichContentOptions;
/**
 * Structured warning format for CI parsing.
 *
 * Format: `::warning file={file},code={code}::{message}`
 *
 * This format is compatible with GitHub Actions and other CI systems
 * that support structured annotations.
 */
export interface StructuredWarning {
    /** Warning code for categorization */
    code: string;
    /** Human-readable message */
    message: string;
    /** Source file (if available) */
    file?: string;
    /** Line number (if available) */
    line?: number;
}
/**
 * Format a warning for CI output (GitHub Actions compatible).
 *
 * @param warning - The warning to format
 * @returns Formatted string for CI log parsing
 */
export declare function formatWarningForCI(warning: StructuredWarning): string;
/**
 * Render a Gherkin DataTable as a markdown table block
 *
 * @param dt - The DataTable to render
 * @returns A table SectionBlock
 *
 * @example
 * ```typescript
 * const tableBlock = renderDataTable(step.dataTable);
 * sections.push(tableBlock);
 * ```
 */
export declare function renderDataTable(dt: ScenarioDataTable): SectionBlock;
/**
 * Render a DocString as a code block
 *
 * Accepts either a plain string (legacy format) or an object with content and optional mediaType.
 * When mediaType is provided in the object, it takes precedence over the language parameter.
 *
 * @param docString - The DocString content (string or object with content/mediaType)
 * @param language - Optional language hint fallback (default: "markdown")
 * @returns A code SectionBlock
 *
 * @example
 * ```typescript
 * // With plain string (legacy)
 * const codeBlock = renderDocString(step.docString, "json");
 *
 * // With object containing mediaType
 * const codeBlock = renderDocString({ content: "code", mediaType: "typescript" });
 * ```
 */
export declare function renderDocString(docString: string | {
    content: string;
    mediaType?: string | undefined;
}, language?: string): SectionBlock;
/**
 * Render scenario steps as a list
 *
 * @param steps - The scenario steps
 * @returns A list SectionBlock
 *
 * @example
 * ```typescript
 * const stepsList = renderStepsList(scenario.steps);
 * sections.push(stepsList);
 * ```
 */
export declare function renderStepsList(steps: readonly ScenarioStep[]): SectionBlock;
/**
 * Remove common leading indentation from all lines in a code block.
 *
 * When DocStrings are embedded in Gherkin files, they often have consistent
 * indentation to align with the surrounding scenario structure. This function
 * normalizes that indentation by:
 * 1. Normalizing tabs to spaces (default: 2 spaces per tab)
 * 2. Finding the minimum indentation across all non-empty lines
 * 3. Removing that common indentation from every line
 * 4. Trimming trailing whitespace from each line
 *
 * @param text - The code block content to dedent
 * @param tabWidth - Number of spaces per tab (default: 2)
 * @returns The dedented text with normalized indentation
 *
 * @example
 * ```typescript
 * // Input (indented to match Gherkin formatting):
 * dedent("    const x = 1;\n    const y = 2;")
 * // Returns: "const x = 1;\nconst y = 2;"
 *
 * // Mixed indentation (preserves relative indentation):
 * dedent("    function foo() {\n      return 42;\n    }")
 * // Returns: "function foo() {\n  return 42;\n}"
 *
 * // Tab-indented code (tabs normalized to spaces):
 * dedent("\t\tconst x = 1;")
 * // Returns: "const x = 1;"
 * ```
 */
export declare function dedent(text: string, tabWidth?: number): string;
/**
 * Parse description text for embedded DocStrings and convert to mixed content
 *
 * DocStrings in Gherkin are identified by: """language\n...\n"""
 * Text between DocStrings renders as paragraphs, DocStrings render as code blocks.
 *
 * **Defensive handling:**
 * - Normalizes Windows line endings (CRLF → LF) before parsing
 * - Detects unclosed DocStrings (odd count of """) and returns plain paragraph fallback
 * - Handles empty input gracefully
 * - Dedents code block content to normalize indentation from Gherkin formatting
 *
 * @param description - The description text that may contain DocStrings
 * @param options - Optional rendering options (used for warning callback)
 * @returns Array of SectionBlocks (paragraphs and code blocks)
 *
 * @example
 * ```typescript
 * // Input with DocString:
 * // "Some text\n\"\"\"typescript\nconst x = 1;\n\"\"\"\nMore text"
 * // Output: [paragraph("Some text"), code("const x = 1;", "typescript"), paragraph("More text")]
 * ```
 */
export declare function parseDescriptionWithDocStrings(description: string, options?: RichContentOptions): SectionBlock[];
/**
 * Protect backtick-quoted content from regex matching by replacing with placeholders.
 *
 * This is essential when parsing markdown-style content where `**bold**` patterns
 * might appear inside inline code (e.g., `` `**Verified by:**` ``). Without protection,
 * regexes that look for `**` boundaries will incorrectly match inside backticks.
 *
 * @param text - The text to process
 * @returns Object with processed text and restore function
 *
 * @example
 * ```typescript
 * const { processed, restore } = protectBacktickContent("Text `**inside**` more");
 * // processed = "Text __BT0__ more"
 * const result = "Extracted: __BT0__";
 * restore(result); // "Extracted: `**inside**`"
 * ```
 */
export declare function protectBacktickContent(text: string): {
    processed: string;
    restore: (s: string) => string;
};
/**
 * Parsed annotations from a business rule description.
 *
 * Business rules in feature files can include structured annotations:
 * - `**Invariant:**` - What must always be true (business constraint)
 * - `**Rationale:**` - Why this rule exists (business justification)
 * - `**Verified by:**` - Comma-separated list of verifying scenario names
 * - `**API:** See \`path\`` - Reference to implementation file/stub
 */
export interface BusinessRuleAnnotations {
    /** The business constraint that must always be true */
    invariant?: string;
    /** Business justification for why this rule exists */
    rationale?: string;
    /** List of scenario names that verify this rule */
    verifiedBy?: string[];
    /** Code examples extracted from DocStrings in the description */
    codeExamples?: SectionBlock[];
    /** API implementation references extracted from **API:** See `path` patterns */
    apiRefs?: readonly string[];
    /** Remaining description content after annotation extraction */
    remainingContent?: string;
}
/**
 * Truncate text to a maximum length, adding ellipsis if truncated.
 *
 * Attempts to truncate at word boundaries for cleaner output.
 * If the text is already shorter than maxLength, returns it unchanged.
 *
 * @param text - The text to truncate
 * @param maxLength - Maximum length (0 or negative = no limit)
 * @returns Truncated text with "..." suffix if truncated
 *
 * @example
 * ```typescript
 * truncateText("This is a long description", 15);
 * // Returns: "This is a..."
 *
 * truncateText("Short", 100);
 * // Returns: "Short"
 * ```
 */
export declare function truncateText(text: string, maxLength: number): string;
export { extractFirstSentence } from '../../utils/string-utils.js';
/**
 * Parse structured annotations from a business rule description.
 *
 * Extracts:
 * - `**Invariant:** <text>` - until next `**` annotation or end
 * - `**Rationale:** <text>` - until next `**` annotation or end
 * - `**Verified by:** <comma,separated,list>`
 * - DocStrings ("""language\n...\n""") as code blocks
 *
 * The remaining content after extraction is returned in `remainingContent`.
 *
 * @param description - The rule description text to parse
 * @returns Parsed annotations with structured fields
 *
 * @example
 * ```typescript
 * const annotations = parseBusinessRuleAnnotations(`
 *   **Invariant:** Only one reservation can exist for a given key.
 *
 *   **Rationale:** Prevents TOCTOU race conditions.
 *
 *   **Verified by:** Concurrent reservations, Expired cleanup
 * `);
 * // annotations.invariant === "Only one reservation can exist for a given key."
 * // annotations.rationale === "Prevents TOCTOU race conditions."
 * // annotations.verifiedBy === ["Concurrent reservations", "Expired cleanup"]
 * ```
 */
export declare function parseBusinessRuleAnnotations(description: string): BusinessRuleAnnotations;
/**
 * Strip markdown tables from text content.
 *
 * Tables are identified by lines starting and ending with | character.
 * This removes header rows, separator rows, and data rows to prevent
 * duplicate rendering when tables are extracted separately.
 *
 * @param text - Text that may contain markdown tables
 * @returns Text with tables removed and excess newlines cleaned up
 *
 * @example
 * ```typescript
 * const text = "Intro\n| Col | Col |\n| --- | --- |\n| A | B |\nOutro";
 * stripMarkdownTables(text); // "Intro\n\nOutro"
 * ```
 */
export declare function stripMarkdownTables(text: string): string;
/**
 * Render a single business rule with its description and verification info
 *
 * Parses the description for embedded DocStrings and renders them as code blocks.
 *
 * @param rule - The business rule to render
 * @returns Array of SectionBlocks for the rule
 *
 * @example
 * ```typescript
 * sections.push(...renderBusinessRule(rule));
 * ```
 */
export declare function renderBusinessRule(rule: BusinessRule): SectionBlock[];
/**
 * Render a scenario's content including steps, DataTables, and DocStrings
 *
 * @param scenario - The scenario to render
 * @param options - Rendering options
 * @returns Array of SectionBlocks for the scenario
 *
 * @example
 * ```typescript
 * for (const scenario of pattern.scenarios) {
 *   sections.push(...renderScenarioContent(scenario));
 * }
 * ```
 */
export declare function renderScenarioContent(scenario: ScenarioRef, options?: RichContentOptions): SectionBlock[];
/**
 * Render acceptance criteria from a list of scenarios
 *
 * Includes a "Acceptance Criteria" heading followed by all scenarios
 * with their steps, DataTables, and DocStrings.
 *
 * @param scenarios - The scenarios to render as acceptance criteria
 * @param options - Rendering options (including baseHeadingLevel for proper hierarchy)
 * @returns Array of SectionBlocks, empty if no scenarios
 *
 * @example
 * ```typescript
 * if (pattern.scenarios && pattern.scenarios.length > 0) {
 *   // Default H4 heading (backward compatible)
 *   sections.push(...renderAcceptanceCriteria(pattern.scenarios));
 *
 *   // H2 heading for top-level section in detail documents
 *   sections.push(...renderAcceptanceCriteria(pattern.scenarios, { baseHeadingLevel: 2 }));
 * }
 * ```
 */
export declare function renderAcceptanceCriteria(scenarios: readonly ScenarioRef[] | undefined, options?: RichContentOptions): SectionBlock[];
/**
 * Render a business rules section from a list of rules
 *
 * Includes a "Business Rules" heading followed by all rules
 * with their descriptions and verification info.
 *
 * @param rules - The business rules to render
 * @param options - Rendering options (including baseHeadingLevel for proper hierarchy)
 * @returns Array of SectionBlocks, empty if no rules
 *
 * @example
 * ```typescript
 * if (pattern.rules && pattern.rules.length > 0) {
 *   // Default H4 heading (backward compatible)
 *   sections.push(...renderBusinessRulesSection(pattern.rules));
 *
 *   // H2 heading for top-level section in detail documents
 *   sections.push(...renderBusinessRulesSection(pattern.rules, { baseHeadingLevel: 2 }));
 * }
 * ```
 */
export declare function renderBusinessRulesSection(rules: readonly BusinessRule[] | undefined, options?: RichContentOptions): SectionBlock[];
/**
 * Render all rich content for a pattern (scenarios + rules)
 *
 * Convenience function that combines acceptance criteria and business rules.
 *
 * @param pattern - Object with optional scenarios and rules arrays
 * @param options - Rendering options
 * @returns Array of SectionBlocks
 *
 * @example
 * ```typescript
 * sections.push(...renderPatternRichContent(pattern));
 * ```
 */
export declare function renderPatternRichContent(pattern: {
    scenarios?: readonly ScenarioRef[];
    rules?: readonly BusinessRule[];
}, options?: RichContentOptions): SectionBlock[];
/**
 * Options for rendering extracted shapes as markdown.
 */
export interface RenderShapesOptions {
    /** If true, combine all shapes into a single fenced code block (default: true) */
    groupInSingleBlock?: boolean;
    /** If true, include JSDoc comments with each shape (default: true) */
    includeJsDoc?: boolean;
}
/**
 * Render extracted TypeScript shapes as markdown code blocks.
 *
 * @param shapes - Shapes to render
 * @param options - Rendering options
 * @returns Markdown string with fenced code blocks
 */
export declare function renderShapesAsMarkdown(shapes: readonly ExtractedShape[], options?: RenderShapesOptions): string;
/**
 * Render property documentation as a markdown table.
 *
 * Generates a two-column table with property names and their JSDoc descriptions.
 * Returns empty string if no property docs exist.
 *
 * @param propertyDocs - Property documentation array from ExtractedShape
 * @returns Markdown table string, or empty string if no docs
 *
 * @example
 * ```typescript
 * const table = renderPropertyDocsTable(shape.propertyDocs);
 * if (table) {
 *   sections.push(md(table));
 * }
 * ```
 */
export declare function renderPropertyDocsTable(propertyDocs: readonly PropertyDoc[] | undefined): string;
//# sourceMappingURL=helpers.d.ts.map