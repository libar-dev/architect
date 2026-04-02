/**
 * @architect
 * @architect-pattern ReferenceCodec
 * @architect-status completed
 *
 * ## Reference Codec — Section Builders
 *
 * Section builder functions that transform extracted data into SectionBlock arrays.
 * Covers conventions, behaviors, business rules compact index, table of contents,
 * shapes, and boundary summary.
 */

import {
  type SectionBlock,
  type HeadingBlock,
  heading,
  paragraph,
  separator,
  table,
  code,
  list,
  mermaid,
  collapsible,
  linkOut,
} from '../schema.js';
import type { DetailLevel } from './types/base.js';
import type { ConventionBundle } from './convention-extractor.js';
import { parseBusinessRuleAnnotations, truncateText } from './helpers.js';
import type { DiagramScope } from './reference-types.js';
import type { ExtractedPattern } from '../../validation-schemas/extracted-pattern.js';
import type { ExtractedShape } from '../../validation-schemas/extracted-shape.js';
import { camelCaseToTitleCase, slugify } from '../../utils/string-utils.js';
import { getPatternName } from '../../api/pattern-helpers.js';
import type { PatternGraph } from '../../validation-schemas/pattern-graph.js';
import { collectScopePatterns } from './reference-diagrams.js';

// ============================================================================
// Convention Section Builder
// ============================================================================

/**
 * Build sections from convention bundles.
 */
export function buildConventionSections(
  conventions: readonly ConventionBundle[],
  detailLevel: DetailLevel
): SectionBlock[] {
  const sections: SectionBlock[] = [];

  for (const bundle of conventions) {
    if (bundle.rules.length === 0) continue;

    for (const rule of bundle.rules) {
      sections.push(heading(2, rule.ruleName));

      if (rule.invariant) {
        sections.push(paragraph(`**Invariant:** ${rule.invariant}`));
      }

      if (rule.narrative && detailLevel !== 'summary') {
        sections.push(paragraph(rule.narrative));
      }

      if (rule.rationale && detailLevel === 'detailed') {
        sections.push(paragraph(`**Rationale:** ${rule.rationale}`));
      }

      for (const tbl of rule.tables) {
        const rows = tbl.rows.map((row) => tbl.headers.map((h) => row[h] ?? ''));
        sections.push(table([...tbl.headers], rows));
      }

      if (rule.codeExamples !== undefined && detailLevel !== 'summary') {
        for (const example of rule.codeExamples) {
          if (example.type === 'code' && example.language === 'mermaid') {
            sections.push(mermaid(example.content));
          } else {
            sections.push(example);
          }
        }
      }

      if (rule.verifiedBy && rule.verifiedBy.length > 0 && detailLevel === 'detailed') {
        sections.push(paragraph(`**Verified by:** ${rule.verifiedBy.join(', ')}`));
      }

      sections.push(separator());
    }
  }

  return sections;
}

// ============================================================================
// Behavior Section Builder
// ============================================================================

/**
 * Build sections from a pre-filtered list of behavior patterns.
 *
 * DD-1 (CrossCuttingDocumentInclusion): Extracted from buildBehaviorSections to
 * accept pre-merged patterns (category-selected + include-tagged).
 */
export function buildBehaviorSectionsFromPatterns(
  patterns: readonly ExtractedPattern[],
  detailLevel: DetailLevel
): SectionBlock[] {
  const sections: SectionBlock[] = [];

  if (patterns.length === 0) return sections;

  sections.push(heading(2, 'Behavior Specifications'));

  for (const pattern of patterns) {
    sections.push(heading(3, pattern.name));

    // Cross-reference link to source file (omitted at summary level)
    if (detailLevel !== 'summary') {
      sections.push(linkOut(`View ${pattern.name} source`, pattern.source.file));
    }

    if (pattern.directive.description && detailLevel !== 'summary') {
      sections.push(paragraph(pattern.directive.description));
    }

    if (pattern.rules && pattern.rules.length > 0) {
      if (detailLevel === 'summary') {
        // Compact table with word-boundary-aware truncation
        const ruleRows = pattern.rules.map((r) => [
          r.name,
          r.description ? truncateText(r.description, 120) : '',
        ]);
        sections.push(table(['Rule', 'Description'], ruleRows));
      } else {
        // Structured per-rule rendering with parsed annotations
        // Wrap in collapsible blocks when 3+ rules for progressive disclosure
        const wrapInCollapsible = pattern.rules.length >= 3;

        for (const rule of pattern.rules) {
          const ruleBlocks: SectionBlock[] = [];
          ruleBlocks.push(heading(4, rule.name));
          const annotations = parseBusinessRuleAnnotations(rule.description);

          if (annotations.invariant) {
            ruleBlocks.push(paragraph(`**Invariant:** ${annotations.invariant}`));
          }

          if (annotations.rationale && detailLevel === 'detailed') {
            ruleBlocks.push(paragraph(`**Rationale:** ${annotations.rationale}`));
          }

          if (annotations.remainingContent) {
            ruleBlocks.push(paragraph(annotations.remainingContent));
          }

          if (annotations.codeExamples && detailLevel === 'detailed') {
            for (const example of annotations.codeExamples) {
              ruleBlocks.push(example);
            }
          }

          // Merged scenario names + verifiedBy as deduplicated list
          const names = new Set(rule.scenarioNames);
          if (annotations.verifiedBy) {
            for (const v of annotations.verifiedBy) {
              names.add(v);
            }
          }
          if (names.size > 0) {
            ruleBlocks.push(paragraph('**Verified by:**'));
            ruleBlocks.push(list([...names]));
          }

          if (wrapInCollapsible) {
            const scenarioCount = rule.scenarioNames.length;
            const summary =
              scenarioCount > 0 ? `${rule.name} (${scenarioCount} scenarios)` : rule.name;
            sections.push(collapsible(summary, ruleBlocks));
          } else {
            sections.push(...ruleBlocks);
          }
        }
      }
    }
  }

  sections.push(separator());
  return sections;
}

// ============================================================================
// Business Rules Compact Section Builder
// ============================================================================

/**
 * Build a compact business rules index section.
 *
 * Replaces the verbose Behavior Specifications in product area docs.
 * Groups rules by pattern, showing only rule name, invariant, and rationale.
 * Always renders open H3 headings with tables for immediate scannability.
 *
 * Detail level controls:
 * - summary: Section omitted entirely
 * - standard: Rules with invariants only; truncated to 150/120 chars
 * - detailed: All rules; full text, no truncation
 */
export function buildBusinessRulesCompactSection(
  patterns: readonly ExtractedPattern[],
  detailLevel: DetailLevel
): SectionBlock[] {
  if (detailLevel === 'summary') return [];

  const sections: SectionBlock[] = [];

  // Count totals for header (lightweight pass — no annotation parsing)
  let totalRules = 0;
  let totalInvariants = 0;

  for (const p of patterns) {
    if (p.rules === undefined) continue;
    for (const r of p.rules) {
      totalRules++;
      if (r.description.includes('**Invariant:**')) totalInvariants++;
    }
  }

  if (totalRules === 0) return sections;

  sections.push(heading(2, 'Business Rules'));
  sections.push(
    paragraph(
      `${String(patterns.length)} patterns, ` +
        `${String(totalInvariants)} rules with invariants ` +
        `(${String(totalRules)} total)`
    )
  );

  const isDetailed = detailLevel === 'detailed';
  const maxInvariant = isDetailed ? 0 : 150;
  const maxRationale = isDetailed ? 0 : 120;

  const sorted = [...patterns].sort((a, b) => a.name.localeCompare(b.name));

  for (const pattern of sorted) {
    if (pattern.rules === undefined) continue;

    const rows: string[][] = [];
    for (const rule of pattern.rules) {
      const ann = parseBusinessRuleAnnotations(rule.description);

      // At standard level, skip rules without invariant
      if (!isDetailed && ann.invariant === undefined) continue;

      const invariantText = ann.invariant ?? '';
      const rationaleText = ann.rationale ?? '';

      rows.push([
        rule.name,
        maxInvariant > 0 ? truncateText(invariantText, maxInvariant) : invariantText,
        maxRationale > 0 ? truncateText(rationaleText, maxRationale) : rationaleText,
      ]);
    }

    if (rows.length === 0) continue;

    sections.push(heading(3, camelCaseToTitleCase(pattern.name)));
    sections.push(table(['Rule', 'Invariant', 'Rationale'], rows));
  }

  sections.push(separator());
  return sections;
}

// ============================================================================
// Table of Contents Builder
// ============================================================================

/**
 * Build a table of contents from H2 headings in a sections array.
 *
 * DD-4 (GeneratedDocQuality): Product area docs can be 100+ KB with many
 * sections. A TOC at the top makes browser navigation practical. Only
 * generated when there are 3 or more H2 headings (below that, a TOC adds
 * noise without navigation value).
 */
export function buildTableOfContents(allSections: readonly SectionBlock[]): SectionBlock[] {
  const h2Headings = allSections.filter(
    (s): s is HeadingBlock => s.type === 'heading' && s.level === 2
  );
  if (h2Headings.length < 3) return [];

  const tocItems = h2Headings.map((h) => {
    const anchor = slugify(h.text);
    return `[${h.text}](#${anchor})`;
  });

  return [heading(2, 'Contents'), list(tocItems), separator()];
}

// ============================================================================
// Shape Section Builder
// ============================================================================

/**
 * Build sections from extracted TypeScript shapes.
 *
 * Composition order follows AD-5: conventions → shapes → behaviors.
 *
 * Detail level controls:
 * - summary: type name + kind table only (compact)
 * - standard: names + source text code blocks
 * - detailed: full source with JSDoc and property doc tables
 */
export function buildShapeSections(
  shapes: readonly ExtractedShape[],
  detailLevel: DetailLevel
): SectionBlock[] {
  const sections: SectionBlock[] = [];

  sections.push(heading(2, 'API Types'));

  if (detailLevel === 'summary') {
    // Summary: just a table of type names and kinds
    const rows = shapes.map((s) => [s.name, s.kind]);
    sections.push(table(['Type', 'Kind'], rows));
  } else {
    // Standard/Detailed: code blocks for each shape
    for (const shape of shapes) {
      sections.push(heading(3, `${shape.name} (${shape.kind})`));

      if (shape.jsDoc) {
        sections.push(code(shape.jsDoc, 'typescript'));
      }
      sections.push(code(shape.sourceText, 'typescript'));

      // Property docs table for interfaces at detailed level
      if (detailLevel === 'detailed' && shape.propertyDocs && shape.propertyDocs.length > 0) {
        const propRows = shape.propertyDocs.map((p) => [p.name, p.jsDoc]);
        sections.push(table(['Property', 'Description'], propRows));
      }

      // Param docs table for functions at standard and detailed levels
      if (shape.params && shape.params.length > 0) {
        const paramRows = shape.params.map((p) => [p.name, p.type ?? '', p.description]);
        sections.push(table(['Parameter', 'Type', 'Description'], paramRows));
      }

      // Returns and throws docs at detailed level only
      if (detailLevel === 'detailed') {
        if (shape.returns) {
          const returnText = shape.returns.type
            ? `**Returns** (\`${shape.returns.type}\`): ${shape.returns.description}`
            : `**Returns:** ${shape.returns.description}`;
          sections.push(paragraph(returnText));
        }

        if (shape.throws && shape.throws.length > 0) {
          const throwsRows = shape.throws.map((t) => [t.type ?? '', t.description]);
          sections.push(table(['Exception', 'Description'], throwsRows));
        }
      }
    }
  }

  sections.push(separator());
  return sections;
}

// ============================================================================
// Boundary Summary Builder
// ============================================================================

/**
 * Build a compact boundary summary paragraph from diagram scope data.
 *
 * Groups scope patterns by archContext and produces a text like:
 * **Components:** Scanner (PatternA, PatternB), Extractor (PatternC)
 *
 * Skips scopes with `source` override (hardcoded diagrams like fsm-lifecycle).
 * Returns undefined if no patterns found.
 */
export function buildBoundarySummary(
  dataset: PatternGraph,
  scopes: readonly DiagramScope[]
): SectionBlock | undefined {
  const allPatterns: ExtractedPattern[] = [];
  const seenNames = new Set<string>();

  for (const scope of scopes) {
    // Skip hardcoded source diagrams — they don't represent pattern boundaries
    if (scope.source !== undefined) continue;

    for (const pattern of collectScopePatterns(dataset, scope)) {
      const name = getPatternName(pattern);
      if (!seenNames.has(name)) {
        seenNames.add(name);
        allPatterns.push(pattern);
      }
    }
  }

  if (allPatterns.length === 0) return undefined;

  // Group by archContext
  const byContext = new Map<string, string[]>();
  for (const pattern of allPatterns) {
    const ctx = pattern.archContext ?? 'Other';
    const group = byContext.get(ctx) ?? [];
    group.push(getPatternName(pattern));
    byContext.set(ctx, group);
  }

  // Build compact text: "Context (A, B), Context (C)"
  const parts: string[] = [];
  for (const [context, names] of [...byContext.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    const label = context.charAt(0).toUpperCase() + context.slice(1);
    parts.push(`${label} (${names.join(', ')})`);
  }

  return paragraph(`**Components:** ${parts.join(', ')}`);
}
