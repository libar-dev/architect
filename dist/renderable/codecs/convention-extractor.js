/**
 * Convention Extractor
 *
 * Filters MasterDataset for decision records tagged with
 * `@libar-docs-convention` and extracts their Rule block content
 * as structured data for reference codec composition.
 *
 * @see CodecDrivenReferenceGeneration spec
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
 * Extract structured convention content from a business rule.
 */
function extractConventionRuleContent(rule) {
    const annotations = parseBusinessRuleAnnotations(rule.description);
    const tables = extractTablesFromDescription(rule.description);
    return {
        ruleName: rule.name,
        ...(annotations.invariant !== undefined && { invariant: annotations.invariant }),
        ...(annotations.rationale !== undefined && { rationale: annotations.rationale }),
        ...(annotations.verifiedBy !== undefined && {
            verifiedBy: annotations.verifiedBy,
        }),
        tables,
        narrative: annotations.remainingContent ?? '',
    };
}
// ============================================================================
// Extraction Function
// ============================================================================
/**
 * Extracts convention content from MasterDataset.
 *
 * Filters patterns for decision records tagged with `@libar-docs-convention`
 * matching the requested tag values. Extracts Rule block content as
 * structured data.
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
        // Extract rule content from this pattern's rules
        const ruleContents = (pattern.rules ?? []).map(extractConventionRuleContent);
        // Add to each matching bundle
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
//# sourceMappingURL=convention-extractor.js.map