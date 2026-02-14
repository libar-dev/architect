/**
 * Convention Extractor
 *
 * Filters MasterDataset for patterns tagged with `@libar-docs-convention`
 * and extracts convention content as structured data for reference codec
 * composition. Supports two sources:
 *
 * - **Gherkin**: Extracts from `Rule:` blocks on the pattern's `rules` array
 * - **TypeScript**: Decomposes JSDoc `directive.description` by `## Heading`
 *   sections, parsing each section for structured annotations
 *
 * Both sources produce the same `ConventionRuleContent` output, enabling
 * Gherkin and TypeScript convention content to merge in the same bundle.
 *
 * @see CodecDrivenReferenceGeneration spec
 * @see ReferenceDocShowcase spec
 */
import { parseBusinessRuleAnnotations } from './helpers.js';
// ============================================================================
// Table Extraction from Description Text
// ============================================================================
/**
 * Extract markdown tables from description text.
 *
 * Identifies lines starting and ending with `|` as table rows,
 * groups consecutive table lines, and parses headers + data rows.
 */
function extractTablesFromDescription(description) {
    if (!description)
        return [];
    const lines = description.split('\n');
    const tables = [];
    let currentTableLines = [];
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            currentTableLines.push(trimmed);
        }
        else if (currentTableLines.length > 0) {
            // End of a table block — parse it
            const parsed = parseTableLines(currentTableLines);
            if (parsed)
                tables.push(parsed);
            currentTableLines = [];
        }
    }
    // Handle table at end of text
    if (currentTableLines.length > 0) {
        const parsed = parseTableLines(currentTableLines);
        if (parsed)
            tables.push(parsed);
    }
    return tables;
}
/**
 * Parse a group of markdown table lines into structured data.
 *
 * Expects: header row, separator row (---), then data rows.
 * Returns null if insufficient rows.
 */
function parseTableLines(lines) {
    // Need at least header + separator + 1 data row
    if (lines.length < 3)
        return null;
    const parseRow = (line) => line
        .split('|')
        .slice(1, -1) // Remove empty first/last from leading/trailing |
        .map((cell) => cell.trim());
    const headerLine = lines[0];
    if (!headerLine)
        return null;
    const headers = parseRow(headerLine);
    const separatorLine = lines[1];
    if (!separatorLine)
        return null;
    const separatorCells = separatorLine.split('|').slice(1, -1);
    const isSeparator = separatorCells.every((cell) => /^[\s:-]+$/.test(cell));
    if (!isSeparator)
        return null;
    const rows = [];
    for (let i = 2; i < lines.length; i++) {
        const dataLine = lines[i];
        if (!dataLine)
            continue;
        const cells = parseRow(dataLine);
        const row = {};
        for (let j = 0; j < headers.length; j++) {
            const header = headers[j];
            if (header) {
                row[header] = cells[j] ?? '';
            }
        }
        rows.push(row);
    }
    return { headers, rows };
}
// ============================================================================
// Rule Content Extraction
// ============================================================================
/**
 * Build a ConventionRuleContent from raw text and a rule name.
 *
 * Shared helper used by both Gherkin Rule: block extraction and
 * TypeScript JSDoc description decomposition.
 */
function buildRuleContentFromText(text, ruleName) {
    const annotations = parseBusinessRuleAnnotations(text);
    const tables = extractTablesFromDescription(text);
    return {
        ruleName,
        ...(annotations.invariant !== undefined && { invariant: annotations.invariant }),
        ...(annotations.rationale !== undefined && { rationale: annotations.rationale }),
        ...(annotations.verifiedBy !== undefined && {
            verifiedBy: annotations.verifiedBy,
        }),
        tables,
        ...(annotations.codeExamples !== undefined &&
            annotations.codeExamples.length > 0 && {
            codeExamples: annotations.codeExamples,
        }),
        narrative: annotations.remainingContent ?? '',
    };
}
/**
 * Extract structured convention content from a Gherkin business rule.
 */
function extractConventionRuleContent(rule) {
    return buildRuleContentFromText(rule.description, rule.name);
}
// ============================================================================
// TypeScript JSDoc Description Decomposition
// ============================================================================
/**
 * Extract convention rules from a TypeScript JSDoc description.
 *
 * Decomposes the description by `## Heading` sections into individual
 * convention rules. Each heading becomes a rule name; the content below it
 * (until the next `## ` or end) is parsed through `parseBusinessRuleAnnotations()`.
 *
 * If no `## ` headings exist, treats the entire description as a single rule.
 *
 * @param description - The JSDoc description text
 * @param patternName - Fallback rule name when no ## headings exist
 * @returns Array of ConventionRuleContent
 */
function extractConventionRulesFromDescription(description, patternName) {
    if (!description || description.trim().length === 0)
        return [];
    // Split by ## headings (level 2 only, not ### or deeper)
    // Allow optional leading whitespace for DocString content
    const headingPattern = /^\s*## (?!#)(.+)$/gm;
    const headings = [];
    let match;
    while ((match = headingPattern.exec(description)) !== null) {
        const captured = match[1];
        if (captured) {
            headings.push({ name: captured.trim(), index: match.index });
        }
    }
    if (headings.length === 0) {
        // No headings: treat entire description as single rule
        return [buildRuleContentFromText(description, patternName)];
    }
    const rules = [];
    for (let i = 0; i < headings.length; i++) {
        const heading = headings[i];
        if (!heading)
            continue;
        const nextIndex = i + 1 < headings.length ? (headings[i + 1]?.index ?? description.length) : description.length;
        // Content starts after the heading line
        const headingLineEnd = description.indexOf('\n', heading.index);
        const contentStart = headingLineEnd >= 0 ? headingLineEnd + 1 : description.length;
        const content = description.slice(contentStart, nextIndex).trim();
        if (content.length > 0) {
            rules.push(buildRuleContentFromText(content, heading.name));
        }
    }
    return rules;
}
// ============================================================================
// Extraction Function
// ============================================================================
/**
 * Extracts convention content from MasterDataset.
 *
 * Filters patterns tagged with `@libar-docs-convention` matching the
 * requested tag values. For Gherkin-sourced patterns, extracts from
 * Rule: blocks. For TypeScript-sourced patterns (no rules array),
 * decomposes the JSDoc description by ## headings.
 *
 * @param dataset - The MasterDataset containing all extracted patterns
 * @param conventionTags - Convention tag values to filter by
 * @returns Array of ConventionBundles, one per requested tag value
 *
 * @example
 * ```typescript
 * const conventions = extractConventions(dataset, ['fsm-rules', 'testing-policy']);
 * // conventions[0].conventionTag === 'fsm-rules'
 * // conventions[0].rules[0].ruleName === 'FSM Transitions'
 * // conventions[0].rules[0].tables[0].headers === ['From', 'To', 'Condition']
 * ```
 */
export function extractConventions(dataset, conventionTags) {
    if (conventionTags.length === 0)
        return [];
    // Build a map of conventionTag -> { sourceDecisions, rules }
    const bundles = new Map();
    // Initialize bundles for all requested tags
    for (const tag of conventionTags) {
        bundles.set(tag, { sourceDecisions: [], rules: [] });
    }
    // Filter patterns that have convention tags matching our request
    for (const pattern of dataset.patterns) {
        if (!pattern.convention || pattern.convention.length === 0)
            continue;
        // Check if this pattern has any of the requested convention tags
        const matchingTags = pattern.convention.filter((t) => conventionTags.includes(t));
        if (matchingTags.length === 0)
            continue;
        // Extract rule content from Gherkin Rule: blocks or TypeScript JSDoc description
        let ruleContents;
        if (pattern.rules && pattern.rules.length > 0) {
            // Gherkin source: extract from Rule: blocks
            ruleContents = pattern.rules.map(extractConventionRuleContent);
        }
        else if (pattern.directive.description) {
            // TypeScript source: decompose JSDoc description by ## headings
            ruleContents = extractConventionRulesFromDescription(pattern.directive.description, pattern.name);
        }
        else {
            ruleContents = [];
        }
        // Only add to bundles if rules were extracted
        if (ruleContents.length === 0)
            continue;
        for (const tag of matchingTags) {
            const bundle = bundles.get(tag);
            if (bundle) {
                bundle.sourceDecisions.push(pattern.name);
                bundle.rules.push(...ruleContents);
            }
        }
    }
    // Convert map to array, preserving requested order
    const result = [];
    for (const tag of conventionTags) {
        const bundle = bundles.get(tag);
        if (!bundle)
            continue;
        if (bundle.rules.length === 0 && bundle.sourceDecisions.length === 0)
            continue;
        result.push({
            conventionTag: tag,
            sourceDecisions: bundle.sourceDecisions,
            rules: bundle.rules,
        });
    }
    return result;
}
/**
 * Extract convention bundles from pre-filtered patterns.
 *
 * DD-1 (CrossCuttingDocumentInclusion): Used by the include-tag pass to
 * build convention content from patterns selected by include tag rather
 * than by conventionTags filter. Groups output by each pattern's convention
 * tag values.
 *
 * @param patterns - Pre-filtered patterns that have convention content
 * @returns Array of ConventionBundles
 */
export function extractConventionsFromPatterns(patterns) {
    const bundles = new Map();
    for (const pattern of patterns) {
        if (!pattern.convention || pattern.convention.length === 0)
            continue;
        let ruleContents;
        if (pattern.rules && pattern.rules.length > 0) {
            ruleContents = pattern.rules.map(extractConventionRuleContent);
        }
        else if (pattern.directive.description) {
            ruleContents = extractConventionRulesFromDescription(pattern.directive.description, pattern.name);
        }
        else {
            ruleContents = [];
        }
        if (ruleContents.length === 0)
            continue;
        for (const tag of pattern.convention) {
            const bundle = bundles.get(tag) ?? { sourceDecisions: [], rules: [] };
            bundle.sourceDecisions.push(pattern.name);
            bundle.rules.push(...ruleContents);
            bundles.set(tag, bundle);
        }
    }
    const result = [];
    for (const [tag, bundle] of bundles) {
        if (bundle.rules.length === 0)
            continue;
        result.push({
            conventionTag: tag,
            sourceDecisions: bundle.sourceDecisions,
            rules: bundle.rules,
        });
    }
    return result;
}
//# sourceMappingURL=convention-extractor.js.map