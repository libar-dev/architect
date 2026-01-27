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
import { table, code, list, paragraph, heading } from '../schema.js';
/**
 * Default rich content options
 *
 * Note: onWarning is intentionally undefined by default.
 * When undefined, warnings fall back to console.warn via emitWarning().
 */
export const DEFAULT_RICH_CONTENT_OPTIONS = {
    includeSteps: true,
    includeDataTables: true,
    includeDocStrings: true,
    includeRules: true,
    docStringLanguage: 'markdown',
    baseHeadingLevel: 4,
    onWarning: undefined,
};
/**
 * Merge user options with defaults
 */
export function mergeRichContentOptions(options) {
    if (!options) {
        return DEFAULT_RICH_CONTENT_OPTIONS;
    }
    return {
        ...DEFAULT_RICH_CONTENT_OPTIONS,
        ...options,
    };
}
/**
 * Emit a warning using the configured handler or console.warn fallback
 *
 * @internal
 */
function emitWarning(warning, options) {
    if (options?.onWarning) {
        options.onWarning(warning);
    }
    else {
        const contextSuffix = warning.context ? ` Context: ${warning.context}` : '';
        console.warn(`[${warning.code}] ${warning.message}${contextSuffix}`);
    }
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
export function renderDataTable(dt) {
    const rows = dt.rows.map((row) => {
        return dt.headers.map((header) => row[header] ?? '');
    });
    return table(dt.headers, rows);
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
export function renderDocString(docString, language = 'markdown') {
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
export function renderStepsList(steps) {
    const stepItems = steps.map((step) => `${step.keyword} ${step.text}`);
    return list(stepItems);
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
export function parseDescriptionWithDocStrings(description, options) {
    // Handle empty input
    if (!description || description.trim().length === 0) {
        return [];
    }
    // Normalize line endings (Windows CRLF → LF)
    const normalized = description.replace(/\r\n/g, '\n');
    // Detect unclosed DocStrings (odd number of """)
    // Important: Exclude """ that appears inside backticks (inline code examples)
    // e.g., `"""typescript` should not be counted as a delimiter
    const withoutInlineCode = normalized.replace(/`[^`]+`/g, '');
    const docStringDelimiters = withoutInlineCode.match(/"""/g);
    if (docStringDelimiters && docStringDelimiters.length % 2 !== 0) {
        // Unclosed DocString detected - return as plain paragraph to avoid corruption
        // This is a defensive fallback; the content may not render as intended
        emitWarning({
            code: 'unclosed-docstring',
            message: 'Unclosed DocString detected (odd number of """ delimiters)',
            context: `Found ${docStringDelimiters.length} delimiters in description`,
        }, options);
        return [paragraph(normalized.trim())];
    }
    const sections = [];
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
        const language = (match[1] ?? '').length > 0 ? match[1] : 'text';
        const content = (match[2] ?? '').trim();
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
export function protectBacktickContent(text) {
    const placeholders = [];
    // Use unique prefix to reduce collision risk with real content
    const processed = text.replace(/`[^`]+`/g, (match) => {
        placeholders.push(match);
        return `__LIBAR_BT_${placeholders.length - 1}__`;
    });
    const restore = (s) => s.replace(/__LIBAR_BT_(\d+)__/g, (_, i) => placeholders[Number(i)] ?? '');
    return { processed, restore };
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
export function truncateText(text, maxLength) {
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
/**
 * Extract the first sentence from text.
 *
 * Looks for sentence-ending punctuation (. ! ?) followed by whitespace or end.
 * Useful for creating compact summaries of longer descriptions.
 *
 * @param text - The text to extract from
 * @returns First sentence, or full text if no sentence boundary found
 *
 * @example
 * ```typescript
 * extractFirstSentence("Events are immutable. This ensures audit integrity.");
 * // Returns: "Events are immutable."
 * ```
 */
export function extractFirstSentence(text) {
    if (!text)
        return '';
    // Find sentence-ending punctuation followed by:
    // - whitespace + uppercase letter (new sentence), OR
    // - end of string
    // This correctly handles periods in file extensions (.feature, .md, etc.)
    const sentenceEndPattern = /[.!?](?=\s+[A-Z]|\s*$)/;
    const match = sentenceEndPattern.exec(text);
    if (match) {
        return text.slice(0, match.index + 1).trim();
    }
    // If no clear sentence boundary found, return whole text trimmed
    return text.trim();
}
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
export function parseBusinessRuleAnnotations(description) {
    if (!description || description.trim().length === 0) {
        return {};
    }
    // Normalize line endings
    const normalized = description.replace(/\r\n/g, '\n');
    const result = {};
    const codeExamples = [];
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
    // Step 2.5: Protect backtick-quoted content from regex matching
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
        result.invariant = restore(invariantText
            .replace(/\n\s*\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim());
    }
    // Extract **Rationale:** - matches until next ** or end of string
    const rationalePattern = /\*\*Rationale:\*\*\s*([\s\S]*?)(?=\*\*[A-Z]|\*\*$|$)/i;
    const rationaleMatch = rationalePattern.exec(protectedText);
    if (rationaleMatch?.[1]) {
        const rationaleText = rationaleMatch[1].trim();
        result.rationale = restore(rationaleText
            .replace(/\n\s*\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim());
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
    const apiRefPattern = /\*\*API:\*\*\s*See\s*`([^`]+)`/g;
    const apiRefs = [];
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
    // Step 4: Calculate remaining content (after removing annotations from protected text)
    // Use protectedText to ensure regexes don't stop at `**X` inside backticks
    let remaining = protectedText;
    // Remove **Invariant:** block
    remaining = remaining.replace(/\*\*Invariant:\*\*\s*[\s\S]*?(?=\*\*[A-Z]|\*\*$|$)/i, '');
    // Remove **Rationale:** block
    remaining = remaining.replace(/\*\*Rationale:\*\*\s*[\s\S]*?(?=\*\*[A-Z]|\*\*$|$)/i, '');
    // Remove **Verified by:** block
    remaining = remaining.replace(/\*\*Verified by:\*\*\s*[\s\S]*?(?=\*\*[A-Z]|\*\*$|$)/i, '');
    // Remove **API:** See `path` references (use original pattern for protected text)
    remaining = remaining.replace(/\*\*API:\*\*\s*See\s*__BT\d+__/g, '');
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
export function stripMarkdownTables(text) {
    if (!text)
        return text;
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
export function renderBusinessRule(rule) {
    const sections = [];
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
export function renderScenarioContent(scenario, options) {
    const opts = mergeRichContentOptions(options);
    const sections = [];
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
export function renderAcceptanceCriteria(scenarios, options) {
    if (!scenarios || scenarios.length === 0) {
        return [];
    }
    const opts = mergeRichContentOptions(options);
    const sections = [];
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
export function renderBusinessRulesSection(rules, options) {
    if (!rules || rules.length === 0) {
        return [];
    }
    const opts = mergeRichContentOptions(options);
    const sections = [];
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
export function renderPatternRichContent(pattern, options) {
    const opts = mergeRichContentOptions(options);
    const sections = [];
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
//# sourceMappingURL=helpers.js.map