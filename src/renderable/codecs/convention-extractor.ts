/**
 * Convention Extractor
 *
 * Filters MasterDataset for decision records tagged with
 * `@libar-docs-convention` and extracts their Rule block content
 * as structured data for reference codec composition.
 *
 * @see CodecDrivenReferenceGeneration spec
 */

import type { MasterDataset } from '../../validation-schemas/master-dataset.js';
import type { BusinessRule } from '../../validation-schemas/extracted-pattern.js';
import { parseBusinessRuleAnnotations } from './helpers.js';

// ============================================================================
// Convention Content Types
// ============================================================================

/**
 * Structured content extracted from a decision record Rule block.
 */
export interface ConventionRuleContent {
  /** Rule name from the Gherkin Rule: block */
  readonly ruleName: string;

  /** Invariant statement if present */
  readonly invariant?: string;

  /** Rationale statement if present */
  readonly rationale?: string;

  /** Verified-by references if present */
  readonly verifiedBy?: readonly string[];

  /** Tables found in the Rule block description */
  readonly tables: readonly ConventionTable[];

  /** Free-text content (non-table, non-structured) */
  readonly narrative: string;
}

/**
 * A table extracted from a Rule block.
 */
export interface ConventionTable {
  readonly headers: readonly string[];
  readonly rows: ReadonlyArray<Record<string, string>>;
}

/**
 * All convention content for a given tag value.
 */
export interface ConventionBundle {
  /** The convention tag value (e.g., "fsm-rules") */
  readonly conventionTag: string;

  /** Source decision records that contributed */
  readonly sourceDecisions: readonly string[];

  /** Extracted Rule block content, ordered by source */
  readonly rules: readonly ConventionRuleContent[];
}

// ============================================================================
// Table Extraction from Description Text
// ============================================================================

/**
 * Extract markdown tables from description text.
 *
 * Identifies lines starting and ending with `|` as table rows,
 * groups consecutive table lines, and parses headers + data rows.
 */
function extractTablesFromDescription(description: string): ConventionTable[] {
  if (!description) return [];

  const lines = description.split('\n');
  const tables: ConventionTable[] = [];
  let currentTableLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      currentTableLines.push(trimmed);
    } else if (currentTableLines.length > 0) {
      // End of a table block — parse it
      const parsed = parseTableLines(currentTableLines);
      if (parsed) tables.push(parsed);
      currentTableLines = [];
    }
  }

  // Handle table at end of text
  if (currentTableLines.length > 0) {
    const parsed = parseTableLines(currentTableLines);
    if (parsed) tables.push(parsed);
  }

  return tables;
}

/**
 * Parse a group of markdown table lines into structured data.
 *
 * Expects: header row, separator row (---), then data rows.
 * Returns null if insufficient rows.
 */
function parseTableLines(lines: string[]): ConventionTable | null {
  // Need at least header + separator + 1 data row
  if (lines.length < 3) return null;

  const parseRow = (line: string): string[] =>
    line
      .split('|')
      .slice(1, -1) // Remove empty first/last from leading/trailing |
      .map((cell) => cell.trim());

  const headerLine = lines[0];
  if (!headerLine) return null;
  const headers = parseRow(headerLine);

  const separatorLine = lines[1];
  if (!separatorLine) return null;
  const separatorCells = separatorLine.split('|').slice(1, -1);
  const isSeparator = separatorCells.every((cell) => /^[\s:-]+$/.test(cell));
  if (!isSeparator) return null;

  const rows: Array<Record<string, string>> = [];
  for (let i = 2; i < lines.length; i++) {
    const dataLine = lines[i];
    if (!dataLine) continue;
    const cells = parseRow(dataLine);
    const row: Record<string, string> = {};
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
function extractConventionRuleContent(rule: BusinessRule): ConventionRuleContent {
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
export function extractConventions(
  dataset: MasterDataset,
  conventionTags: readonly string[]
): ConventionBundle[] {
  if (conventionTags.length === 0) return [];

  // Build a map of conventionTag -> { sourceDecisions, rules }
  const bundles = new Map<string, { sourceDecisions: string[]; rules: ConventionRuleContent[] }>();

  // Initialize bundles for all requested tags
  for (const tag of conventionTags) {
    bundles.set(tag, { sourceDecisions: [], rules: [] });
  }

  // Filter patterns that have convention tags matching our request
  for (const pattern of dataset.patterns) {
    if (!pattern.convention || pattern.convention.length === 0) continue;

    // Check if this pattern has any of the requested convention tags
    const matchingTags = pattern.convention.filter((t) => conventionTags.includes(t));
    if (matchingTags.length === 0) continue;

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
  const result: ConventionBundle[] = [];
  for (const tag of conventionTags) {
    const bundle = bundles.get(tag);
    if (!bundle) continue;
    if (bundle.rules.length === 0 && bundle.sourceDecisions.length === 0) continue;
    result.push({
      conventionTag: tag,
      sourceDecisions: bundle.sourceDecisions,
      rules: bundle.rules,
    });
  }
  return result;
}
