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
 * TODO: Pipe characters (`|`) inside markdown table cells in JSDoc options tables
 * are not escaped in the _claude-md summary output, producing broken table rendering.
 * Affects codecs with enum-type options (e.g., `"phase" | "priority"`).
 *
 * @see CodecDrivenReferenceGeneration spec
 * @see ReferenceDocShowcase spec
 */

import type { MasterDataset } from '../../validation-schemas/master-dataset.js';
import type { BusinessRule, ExtractedPattern } from '../../validation-schemas/extracted-pattern.js';
import type { SectionBlock } from '../schema.js';
import { parseBusinessRuleAnnotations } from './helpers.js';

// ============================================================================
// Convention Content Types
// ============================================================================

/**
 * Structured content extracted from a decision record Rule block.
 */
export interface ConventionRuleContent {
  /** Rule name (from Gherkin Rule: block or TypeScript ## heading) */
  readonly ruleName: string;

  /** Invariant statement if present */
  readonly invariant?: string;

  /** Rationale statement if present */
  readonly rationale?: string;

  /** Verified-by references if present */
  readonly verifiedBy?: readonly string[];

  /** Tables found in the Rule block description */
  readonly tables: readonly ConventionTable[];

  /** Code examples extracted from DocStrings in the rule description (includes mermaid diagrams) */
  readonly codeExamples?: readonly SectionBlock[];

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
export function extractTablesFromDescription(description: string): ConventionTable[] {
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
 * Parse a group of table lines into structured data.
 *
 * Supports both markdown tables (header + separator + data rows) and
 * Gherkin-style tables (header + data rows, no separator). Returns null
 * if insufficient rows.
 */
function parseTableLines(lines: string[]): ConventionTable | null {
  // Need at least header + 1 data row
  if (lines.length < 2) return null;

  const parseRow = (line: string): string[] =>
    line
      .split('|')
      .slice(1, -1) // Remove empty first/last from leading/trailing |
      .map((cell) => cell.trim());

  const headerLine = lines[0];
  if (!headerLine) return null;
  const headers = parseRow(headerLine);

  // Detect whether line 2 is a markdown separator row (| --- | --- |)
  const secondLine = lines[1];
  if (!secondLine) return null;
  const secondCells = secondLine.split('|').slice(1, -1);
  const hasSeparator = secondCells.every((cell) => /^[\s:-]+$/.test(cell));

  // Data rows start after separator (markdown) or immediately after header (Gherkin)
  const dataStart = hasSeparator ? 2 : 1;

  const rows: Array<Record<string, string>> = [];
  for (let i = dataStart; i < lines.length; i++) {
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
 * Build a ConventionRuleContent from raw text and a rule name.
 *
 * Shared helper used by both Gherkin Rule: block extraction and
 * TypeScript JSDoc description decomposition.
 */
function buildRuleContentFromText(text: string, ruleName: string): ConventionRuleContent {
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
function extractConventionRuleContent(rule: BusinessRule): ConventionRuleContent {
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
function extractConventionRulesFromDescription(
  description: string,
  patternName: string
): ConventionRuleContent[] {
  if (!description || description.trim().length === 0) return [];

  // Split by ## headings (level 2 only, not ### or deeper)
  // Allow optional leading whitespace for DocString content
  const headingPattern = /^\s*## (?!#)(.+)$/gm;
  const headings: Array<{ name: string; index: number; matchEnd: number }> = [];
  let match;

  while ((match = headingPattern.exec(description)) !== null) {
    const captured = match[1];
    if (captured) {
      headings.push({
        name: captured.trim(),
        index: match.index,
        matchEnd: match.index + match[0].length,
      });
    }
  }

  if (headings.length === 0) {
    // No headings: treat entire description as single rule
    return [buildRuleContentFromText(description, patternName)];
  }

  const rules: ConventionRuleContent[] = [];

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    if (!heading) continue;
    const nextIndex =
      i + 1 < headings.length ? (headings[i + 1]?.index ?? description.length) : description.length;
    // Content starts after the heading match (match includes the full "## Name" line)
    // Use matchEnd instead of indexOf('\n', heading.index) because \s* in the regex
    // can consume leading newlines, making heading.index point to those newlines
    const contentStart =
      heading.matchEnd < description.length ? heading.matchEnd + 1 : description.length;
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

    // Extract rule content from Gherkin Rule: blocks or TypeScript JSDoc description
    let ruleContents: ConventionRuleContent[];
    if (pattern.rules && pattern.rules.length > 0) {
      // Gherkin source: extract from Rule: blocks
      ruleContents = pattern.rules.map(extractConventionRuleContent);
    } else if (pattern.directive.description) {
      // TypeScript source: decompose JSDoc description by ## headings
      ruleContents = extractConventionRulesFromDescription(
        pattern.directive.description,
        pattern.name
      );
    } else {
      ruleContents = [];
    }

    // Only add to bundles if rules were extracted
    if (ruleContents.length === 0) continue;

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
export function extractConventionsFromPatterns(
  patterns: readonly ExtractedPattern[]
): ConventionBundle[] {
  const bundles = new Map<string, { sourceDecisions: string[]; rules: ConventionRuleContent[] }>();

  for (const pattern of patterns) {
    if (!pattern.convention || pattern.convention.length === 0) continue;

    let ruleContents: ConventionRuleContent[];
    if (pattern.rules && pattern.rules.length > 0) {
      ruleContents = pattern.rules.map(extractConventionRuleContent);
    } else if (pattern.directive.description) {
      ruleContents = extractConventionRulesFromDescription(
        pattern.directive.description,
        pattern.name
      );
    } else {
      ruleContents = [];
    }

    if (ruleContents.length === 0) continue;

    for (const tag of pattern.convention) {
      const bundle = bundles.get(tag) ?? { sourceDecisions: [], rules: [] };
      bundle.sourceDecisions.push(pattern.name);
      bundle.rules.push(...ruleContents);
      bundles.set(tag, bundle);
    }
  }

  const result: ConventionBundle[] = [];
  for (const [tag, bundle] of bundles) {
    if (bundle.rules.length === 0) continue;
    result.push({
      conventionTag: tag,
      sourceDecisions: bundle.sourceDecisions,
      rules: bundle.rules,
    });
  }
  return result;
}
