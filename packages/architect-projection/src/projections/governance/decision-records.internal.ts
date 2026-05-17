/**
 * @architect-bounded-context:governance
 */
/**
 * Private helpers used exclusively by the decision-records fragment.
 *
 * Part of the GovernanceProjectionSupport utility surface.
 */

import type { ExtractedPattern } from '@libar-dev/architect-core';

import { code, list, paragraph, table, type Block } from '../../blocks/schema.js';
import type { ProjectionContext } from '../../context/projection-context.js';
import { ProjectionError } from '../errors.js';
import { type ProjectionBundle } from '../../fragments/base.js';
import { type DecisionCatalog, type DecisionRecord } from '../../fragments/governance/index.js';
import { filterPatterns } from '../_shared/filter.js';
import { createEntityRouteId, createIndexRouteId } from '../../routing/route-id.js';

import {
  getPatternName,
  normalizeAnnotationText,
  normalizeLineEndings,
  slugify,
} from './governance-shared.internal.js';

type DecisionType = DecisionRecord['type'];
type ExtractedRule = NonNullable<ExtractedPattern['rules']>[number];

interface DecisionSections {
  readonly context: Block[];
  readonly decision: Block[];
  readonly consequences: Block[];
  readonly alternatives: Block[];
}

interface PartitionedDecisionRules {
  readonly context: readonly ExtractedRule[];
  readonly decision: readonly ExtractedRule[];
  readonly consequences: readonly ExtractedRule[];
  readonly alternatives: readonly ExtractedRule[];
}

const DECISION_SECTION_PATTERN =
  /\*\*(Context|Decision|Consequences|Alternatives?):\*\*\s*([\s\S]*?)(?=\n\s*\*\*[A-Za-z][^*]*:\*\*|$)/gi;

export function buildDecisionRecord(context: ProjectionContext, id: string): DecisionRecord {
  return createDecisionRecord(requireDecisionPattern(context, id));
}

export function buildDecisionCatalog(
  context: ProjectionContext
): ProjectionBundle<DecisionCatalog> {
  const decisions = collectDecisionPatterns(context).map(createDecisionRecord);
  const root: DecisionCatalog = {
    kind: 'DecisionCatalog',
    decisions,
  };

  const children = Object.fromEntries(
    decisions.map((decision) => [slugify(decision.id), decision])
  );

  return {
    root,
    children,
    routing: {
      rootRouteId: createIndexRouteId('decisions'),
      childRouteIds: Object.fromEntries(
        Object.keys(children).map((key) => [key, createEntityRouteId('decisions', key)])
      ),
      childPathStrategy: 'nested',
      anchorStrategy: 'heading-slug',
    },
  };
}

function requireDecisionPattern(context: ProjectionContext, id: string): ExtractedPattern {
  const normalizedId = normalizeDecisionLookup(id);
  const matches = collectDecisionPatterns(context);
  const pattern = matches.find(
    (candidate) => normalizeDecisionLookup(getDecisionId(candidate)) === normalizedId
  );

  if (pattern !== undefined) {
    return pattern;
  }

  const available = matches.map((candidate) => getDecisionId(candidate)).join(', ');
  throw new ProjectionError(
    'DECISION_NOT_FOUND',
    `Decision not found: "${normalizeDecisionLookup(id)}".${available.length > 0 ? ` Available decisions: ${available}` : ''}`
  );
}

function collectDecisionPatterns(context: ProjectionContext): ExtractedPattern[] {
  return filterPatterns(context.graph.patterns, context.projectionFilter)
    .filter((pattern) => typeof pattern.adr === 'string' && pattern.adr.trim().length > 0)
    .sort(compareDecisionPatterns);
}

function createDecisionRecord(pattern: ExtractedPattern): DecisionRecord {
  const sections = extractDecisionSections(pattern);

  return {
    kind: 'DecisionRecord',
    id: getDecisionId(pattern),
    type: detectDecisionType(pattern),
    status: pattern.adrStatus ?? 'proposed',
    title: getDecisionTitle(pattern),
    context: sections.context,
    decision: sections.decision,
    consequences: sections.consequences,
    ...(sections.alternatives.length > 0 ? { alternatives: sections.alternatives } : {}),
    relatedDecisions: getRelatedDecisionIds(pattern),
    affectedPatterns: getAffectedPatterns(pattern),
  };
}

function extractDecisionSections(pattern: ExtractedPattern): DecisionSections {
  const sectionsFromDescription = parseDecisionSections(pattern.directive.description);
  const partitionedRules = partitionDecisionRules(pattern.rules ?? []);

  return {
    context: mergeDecisionBlocks(
      sectionsFromDescription.context,
      partitionedRules.context.flatMap((rule) => toBlocks(rule.description))
    ),
    decision: mergeDecisionBlocks(
      sectionsFromDescription.decision,
      partitionedRules.decision.flatMap((rule) => toBlocks(rule.description))
    ),
    consequences: mergeDecisionBlocks(
      sectionsFromDescription.consequences,
      partitionedRules.consequences.flatMap((rule) => toBlocks(rule.description))
    ),
    alternatives: mergeDecisionBlocks(
      sectionsFromDescription.alternatives,
      partitionedRules.alternatives.flatMap((rule) => toBlocks(rule.description))
    ),
  };
}

function parseDecisionSections(description: string): DecisionSections {
  const extracted: Record<'context' | 'decision' | 'consequences' | 'alternatives', Block[]> = {
    context: [],
    decision: [],
    consequences: [],
    alternatives: [],
  };

  for (const match of normalizeLineEndings(description).matchAll(DECISION_SECTION_PATTERN)) {
    const label = (match[1] ?? '').toLowerCase();
    const content = match[2] ?? '';

    if (label === 'context') {
      extracted.context = toBlocks(content);
    } else if (label === 'decision') {
      extracted.decision = toBlocks(content);
    } else if (label === 'consequences') {
      extracted.consequences = toBlocks(content);
    } else if (label === 'alternative' || label === 'alternatives') {
      extracted.alternatives = toBlocks(content);
    }
  }

  return extracted;
}

function partitionDecisionRules(rules: readonly ExtractedRule[]): PartitionedDecisionRules {
  const context: ExtractedRule[] = [];
  const decision: ExtractedRule[] = [];
  const consequences: ExtractedRule[] = [];
  const alternatives: ExtractedRule[] = [];

  for (const rule of rules) {
    const normalizedName = rule.name.toLowerCase();
    if (normalizedName.startsWith('context')) {
      context.push(rule);
    } else if (normalizedName.startsWith('decision')) {
      decision.push(rule);
    } else if (normalizedName.startsWith('consequence')) {
      consequences.push(rule);
    } else if (normalizedName.startsWith('alternative')) {
      alternatives.push(rule);
    }
  }

  return { context, decision, consequences, alternatives };
}

function mergeDecisionBlocks(primary: readonly Block[], secondary: readonly Block[]): Block[] {
  if (primary.length === 0) {
    return [...secondary];
  }
  if (secondary.length === 0) {
    return [...primary];
  }

  return [...primary, paragraph('Additional rule detail:'), ...secondary];
}

function getDecisionId(pattern: ExtractedPattern): string {
  const rawId = pattern.adr?.trim() ?? '';
  return `${detectDecisionType(pattern)}-${padDecisionNumber(rawId)}`;
}

function getDecisionTitle(pattern: ExtractedPattern): string {
  const explicitTitle = pattern.title?.trim();
  if (explicitTitle) {
    return explicitTitle;
  }

  const raw = getPatternName(pattern).replace(/^(ADR|PDR|DDR|TDR)[-_ ]?\d+[-_ ]?/i, '');
  const withSpaces = raw
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .trim();

  return withSpaces.length > 0 ? withSpaces : getPatternName(pattern);
}

function detectDecisionType(pattern: ExtractedPattern): DecisionType {
  const fileName = pattern.source.file.split('/').at(-1)?.toLowerCase() ?? '';
  if (fileName.startsWith('pdr-')) return 'PDR';
  if (fileName.startsWith('ddr-')) return 'DDR';
  if (fileName.startsWith('tdr-')) return 'TDR';

  const patternName = getPatternName(pattern).toUpperCase();
  if (patternName.startsWith('PDR')) return 'PDR';
  if (patternName.startsWith('DDR')) return 'DDR';
  if (patternName.startsWith('TDR')) return 'TDR';

  return 'ADR';
}

function getRelatedDecisionIds(pattern: ExtractedPattern): string[] {
  const type = detectDecisionType(pattern);
  return [pattern.adrSupersedes, pattern.adrSupersededBy]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => `${type}-${padDecisionNumber(value)}`)
    .filter((value, index, collection) => collection.indexOf(value) === index);
}

function getAffectedPatterns(pattern: ExtractedPattern): string[] {
  const values = [
    ...(pattern.uses ?? []),
    ...(pattern.implementsPatterns ?? []),
    ...(pattern.seeAlso ?? []),
    ...(pattern.apiRef ?? []),
    ...(pattern.extendsPattern !== undefined ? [pattern.extendsPattern] : []),
  ];

  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function compareDecisionPatterns(left: ExtractedPattern, right: ExtractedPattern): number {
  const typeComparison = detectDecisionType(left).localeCompare(detectDecisionType(right));
  if (typeComparison !== 0) {
    return typeComparison;
  }

  return getDecisionId(left).localeCompare(getDecisionId(right), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

function normalizeDecisionLookup(id: string): string {
  const trimmed = id.trim().toUpperCase();
  const match = /^(ADR|PDR|DDR|TDR)?[- ]?(\d+)$/.exec(trimmed.replace(/\s+/g, '-'));
  if (match?.[2] !== undefined) {
    const type = match[1] ?? 'ADR';
    return `${type}-${padDecisionNumber(match[2])}`;
  }

  return trimmed.replace(/\s+/g, '-');
}

function padDecisionNumber(value: string): string {
  const digits = value.replace(/\D+/g, '');
  return digits.length === 0 ? value.trim() : digits.padStart(3, '0');
}

function toBlocks(text: string): Block[] {
  const normalized = normalizeLineEndings(text).trim();
  if (normalized.length === 0) {
    return [];
  }

  const blocks: Block[] = [];
  const pattern = /```(\w*)\n([\s\S]*?)```|"""(\w*)\n([\s\S]*?)"""/g;
  let lastIndex = 0;

  for (const match of normalized.matchAll(pattern)) {
    const index = match.index;
    const before = normalized.slice(lastIndex, index);
    blocks.push(...parseTextBlocks(before));

    const language =
      match[1] !== undefined && match[1] !== ''
        ? match[1]
        : match[3] !== undefined && match[3] !== ''
          ? match[3]
          : undefined;
    const content = (match[2] ?? match[4] ?? '').trim();
    if (content.length > 0) {
      blocks.push(code(content, language));
    }
    lastIndex = index + match[0].length;
  }

  blocks.push(...parseTextBlocks(normalized.slice(lastIndex)));
  return blocks;
}

function parseTextBlocks(text: string): Block[] {
  const chunks = text
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);

  return chunks.flatMap((chunk) => {
    const lines = chunk
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (lines.length === 0) {
      return [];
    }

    if (lines.every((line) => line.startsWith('|'))) {
      return [parseMarkdownTable(lines)];
    }

    if (lines.every((line) => /^(?:[-*]|\d+\.)\s+/.test(line))) {
      return [
        list(
          lines.map((line) => line.replace(/^(?:[-*]|\d+\.)\s+/, '').trim()),
          lines.every((line) => /^\d+\.\s+/.test(line))
        ),
      ];
    }

    return [paragraph(normalizeAnnotationText(chunk))];
  });
}

function parseMarkdownTable(lines: readonly string[]): Block {
  const rows = lines.map(parseTableRow);
  const header = rows[0] ?? [];
  const body =
    rows.length > 1 && rows[1]?.every((cell) => /^:?-{3,}:?$/.test(cell))
      ? rows.slice(2)
      : rows.slice(1);

  return table(header, body);
}

function parseTableRow(line: string): string[] {
  return line
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}
