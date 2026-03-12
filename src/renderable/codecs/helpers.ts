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

import type {
  ScenarioDataTable,
  ScenarioStep,
  ScenarioRef,
} from '../../validation-schemas/scenario-ref.js';
import type { BusinessRule } from '../../validation-schemas/extracted-pattern.js';
import type { ExtractedShape, PropertyDoc } from '../../validation-schemas/extracted-shape.js';
import { type SectionBlock, table, code, list, paragraph, heading } from '../schema.js';
import { normalizeLineEndings } from '../../utils/string-utils.js';
import { extractTablesFromDescription } from './convention-extractor.js';
import type { WarningCollector } from '../../generators/warning-collector.js';

// Re-export BusinessRule for convenience (consumers can import from codecs/index.ts)
export type { BusinessRule };

// ═══════════════════════════════════════════════════════════════════════════
// Rule Partitioning (Shared by ADR and Decision Doc codecs)
// ═══════════════════════════════════════════════════════════════════════════

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
export function partitionRulesByPrefix(
  rules: readonly BusinessRule[] | undefined,
  options: PartitionRulesOptions = {}
): PartitionedRules {
  if (!rules || rules.length === 0) {
    return { context: [], decision: [], consequences: [], other: [] };
  }

  const { warnOnOther = false, patternName, onWarning = console.warn } = options;
  const context: BusinessRule[] = [];
  const decision: BusinessRule[] = [];
  const consequences: BusinessRule[] = [];
  const other: BusinessRule[] = [];

  for (const rule of rules) {
    const nameLower = rule.name.toLowerCase();
    if (nameLower.startsWith('context')) {
      context.push(rule);
    } else if (nameLower.startsWith('decision')) {
      decision.push(rule);
    } else if (nameLower.startsWith('consequence')) {
      consequences.push(rule);
    } else {
      other.push(rule);
    }
  }

  // Optionally warn about rules that don't match expected ADR prefixes
  if (warnOnOther && other.length > 0) {
    const otherNames = other.map((r) => `"${r.name}"`).join(', ');
    const patternContext = patternName ? ` in pattern "${patternName}"` : '';
    onWarning(
      `[codec] ${other.length} rule(s)${patternContext} not matching ADR prefixes (Context/Decision/Consequence): ${otherNames}. These rules will not be rendered in standard ADR sections.`
    );
  }

  return { context, decision, consequences, other };
}

// ═══════════════════════════════════════════════════════════════════════════
// Configuration Types
// ═══════════════════════════════════════════════════════════════════════════

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
export const DEFAULT_RICH_CONTENT_OPTIONS: ResolvedRichContentOptions = {
  includeSteps: true,
  includeDataTables: true,
  includeDocStrings: true,
  includeRules: true,
  docStringLanguage: 'markdown',
  baseHeadingLevel: 4,
  onWarning: undefined,
  warningCollector: undefined,
};

/**
 * Merge user options with defaults
 */
export function mergeRichContentOptions(options?: RichContentOptions): ResolvedRichContentOptions {
  if (!options) {
    return DEFAULT_RICH_CONTENT_OPTIONS;
  }
  return {
    ...DEFAULT_RICH_CONTENT_OPTIONS,
    ...options,
  };
}

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
export function formatWarningForCI(warning: StructuredWarning): string {
  const parts: string[] = [];
  if (warning.file) parts.push(`file=${warning.file}`);
  if (warning.line !== undefined) parts.push(`line=${warning.line}`);
  parts.push(`code=${warning.code}`);

  const attributes = parts.join(',');
  return `::warning ${attributes}::${warning.message}`;
}

/**
 * Emit a warning using the configured handler, collector, or console.warn fallback.
 *
 * Priority order:
 * 1. WarningCollector (if provided) - for structured aggregation
 * 2. onWarning callback (if provided) - for custom handling
 * 3. console.warn - default fallback
 *
 * @param warning - The warning to emit
 * @param options - Options containing warning handlers
 * @param source - Optional source file for collector context
 * @internal
 */
function emitWarning(
  warning: RichContentWarning,
  options?: RichContentOptions,
  source?: string
): void {
  // Priority 1: Use WarningCollector if available (structured aggregation)
  if (options?.warningCollector) {
    options.warningCollector.capture({
      source: source ?? 'rich-content-rendering',
      category: 'format',
      message: warning.message,
      subcategory: warning.code,
    });
    return;
  }

  // Priority 2: Use onWarning callback if available
  if (options?.onWarning) {
    options.onWarning(warning);
    return;
  }

  // Priority 3: Fall back to console.warn with structured format
  const contextSuffix = warning.context ? ` Context: ${warning.context}` : '';
  console.warn(`[${warning.code}] ${warning.message}${contextSuffix}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// Granular Helpers
// ═══════════════════════════════════════════════════════════════════════════

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
export function renderDataTable(dt: ScenarioDataTable): SectionBlock {
  const rows = dt.rows.map((row) => {
    return dt.headers.map((header) => row[header] ?? '');
  });
  return table(dt.headers as string[], rows);
}

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
export function renderDocString(
  docString: string | { content: string; mediaType?: string | undefined },
  language = 'markdown'
): SectionBlock {
  if (typeof docString === 'string') {
    // Legacy string format
    return code(docString, language);
  }
  // Object format with optional mediaType
  return code(docString.content, docString.mediaType ?? language);
}

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
export function renderStepsList(steps: readonly ScenarioStep[]): SectionBlock {
  const stepItems = steps.map((step) => `${step.keyword} ${step.text}`);
  return list(stepItems);
}

/**
 * Default tab width for tab-to-space normalization in dedent.
 */
const DEFAULT_TAB_WIDTH = 2;

/**
 * Normalize tabs to spaces for consistent indentation calculation.
 *
 * @param text - Text that may contain tabs
 * @param tabWidth - Number of spaces per tab (default: 2)
 * @returns Text with tabs replaced by spaces
 */
function normalizeTabs(text: string, tabWidth: number = DEFAULT_TAB_WIDTH): string {
  return text.replace(/\t/g, ' '.repeat(tabWidth));
}

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
export function dedent(text: string, tabWidth: number = DEFAULT_TAB_WIDTH): string {
  // Normalize tabs to spaces before processing
  const normalizedText = normalizeTabs(text, tabWidth);
  const lines = normalizedText.split('\n');

  // Find minimum indentation (ignoring empty lines)
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
  if (nonEmptyLines.length === 0) return text;

  const minIndent = Math.min(
    ...nonEmptyLines.map((line) => {
      const match = /^(\s*)/.exec(line);
      // The regex always matches (even empty string), but TypeScript needs reassurance
      return match?.[1]?.length ?? 0;
    })
  );

  // If no common indentation, just trim trailing whitespace
  if (minIndent === 0) {
    return lines.map((line) => line.trimEnd()).join('\n');
  }

  // Remove common indentation and trailing whitespace from each line
  return lines.map((line) => line.slice(minIndent).trimEnd()).join('\n');
}

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
export function parseDescriptionWithDocStrings(
  description: string,
  options?: RichContentOptions
): SectionBlock[] {
  // Handle empty input
  if (!description || description.trim().length === 0) {
    return [];
  }

  // Normalize line endings (Windows CRLF → LF)
  const normalized = normalizeLineEndings(description);

  // Detect unclosed DocStrings (odd number of """)
  // Important: Exclude """ that appears inside backticks (inline code examples)
  // e.g., `"""typescript` should not be counted as a delimiter
  const withoutInlineCode = normalized.replace(/`[^`]+`/g, '');
  const docStringDelimiters = withoutInlineCode.match(/"""/g);
  if (docStringDelimiters && docStringDelimiters.length % 2 !== 0) {
    // Unclosed DocString detected - return as plain paragraph to avoid corruption
    // This is a defensive fallback; the content may not render as intended
    emitWarning(
      {
        code: 'unclosed-docstring',
        message: 'Unclosed DocString detected (odd number of """ delimiters)',
        context: `Found ${docStringDelimiters.length} delimiters in description`,
      },
      options
    );
    return [paragraph(normalized.trim())];
  }

  const sections: SectionBlock[] = [];
  // Match """language\ncontent\n""" pattern (language is optional)
  const docStringPattern = /"""(\w*)\n([\s\S]*?)"""/g;
  let lastIndex = 0;
  let match;

  while ((match = docStringPattern.exec(normalized)) !== null) {
    // Text before this DocString
    const textBefore = normalized.slice(lastIndex, match.index).trim();
    if (textBefore) {
      sections.push(paragraph(textBefore));
    }

    // The DocString as a code block (empty string means no language hint)
    // Apply dedent to normalize indentation from Gherkin formatting
    const language = (match[1] ?? '').length > 0 ? match[1] : 'text';
    const rawContent = (match[2] ?? '').trim();
    const content = dedent(rawContent);
    sections.push(code(content, language));

    lastIndex = match.index + match[0].length;
  }

  // Text after last DocString (or entire text if no DocStrings)
  const textAfter = normalized.slice(lastIndex).trim();
  if (textAfter) {
    sections.push(paragraph(textAfter));
  }

  return sections;
}

// ═══════════════════════════════════════════════════════════════════════════
// Backtick Content Protection
// ═══════════════════════════════════════════════════════════════════════════

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
export function protectBacktickContent(text: string): {
  processed: string;
  restore: (s: string) => string;
} {
  const placeholders: string[] = [];
  // Use unique prefix to reduce collision risk with real content
  const processed = text.replace(/`[^`]+`/g, (match) => {
    placeholders.push(match);
    return `__LIBAR_BT_${placeholders.length - 1}__`;
  });
  const restore = (s: string): string =>
    s.replace(/__LIBAR_BT_(\d+)__/g, (_, i) => placeholders[Number(i)] ?? '');
  return { processed, restore };
}

// ═══════════════════════════════════════════════════════════════════════════
// Business Rule Annotation Parsing
// ═══════════════════════════════════════════════════════════════════════════

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
  /** Input type annotation for sequence diagram steps (from **Input:** marker) */
  input?: string;
  /** Output type annotation for sequence diagram steps (from **Output:** marker) */
  output?: string;
  /** Remaining description content after annotation extraction */
  remainingContent?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Text Utilities
// ═══════════════════════════════════════════════════════════════════════════

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
export function truncateText(text: string, maxLength: number): string {
  if (!text || maxLength <= 0 || text.length <= maxLength) {
    return text || '';
  }

  // Find the last space before maxLength to truncate at word boundary
  const truncateAt = maxLength - 3; // Reserve space for "..."
  const lastSpace = text.lastIndexOf(' ', truncateAt);

  // If no space found, truncate at exact position
  const cutPoint = lastSpace > 0 ? lastSpace : truncateAt;

  return text.slice(0, cutPoint).trim() + '...';
}

export { extractFirstSentenceRaw as extractFirstSentence } from '../../utils/string-utils.js';

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
export function parseBusinessRuleAnnotations(description: string): BusinessRuleAnnotations {
  if (!description || description.trim().length === 0) {
    return {};
  }

  // Normalize line endings
  const normalized = normalizeLineEndings(description);

  const result: BusinessRuleAnnotations = {};
  const codeExamples: SectionBlock[] = [];

  // Step 1: Extract code fences FIRST (before annotation parsing)
  // This prevents code fences from being captured inside annotations

  // Extract Gherkin DocStrings (""" format)
  const docStringPattern = /"""(\w*)\n([\s\S]*?)"""/g;
  let docMatch;
  while ((docMatch = docStringPattern.exec(normalized)) !== null) {
    const language = (docMatch[1] ?? '').length > 0 ? docMatch[1] : 'text';
    const content = (docMatch[2] ?? '').trim();
    if (content) {
      codeExamples.push(code(content, language));
    }
  }

  // Extract markdown code fences (``` format)
  const markdownCodePattern = /```(\w*)\n([\s\S]*?)```/g;
  let mdMatch;
  while ((mdMatch = markdownCodePattern.exec(normalized)) !== null) {
    const language = (mdMatch[1] ?? '').length > 0 ? mdMatch[1] : 'text';
    const content = (mdMatch[2] ?? '').trim();
    if (content) {
      codeExamples.push(code(content, language));
    }
  }

  if (codeExamples.length > 0) {
    result.codeExamples = codeExamples;
  }

  // Step 2: Remove code fences from text before parsing annotations
  // This ensures annotations don't accidentally capture code fence content
  let textWithoutCode = normalized;
  textWithoutCode = textWithoutCode.replace(/"""(\w*)\n[\s\S]*?"""/g, '');
  textWithoutCode = textWithoutCode.replace(/```(\w*)\n[\s\S]*?```/g, '');

  // Step 2a: Remove table lines (| ... |) from text before parsing annotations.
  // Tables are extracted separately by extractTablesFromDescription() upstream.
  // Without this, annotation regexes over-capture table content and whitespace
  // normalization collapses tables into single-line text inside invariant/rationale.
  // Note: stripMarkdownTables() also strips these downstream in remainingContent;
  // the early strip here prevents annotation regex over-capture before that point.
  textWithoutCode = textWithoutCode
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      return !(trimmed.startsWith('|') && trimmed.endsWith('|'));
    })
    .join('\n');

  // Step 2b: Protect backtick-quoted content from regex matching
  // This prevents `**Verified by:**` inside backticks from being treated as annotation boundary
  // e.g., "Scenario names in `**Verified by:**` are matched" should not truncate at `**V`
  const { processed: protectedText, restore } = protectBacktickContent(textWithoutCode);

  // Step 3: Extract annotations from protected text
  // Extract **Invariant:** - matches until next ** or end of string
  const invariantPattern = /\*\*Invariant:\*\*\s*([\s\S]*?)(?=\*\*[A-Z]|\*\*$|$)/i;
  const invariantMatch = invariantPattern.exec(protectedText);
  if (invariantMatch?.[1]) {
    const invariantText = invariantMatch[1].trim();
    // Clean up: remove trailing empty lines and normalize whitespace, then restore backticks
    result.invariant = restore(
      invariantText
        .replace(/\n\s*\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    );
  }

  // Extract **Rationale:** - matches until next ** or end of string
  const rationalePattern = /\*\*Rationale:\*\*\s*([\s\S]*?)(?=\*\*[A-Z]|\*\*$|$)/i;
  const rationaleMatch = rationalePattern.exec(protectedText);
  if (rationaleMatch?.[1]) {
    const rationaleText = rationaleMatch[1].trim();
    result.rationale = restore(
      rationaleText
        .replace(/\n\s*\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    );
  }

  // Extract **Verified by:** - parse as comma-separated list
  const verifiedByPattern = /\*\*Verified by:\*\*\s*([\s\S]*?)(?=\*\*[A-Z]|\*\*$|$)/i;
  const verifiedByMatch = verifiedByPattern.exec(protectedText);
  if (verifiedByMatch?.[1]) {
    const verifiedByText = verifiedByMatch[1].trim();
    // Split by comma and clean up each entry (restore backticks in each item)
    result.verifiedBy = verifiedByText
      .split(',')
      .map((s) => restore(s.trim()))
      .filter((s) => s.length > 0);
  }

  // Extract **API:** See `path` references (can appear multiple times)
  // Note: This pattern looks for content INSIDE backticks, so we use the original
  // textWithoutCode which still has backticks intact (only code fences removed)
  // Pattern is case-insensitive and allows optional bold markers:
  // - "**API:** See `path`" (standard bold)
  // - "API: See `path`" (plain text)
  // - "api: see `path`" (lowercase)
  const apiRefPattern = /(?:\*\*)?API:(?:\*\*)?\s*See\s*`([^`]+)`/gi;
  const apiRefs: string[] = [];
  let apiMatch;
  while ((apiMatch = apiRefPattern.exec(textWithoutCode)) !== null) {
    const path = apiMatch[1]?.trim();
    if (path && path.length > 0) {
      apiRefs.push(path);
    }
  }
  if (apiRefs.length > 0) {
    result.apiRefs = apiRefs;
  }

  // Extract **Input:** - sequence step input type annotation
  const inputPattern = /\*\*Input:\*\*\s*([\s\S]*?)(?=\*\*[A-Z]|\*\*$|$)/i;
  const inputMatch = inputPattern.exec(protectedText);
  if (inputMatch?.[1]) {
    const inputText = inputMatch[1].trim();
    result.input = restore(
      inputText
        .replace(/\n\s*\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    );
  }

  // Extract **Output:** - sequence step output type annotation
  const outputPattern = /\*\*Output:\*\*\s*([\s\S]*?)(?=\*\*[A-Z]|\*\*$|$)/i;
  const outputMatch = outputPattern.exec(protectedText);
  if (outputMatch?.[1]) {
    const outputText = outputMatch[1].trim();
    result.output = restore(
      outputText
        .replace(/\n\s*\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    );
  }

  // Step 4: Calculate remaining content (after removing annotations from protected text)
  // Use protectedText to ensure regexes don't stop at `**X` inside backticks
  let remaining = protectedText;

  // Remove **Invariant:** block
  remaining = remaining.replace(/\*\*Invariant:\*\*\s*[\s\S]*?(?=\*\*[A-Z]|\*\*$|$)/i, '');

  // Remove **Rationale:** block
  remaining = remaining.replace(/\*\*Rationale:\*\*\s*[\s\S]*?(?=\*\*[A-Z]|\*\*$|$)/i, '');

  // Remove **Verified by:** block
  remaining = remaining.replace(/\*\*Verified by:\*\*\s*[\s\S]*?(?=\*\*[A-Z]|\*\*$|$)/i, '');

  // Remove **Input:** block
  remaining = remaining.replace(/\*\*Input:\*\*\s*[\s\S]*?(?=\*\*[A-Z]|\*\*$|$)/i, '');

  // Remove **Output:** block
  remaining = remaining.replace(/\*\*Output:\*\*\s*[\s\S]*?(?=\*\*[A-Z]|\*\*$|$)/i, '');

  // Remove **API:** See `path` references (use original pattern for protected text)
  // Pattern matches both bold and non-bold, case-insensitive
  remaining = remaining.replace(/(?:\*\*)?API:(?:\*\*)?\s*See\s*__LIBAR_BT_\d+__/gi, '');

  // Clean up remaining content and restore backticks
  remaining = restore(remaining.trim());

  // Strip markdown tables from remaining content (tables are extracted separately
  // by extractTables() in business-rules.ts to avoid duplicate rendering)
  remaining = stripMarkdownTables(remaining);

  if (remaining.length > 0) {
    result.remainingContent = remaining;
  }

  return result;
}

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
export function stripMarkdownTables(text: string): string {
  if (!text) return text;

  return text
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      // Skip lines that are markdown table rows (start and end with |)
      return !(trimmed.startsWith('|') && trimmed.endsWith('|'));
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n') // Clean up excess newlines
    .trim();
}

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
export function renderBusinessRule(rule: BusinessRule): SectionBlock[] {
  const sections: SectionBlock[] = [];

  sections.push(paragraph(`**${rule.name}**`));

  if (rule.description) {
    // Parse DocStrings in description instead of plain paragraph
    sections.push(...parseDescriptionWithDocStrings(rule.description));
  }

  if (rule.scenarioNames.length > 0) {
    sections.push(paragraph(`_Verified by: ${rule.scenarioNames.join(', ')}_`));
  }

  return sections;
}

/**
 * Render a rule description using structured annotation parsing.
 *
 * Extracts `**Invariant:**`, `**Rationale:**`, `**Verified by:**`, tables, and
 * code examples for polished output with proper table formatting and separator rows.
 *
 * IMPORTANT: Table lines are stripped BEFORE annotation regexes so that bold markers
 * inside table cells (e.g. `| **Context:** ... |`) don't act as false annotation
 * boundaries that truncate the lazy `[\s\S]*?` capture.
 *
 * @param description - Raw rule description text from Gherkin Rule: block
 * @returns Array of SectionBlocks with structured content
 */
export function renderRuleDescription(description: string): SectionBlock[] {
  const blocks: SectionBlock[] = [];
  const annotations = parseBusinessRuleAnnotations(description);

  // 1. Render structured annotations first (extracted cleanly)
  if (annotations.invariant) {
    blocks.push(paragraph(`**Invariant:** ${annotations.invariant}`));
  }

  if (annotations.rationale) {
    blocks.push(paragraph(`**Rationale:** ${annotations.rationale}`));
  }

  // 2. Extract tables and render with proper markdown formatting (separator rows)
  const tables = extractTablesFromDescription(description);
  for (const tbl of tables) {
    const rows = tbl.rows.map((row) => tbl.headers.map((h) => row[h] ?? ''));
    blocks.push(table([...tbl.headers], rows));
  }

  // 3. Render remaining content with interleaved DocStrings preserved.
  //    Strip table lines FIRST (before annotation regexes) so that bold markers
  //    inside table cells (e.g. `| **Context:** ... |`) don't act as false
  //    annotation boundaries that truncate the lazy `[\s\S]*?` capture.
  //    Then strip known annotations and pass through parseDescriptionWithDocStrings
  //    which preserves text → code → text → code ordering.
  let stripped = description
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      return !(trimmed.startsWith('|') && trimmed.endsWith('|'));
    })
    .join('\n');
  stripped = stripped.replace(/\*\*Invariant:\*\*\s*[\s\S]*?(?=\*\*[A-Z]|\*\*$|$)/i, '');
  stripped = stripped.replace(/\*\*Rationale:\*\*\s*[\s\S]*?(?=\*\*[A-Z]|\*\*$|$)/i, '');
  stripped = stripped.replace(/\*\*Verified by:\*\*\s*[\s\S]*?(?=\*\*[A-Z]|\*\*$|$)/i, '');

  const strippedTrimmed = stripped.trim();
  if (strippedTrimmed.length > 0) {
    blocks.push(...parseDescriptionWithDocStrings(strippedTrimmed));
  }

  // 4. Render verified-by list last
  if (annotations.verifiedBy && annotations.verifiedBy.length > 0) {
    blocks.push(paragraph('**Verified by:**'));
    blocks.push(list([...annotations.verifiedBy]));
  }

  return blocks;
}

// ═══════════════════════════════════════════════════════════════════════════
// Composite Helpers
// ═══════════════════════════════════════════════════════════════════════════

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
export function renderScenarioContent(
  scenario: ScenarioRef,
  options?: RichContentOptions
): SectionBlock[] {
  const opts = mergeRichContentOptions(options);
  const sections: SectionBlock[] = [];

  // Scenario name as bold paragraph
  sections.push(paragraph(`**${scenario.scenarioName}**`));

  // Render steps if available and enabled
  if (opts.includeSteps && scenario.steps && scenario.steps.length > 0) {
    sections.push(renderStepsList(scenario.steps));

    // Render DataTables and DocStrings after the step list
    for (const step of scenario.steps) {
      if (opts.includeDataTables && step.dataTable && step.dataTable.headers.length > 0) {
        sections.push(renderDataTable(step.dataTable));
      }
      if (opts.includeDocStrings && step.docString) {
        sections.push(renderDocString(step.docString, opts.docStringLanguage));
      }
    }
  }

  return sections;
}

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
export function renderAcceptanceCriteria(
  scenarios: readonly ScenarioRef[] | undefined,
  options?: RichContentOptions
): SectionBlock[] {
  if (!scenarios || scenarios.length === 0) {
    return [];
  }

  const opts = mergeRichContentOptions(options);
  const sections: SectionBlock[] = [];
  sections.push(heading(opts.baseHeadingLevel, 'Acceptance Criteria'));

  for (const scenario of scenarios) {
    sections.push(...renderScenarioContent(scenario, options));
  }

  return sections;
}

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
export function renderBusinessRulesSection(
  rules: readonly BusinessRule[] | undefined,
  options?: RichContentOptions
): SectionBlock[] {
  if (!rules || rules.length === 0) {
    return [];
  }

  const opts = mergeRichContentOptions(options);
  const sections: SectionBlock[] = [];
  sections.push(heading(opts.baseHeadingLevel, 'Business Rules'));

  for (const rule of rules) {
    sections.push(...renderBusinessRule(rule));
  }

  return sections;
}

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
export function renderPatternRichContent(
  pattern: {
    scenarios?: readonly ScenarioRef[];
    rules?: readonly BusinessRule[];
  },
  options?: RichContentOptions
): SectionBlock[] {
  const opts = mergeRichContentOptions(options);
  const sections: SectionBlock[] = [];

  // Add acceptance criteria from scenarios
  if (pattern.scenarios && pattern.scenarios.length > 0) {
    sections.push(...renderAcceptanceCriteria(pattern.scenarios, opts));
  }

  // Add business rules
  if (opts.includeRules && pattern.rules && pattern.rules.length > 0) {
    sections.push(...renderBusinessRulesSection(pattern.rules, opts));
  }

  return sections;
}

// ═══════════════════════════════════════════════════════════════════════════
// Shape Rendering
// ═══════════════════════════════════════════════════════════════════════════

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
export function renderShapesAsMarkdown(
  shapes: readonly ExtractedShape[],
  options: RenderShapesOptions = {}
): string {
  const { groupInSingleBlock = true, includeJsDoc = true } = options;

  if (shapes.length === 0) {
    return '';
  }

  const renderShape = (shape: ExtractedShape): string => {
    const parts: string[] = [];
    if (includeJsDoc && shape.jsDoc) {
      parts.push(shape.jsDoc);
    }
    parts.push(shape.sourceText);
    return parts.join('\n');
  };

  if (groupInSingleBlock) {
    const content = shapes.map(renderShape).join('\n\n');
    return '```typescript\n' + content + '\n```';
  }

  return shapes.map((shape) => '```typescript\n' + renderShape(shape) + '\n```').join('\n\n');
}

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
export function renderPropertyDocsTable(propertyDocs: readonly PropertyDoc[] | undefined): string {
  if (!propertyDocs || propertyDocs.length === 0) {
    return '';
  }

  const lines: string[] = ['| Property | Description |', '| --- | --- |'];

  for (const prop of propertyDocs) {
    // Escape pipe characters in description to prevent table breakage
    const escapedDesc = prop.jsDoc.replace(/\|/g, '\\|');
    lines.push(`| \`${prop.name}\` | ${escapedDesc} |`);
  }

  return lines.join('\n');
}
