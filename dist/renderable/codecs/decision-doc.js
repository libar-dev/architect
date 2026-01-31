/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern DecisionDocCodec
 * @libar-docs-status completed
 *
 * ## Decision Doc Codec
 *
 * Parses decision documents (ADR/PDR in .feature format) and extracts content
 * for documentation generation. Extends patterns from AdrDocumentCodec.
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
import { parseDescriptionWithDocStrings, partitionRulesByPrefix, } from './helpers.js';
// ═══════════════════════════════════════════════════════════════════════════
// Self-Reference Constants
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Self-reference marker indicating content should be extracted from current document
 */
export const SELF_REFERENCE_MARKER = 'THIS DECISION';
/**
 * Pattern for self-reference with specific Rule: block
 * Matches: "THIS DECISION (Rule: SomeName)"
 */
export const SELF_REFERENCE_RULE_PATTERN = /^THIS DECISION \(Rule:\s*([^)]+)\)$/i;
/**
 * Pattern for self-reference to DocStrings
 * Matches: "THIS DECISION (DocString)"
 */
export const SELF_REFERENCE_DOCSTRING_PATTERN = /^THIS DECISION \(DocString\)$/i;
// ═══════════════════════════════════════════════════════════════════════════
// Rule Partitioning (Uses shared helper from helpers.ts)
// ═══════════════════════════════════════════════════════════════════════════
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
export function partitionDecisionRules(rules, _patternName) {
    // Note: Unlike ADR codec, we don't warn about "other" rules
    return partitionRulesByPrefix(rules, { warnOnOther: false });
}
// ═══════════════════════════════════════════════════════════════════════════
// DocString Extraction
// ═══════════════════════════════════════════════════════════════════════════
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
export function extractDocStrings(text) {
    if (!text || text.trim().length === 0) {
        return [];
    }
    // Normalize line endings (Windows CRLF -> LF)
    const normalized = text.replace(/\r\n/g, '\n');
    const docStrings = [];
    // Extract Gherkin DocStrings (""" format)
    const gherkinDocStringPattern = /"""(\w*)\n([\s\S]*?)"""/g;
    let match;
    while ((match = gherkinDocStringPattern.exec(normalized)) !== null) {
        const langMatch = match[1] ?? '';
        const language = langMatch.length > 0 ? langMatch : 'text';
        const content = (match[2] ?? '').trim();
        if (content) {
            docStrings.push({ language, content });
        }
    }
    // Extract markdown code fences (``` format)
    const markdownCodePattern = /```(\w*)\n([\s\S]*?)```/g;
    while ((match = markdownCodePattern.exec(normalized)) !== null) {
        const langMatch = match[1] ?? '';
        const language = langMatch.length > 0 ? langMatch : 'text';
        const content = (match[2] ?? '').trim();
        if (content) {
            docStrings.push({ language, content });
        }
    }
    return docStrings;
}
/**
 * Extract DocStrings from business rules
 *
 * Iterates through rule descriptions and extracts all embedded DocStrings.
 *
 * @param rules - Business rules to extract DocStrings from
 * @returns Array of extracted DocStrings with language tags
 */
export function extractDocStringsFromRules(rules) {
    if (!rules || rules.length === 0) {
        return [];
    }
    const docStrings = [];
    for (const rule of rules) {
        if (rule.description) {
            docStrings.push(...extractDocStrings(rule.description));
        }
    }
    return docStrings;
}
// ═══════════════════════════════════════════════════════════════════════════
// Source Mapping Table Parsing
// ═══════════════════════════════════════════════════════════════════════════
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
export function parseSourceMappingTable(text) {
    if (!text || text.trim().length === 0) {
        return [];
    }
    // Normalize line endings
    const normalized = text.replace(/\r\n/g, '\n');
    // Find all markdown tables in the text
    const lines = normalized.split('\n');
    const mappings = [];
    let inTable = false;
    let headerIndices = null;
    for (const currentLine of lines) {
        const line = currentLine.trim();
        // Check if this line looks like a table row
        if (line.startsWith('|') && line.endsWith('|')) {
            const cells = line
                .split('|')
                .slice(1, -1) // Remove first and last empty strings from split
                .map((cell) => cell.trim());
            // Check if this is a header row
            if (!inTable) {
                // Look for header columns (case-insensitive)
                const sectionIdx = cells.findIndex((c) => c.toLowerCase() === 'section');
                const sourceIdx = cells.findIndex((c) => c.toLowerCase() === 'source file' || c.toLowerCase() === 'source');
                const extractionIdx = cells.findIndex((c) => c.toLowerCase() === 'extraction method' ||
                    c.toLowerCase() === 'extraction' ||
                    c.toLowerCase() === 'how');
                if (sectionIdx !== -1 && sourceIdx !== -1 && extractionIdx !== -1) {
                    headerIndices = {
                        section: sectionIdx,
                        sourceFile: sourceIdx,
                        extraction: extractionIdx,
                    };
                    inTable = true;
                    continue;
                }
            }
            else {
                // Check if this is the separator row (contains only dashes and pipes)
                if (cells.every((cell) => /^[-:]+$/.test(cell))) {
                    continue;
                }
                // This is a data row - extract the mapping
                if (headerIndices) {
                    const section = cells[headerIndices.section] ?? '';
                    const sourceFile = cells[headerIndices.sourceFile] ?? '';
                    const extractionMethod = cells[headerIndices.extraction] ?? '';
                    // Only add if we have valid data
                    if (section && sourceFile && extractionMethod) {
                        mappings.push({
                            section,
                            sourceFile,
                            extractionMethod,
                        });
                    }
                }
            }
        }
        else if (inTable) {
            // End of table
            inTable = false;
            headerIndices = null;
        }
    }
    return mappings;
}
/**
 * Parse source mapping tables from business rules
 *
 * Searches through rule descriptions for source mapping tables.
 *
 * @param rules - Business rules to search for source mapping tables
 * @returns Array of source mapping entries from all rules
 */
export function parseSourceMappingsFromRules(rules) {
    if (!rules || rules.length === 0) {
        return [];
    }
    const mappings = [];
    for (const rule of rules) {
        if (rule.description) {
            mappings.push(...parseSourceMappingTable(rule.description));
        }
    }
    return mappings;
}
// ═══════════════════════════════════════════════════════════════════════════
// Self-Reference Resolution
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Check if a source file reference is a self-reference
 *
 * @param sourceFile - The source file path to check
 * @returns True if the reference is to the current decision document
 */
export function isSelfReference(sourceFile) {
    return (sourceFile === SELF_REFERENCE_MARKER ||
        SELF_REFERENCE_RULE_PATTERN.test(sourceFile) ||
        SELF_REFERENCE_DOCSTRING_PATTERN.test(sourceFile));
}
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
export function parseSelfReference(sourceFile) {
    if (sourceFile === SELF_REFERENCE_MARKER) {
        return { type: 'document' };
    }
    const ruleMatch = SELF_REFERENCE_RULE_PATTERN.exec(sourceFile);
    if (ruleMatch?.[1]) {
        return { type: 'rule', name: ruleMatch[1].trim() };
    }
    if (SELF_REFERENCE_DOCSTRING_PATTERN.test(sourceFile)) {
        return { type: 'docstring' };
    }
    return null;
}
// ═══════════════════════════════════════════════════════════════════════════
// Rule Block Content Extraction
// ═══════════════════════════════════════════════════════════════════════════
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
export function findRuleByName(rules, ruleName) {
    if (!rules || rules.length === 0) {
        return undefined;
    }
    const nameLower = ruleName.toLowerCase().trim();
    // First try exact match
    const exactMatch = rules.find((r) => r.name.toLowerCase() === nameLower);
    if (exactMatch) {
        return exactMatch;
    }
    // Then try partial match (rule name contains search term)
    const partialMatch = rules.find((r) => r.name.toLowerCase().includes(nameLower));
    if (partialMatch) {
        return partialMatch;
    }
    // Try prefix match - both start with the same word
    // This handles cases like "Context above" matching "Context - Manual..."
    const firstWord = nameLower.split(/[\s-]+/)[0];
    if (firstWord && firstWord.length > 2) {
        return rules.find((r) => r.name.toLowerCase().startsWith(firstWord));
    }
    return undefined;
}
/**
 * Extract content from a rule's description
 *
 * Returns the description text with DocStrings parsed as code blocks.
 *
 * @param rule - The rule to extract content from
 * @returns Array of SectionBlocks representing the rule content
 */
export function extractRuleContent(rule) {
    if (!rule.description) {
        return [];
    }
    return parseDescriptionWithDocStrings(rule.description);
}
// ═══════════════════════════════════════════════════════════════════════════
// Full Decision Document Parsing
// ═══════════════════════════════════════════════════════════════════════════
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
export function parseDecisionDocument(patternName, description, rules) {
    const partitionedRules = partitionDecisionRules(rules, patternName);
    // Collect DocStrings from all sources
    const docStrings = [];
    // DocStrings from description
    docStrings.push(...extractDocStrings(description));
    // DocStrings from all rules
    docStrings.push(...extractDocStringsFromRules(rules));
    // Parse source mappings from all rules
    const sourceMappings = parseSourceMappingsFromRules(rules);
    return {
        patternName,
        description,
        rules: partitionedRules,
        docStrings,
        sourceMappings,
    };
}
// ═══════════════════════════════════════════════════════════════════════════
// Extraction Method Dispatch
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Known extraction methods and their descriptions
 */
export const EXTRACTION_METHODS = {
    DECISION_RULE_DESCRIPTION: 'Decision rule description',
    EXTRACT_SHAPES: '@extract-shapes tag',
    RULE_BLOCKS: 'Rule blocks',
    SCENARIO_OUTLINE_EXAMPLES: 'Scenario Outline Examples',
    JSDOC_SECTION: 'JSDoc section',
    CREATE_VIOLATION_PATTERNS: 'createViolation() patterns',
    FENCED_CODE_BLOCK: 'Fenced code block',
};
/**
 * Normalize an extraction method string to a known type
 *
 * @param method - The extraction method string from the source mapping
 * @returns Normalized method key or 'unknown'
 */
export function normalizeExtractionMethod(method) {
    const methodLower = method.toLowerCase().trim();
    if (methodLower.includes('decision rule') || methodLower.includes('rule description')) {
        return 'DECISION_RULE_DESCRIPTION';
    }
    if (methodLower.includes('@extract-shapes') || methodLower.includes('extract-shapes')) {
        return 'EXTRACT_SHAPES';
    }
    if (methodLower.includes('rule block')) {
        return 'RULE_BLOCKS';
    }
    if (methodLower.includes('scenario outline') || methodLower.includes('examples')) {
        return 'SCENARIO_OUTLINE_EXAMPLES';
    }
    if (methodLower.includes('jsdoc')) {
        return 'JSDOC_SECTION';
    }
    if (methodLower.includes('createviolation') || methodLower.includes('violation')) {
        return 'CREATE_VIOLATION_PATTERNS';
    }
    if (methodLower.includes('fenced') || methodLower.includes('code block')) {
        return 'FENCED_CODE_BLOCK';
    }
    return 'unknown';
}
/**
 * Convert ExtractedDocStrings to CodeBlock SectionBlocks
 *
 * @param docStrings - Extracted DocStrings
 * @returns Array of CodeBlock sections
 */
export function docStringsToCodeBlocks(docStrings) {
    return docStrings.map((ds) => ({
        type: 'code',
        language: ds.language,
        content: ds.content,
    }));
}
//# sourceMappingURL=decision-doc.js.map