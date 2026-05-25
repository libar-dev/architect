/**
 * @architect
 * @architect-pattern PatternRelationsProjectionSupport
 * @architect-status completed
 * @architect-role:utility
 * @architect-uses PatternRelationsFragmentContracts, ExtractedPattern, PatternGraph
 * @architect-bounded-context:projection
 *
 * ## Pattern relations projection support
 *
 * Shared pure helpers that normalize PatternGraph data into pattern-relations
 * fragment contracts without leaking legacy query DTOs. Every pattern-relations
 * fragment consumes this kernel, and so do the neighboring subdomains
 * (execution-context, documentation-composition, delivery-reporting,
 * operational-insights, governance). Fragment-specific helpers live next to
 * each fragment in `<fragment>.internal.ts`.
 *
 * **Value:** Provides the single pure-function kernel that every projection
 * uses to turn raw graph data into stable fragment shapes, so consumers
 * never see PatternGraph DTOs and every subdomain shares identical
 * resolution, normalization, and fuzzy-match behaviour.
 *
 * **Invariant:** Pattern lookup is case-insensitive and falls back through
 * exact, canonical-name, and lowercased-key matches; unknown names throw
 * `PATTERN_NOT_FOUND` with a fuzzy suggestion bounded by a minimum similarity
 * score and a maximum Levenshtein distance; relationship normalization falls
 * back to raw pattern arrays when the relationship index is absent; and
 * `ImplementationRef` objects are always emitted in a stable shape.
 *
 * **Behavior:**
 * - Exposes `requirePattern`, `getRelationships`, `createPatternSummaryFragment`,
 *   `normalizePatternRelationships`, `normalizeDeliverables`, `normalizeRules`,
 *   `resolveStubRefs`, `extractDescription`, and `normalizeImplementationRef`
 *   as the canonical helpers every projection composes.
 * - Parses `**Invariant:**`, `**Rationale:**`, and `**Verified by:**` blocks
 *   out of rule descriptions to populate `EmbeddedRuleRef` fields, while
 *   deduplicating scenario names against the declared `verifiedBy` list.
 * - Derives `source` from the pattern's file extension (`.feature` → `gherkin`,
 *   otherwise `typescript`) and treats any `implementedBy` entry whose file
 *   lives under `/stubs/` as a stub reference.
 *
 * ### When to Use
 *
 * - Provides shared pattern lookup, summary, relationship, deliverable, and
 *   rule normalization helpers.
 */

import {
  findPatternByName,
  inferMaturity,
  type ExtractedPattern,
  type PatternGraph,
  type RelationshipEntry,
} from '@libar-dev/architect-core';

import type { ProjectionContext } from '../../context/projection-context.js';
import { ProjectionError } from '../errors.js';
import type { PatternSummary } from '../../fragments/pattern-relations/pattern-summary.js';
import type {
  EmbeddedDeliverable,
  EmbeddedRuleRef,
  ImplementationRef,
  PatternHierarchy,
  PatternRelationships,
  PatternSource,
  StubRef,
} from '../../fragments/pattern-relations/supporting.js';

interface FuzzyMatch {
  readonly patternName: string;
  readonly score: number;
}

const MIN_SCORE_THRESHOLD = 0.3;
const MAX_LEVENSHTEIN_DISTANCE = 3;

export function getPatternName(pattern: ExtractedPattern): string {
  return pattern.patternName ?? pattern.name;
}

export function deriveSource(filePath: string): PatternSource {
  return filePath.endsWith('.feature') ? 'gherkin' : 'typescript';
}

export function requirePattern(context: ProjectionContext, name: string): ExtractedPattern {
  const pattern = findPatternByName(context.graph, name);
  if (pattern !== undefined) {
    return pattern;
  }

  const suggestion = suggestPattern(name, context.graph.patterns.map(getPatternName));
  throw new ProjectionError('PATTERN_NOT_FOUND', `Pattern not found: "${name}"${suggestion}`);
}

export function getRelationships(
  context: ProjectionContext,
  name: string,
): RelationshipEntry | undefined {
  return resolveIndexedEntry(context.graph, context.graph.relationshipIndex, name);
}

export function createPatternSummaryFragment(pattern: ExtractedPattern): PatternSummary {
  const summary: PatternSummary = {
    kind: 'PatternSummary',
    patternName: getPatternName(pattern),
    status: pattern.status,
    maturity: inferMaturity(pattern.status),
    role: pattern.role ?? '',
    file: pattern.source.file,
    source: deriveSource(pattern.source.file),
    ...(pattern.phase !== undefined ? { phase: pattern.phase } : {}),
  };

  return summary;
}

export function normalizePatternRelationships(
  context: ProjectionContext,
  patternName: string,
): PatternRelationships {
  const pattern = requirePattern(context, patternName);
  const relationships = getRelationships(context, patternName);

  if (relationships === undefined) {
    return {
      dependsOn: [...(pattern.uses ?? [])],
      enables: [],
      uses: [...(pattern.uses ?? [])],
      usedBy: [],
      implementsPatterns: [...(pattern.implementsPatterns ?? [])],
      implementedBy: [],
      ...(pattern.extendsPattern !== undefined ? { extendsPattern: pattern.extendsPattern } : {}),
      extendedBy: [],
      seeAlso: [...(pattern.seeAlso ?? [])],
      apiRef: [...(pattern.apiRef ?? [])],
    };
  }

  return {
    dependsOn: [...relationships.dependsOn],
    enables: [...relationships.enables],
    uses: [...relationships.uses],
    usedBy: [...relationships.usedBy],
    implementsPatterns: [...relationships.implementsPatterns],
    implementedBy: relationships.implementedBy.map(normalizeImplementationRef),
    ...(relationships.extendsPattern !== undefined
      ? { extendsPattern: relationships.extendsPattern }
      : {}),
    extendedBy: [...relationships.extendedBy],
    seeAlso: [...relationships.seeAlso],
    apiRef: [...relationships.apiRef],
  };
}

export function normalizeDeliverables(pattern: ExtractedPattern): EmbeddedDeliverable[] {
  const testRefs = resolveTestRefs(pattern);

  return (pattern.deliverables ?? []).map((deliverable) => ({
    name: deliverable.name,
    status: deliverable.status,
    tests: [...testRefs],
    location: deliverable.location,
    ...(deliverable.finding !== undefined ? { finding: deliverable.finding } : {}),
    ...(deliverable.release !== undefined ? { release: deliverable.release } : {}),
  }));
}

export function buildPatternHierarchy(pattern: ExtractedPattern): PatternHierarchy | undefined {
  const hasHierarchy =
    pattern.level !== undefined ||
    pattern.parent !== undefined ||
    (pattern.children !== undefined && pattern.children.length > 0);

  if (!hasHierarchy) {
    return undefined;
  }

  return {
    ...(pattern.level !== undefined ? { level: pattern.level } : {}),
    ...(pattern.parent !== undefined ? { parent: pattern.parent } : {}),
    members: [...(pattern.children ?? [])],
  };
}

export function normalizeRules(pattern: ExtractedPattern): EmbeddedRuleRef[] {
  return (pattern.rules ?? []).map((rule) => {
    const annotations = parseBusinessRuleAnnotations(rule.description);

    return {
      name: rule.name,
      ...(annotations.invariant !== undefined ? { invariant: annotations.invariant } : {}),
      ...(annotations.rationale !== undefined ? { rationale: annotations.rationale } : {}),
      verifiedBy: deduplicateScenarioNames(rule.scenarioNames, annotations.verifiedBy),
      scenarioCount: rule.scenarioCount,
    };
  });
}

export function resolveStubRefs(context: ProjectionContext, patternName: string): StubRef[] {
  const relationships = getRelationships(context, patternName);
  if (relationships === undefined) {
    return [];
  }

  return relationships.implementedBy
    .filter((reference) => reference.file.includes('/stubs/'))
    .map((reference) => ({
      stubFile: reference.file,
      targetPath: findPatternByName(context.graph, reference.name)?.targetPath ?? '',
      name: reference.name,
    }));
}

export function extractDescription(text: string): string {
  if (!text) {
    return '';
  }

  const problemMatch = /\*\*Problem:\*\*\s*([\s\S]+?)(?=\*\*Solution:\*\*|$)/.exec(text);
  const solutionMatch = /\*\*Solution:\*\*\s*([\s\S]+?)(?=\n\s*\*\*[A-Z]|\n\n\s*\n|$)/.exec(text);

  if (problemMatch?.[1] !== undefined && solutionMatch?.[1] !== undefined) {
    const problem = extractFirstSentenceRaw(problemMatch[1].trim());
    const solution = extractFirstSentenceRaw(solutionMatch[1].trim());
    return `Problem: ${problem} Solution: ${solution}`;
  }

  return extractFirstSentenceRaw(text);
}

export function extractOpenQuestions(text: string): string[] {
  if (!text) {
    return [];
  }

  const match = /\*\*Open Questions:\*\*\s*([\s\S]*?)(?=\n\s*\*\*[A-Za-z][^*]*:\*\*|$)/i.exec(text);
  const rawSection = match?.[1]?.trim();
  if (rawSection === undefined || rawSection.length === 0) {
    return [];
  }

  return rawSection
    .split('\n')
    .map((line) =>
      line
        .trim()
        .replace(/^[-*]\s+/, '')
        .replace(/^\d+[.)]\s+/, '')
        .trim(),
    )
    .filter((line) => line.length > 0);
}

export function normalizeImplementationRef(reference: {
  name: string;
  file: string;
  description?: string | undefined;
}): ImplementationRef {
  return {
    name: reference.name,
    file: reference.file,
    ...(reference.description !== undefined ? { description: reference.description } : {}),
  };
}

export function uniqueSortedStrings(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

function extractFirstSentenceRaw(text: string): string {
  if (!text) {
    return '';
  }

  const sentenceEndPattern = /[.!?](?=\s+[A-Z]|\s*$)/;
  const match = sentenceEndPattern.exec(text);
  if (match) {
    return text.slice(0, match.index + 1).trim();
  }

  return text.trim();
}

function resolveIndexedEntry<T>(
  graph: PatternGraph,
  index: Readonly<Record<string, T>> | undefined,
  name: string,
): T | undefined {
  if (index === undefined) {
    return undefined;
  }

  const exact = index[name];
  if (exact !== undefined) {
    return exact;
  }

  const pattern = findPatternByName(graph, name);
  if (pattern !== undefined) {
    const canonicalEntry = index[getPatternName(pattern)];
    if (canonicalEntry !== undefined) {
      return canonicalEntry;
    }
  }

  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(index)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }

  return undefined;
}

function resolveTestRefs(pattern: ExtractedPattern): string[] {
  if (pattern.executableSpecs !== undefined && pattern.executableSpecs.length > 0) {
    return [...pattern.executableSpecs];
  }

  if (pattern.behaviorFile !== undefined) {
    return [pattern.behaviorFile];
  }

  const declaredCount = Math.max(
    ...(pattern.deliverables ?? []).map((deliverable) => deliverable.tests),
    0,
  );
  const declaredCountLabel = String(declaredCount);

  return declaredCount > 0
    ? [`${declaredCountLabel} documented test${declaredCount === 1 ? '' : 's'}`]
    : [];
}

function normalizeAnnotationText(value: string): string {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(' ')
    .trim();
}

function parseBusinessRuleAnnotations(description: string): {
  invariant?: string;
  rationale?: string;
  verifiedBy?: string[];
} {
  if (!description || description.trim().length === 0) {
    return {};
  }

  const annotations: {
    invariant?: string;
    rationale?: string;
    verifiedBy?: string[];
  } = {};
  const pattern =
    /\*\*(Invariant|Rationale|Verified by):\*\*\s*([\s\S]*?)(?=\n\s*\*\*[A-Za-z][^*]*:\*\*|$)/gi;

  for (const match of description.matchAll(pattern)) {
    const label = match[1]?.toLowerCase();
    const rawValue = match[2] ?? '';

    if (label === undefined) {
      continue;
    }

    if (label === 'verified by') {
      const verifiedBy = rawValue
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

      if (verifiedBy.length > 0) {
        annotations.verifiedBy = verifiedBy;
      }

      continue;
    }

    const normalizedValue = normalizeAnnotationText(rawValue);
    if (!normalizedValue) {
      continue;
    }

    if (label === 'invariant') {
      annotations.invariant = normalizedValue;
    } else if (label === 'rationale') {
      annotations.rationale = normalizedValue;
    }
  }

  return annotations;
}

function deduplicateScenarioNames(
  scenarioNames: readonly string[],
  verifiedBy: readonly string[] | undefined,
): string[] {
  const seen = new Map<string, string>();

  for (const name of scenarioNames) {
    const key = name.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.set(key, name);
    }
  }

  if (verifiedBy !== undefined) {
    for (const name of verifiedBy) {
      const key = name.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.set(key, name);
      }
    }
  }

  return [...seen.values()];
}

function suggestPattern(query: string, candidates: readonly string[]): string {
  const bestMatch = findBestMatch(query, candidates);
  return bestMatch !== undefined ? `\nDid you mean: ${bestMatch.patternName}?` : '';
}

function findBestMatch(query: string, patternNames: readonly string[]): FuzzyMatch | undefined {
  const matches: FuzzyMatch[] = [];

  for (const patternName of patternNames) {
    const score = scoreMatch(query, patternName);
    if (score !== undefined) {
      matches.push({ patternName, score });
    }
  }

  matches.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    if (left.patternName.length !== right.patternName.length) {
      return left.patternName.length - right.patternName.length;
    }

    return left.patternName.localeCompare(right.patternName);
  });

  return matches[0];
}

function scoreMatch(query: string, patternName: string): number | undefined {
  const queryLower = query.toLowerCase();
  const nameLower = patternName.toLowerCase();

  if (queryLower === nameLower) {
    return 1;
  }

  if (nameLower.startsWith(queryLower)) {
    const coverage = queryLower.length / nameLower.length;
    return Math.min(0.9 + coverage * 0.09, 0.99);
  }

  if (nameLower.includes(queryLower)) {
    return 0.7;
  }

  const distance = levenshteinDistance(queryLower, nameLower);
  if (distance > MAX_LEVENSHTEIN_DISTANCE) {
    return undefined;
  }

  const maxLength = Math.max(queryLower.length, nameLower.length);
  const score = maxLength > 0 ? 1 - distance / maxLength : 0;
  return score >= MIN_SCORE_THRESHOLD ? score : undefined;
}

function levenshteinDistance(left: string, right: string): number {
  const leftLength = left.length;
  const rightLength = right.length;

  if (leftLength === 0) {
    return rightLength;
  }

  if (rightLength === 0) {
    return leftLength;
  }

  let previousRow = Array.from({ length: rightLength + 1 }, (_, index) => index);
  let currentRow = new Array<number>(rightLength + 1);

  for (let leftIndex = 1; leftIndex <= leftLength; leftIndex += 1) {
    currentRow[0] = leftIndex;

    for (let rightIndex = 1; rightIndex <= rightLength; rightIndex += 1) {
      const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      const deletion = (previousRow[rightIndex] ?? 0) + 1;
      const insertion = (currentRow[rightIndex - 1] ?? 0) + 1;
      const substitution = (previousRow[rightIndex - 1] ?? 0) + cost;
      currentRow[rightIndex] = Math.min(deletion, insertion, substitution);
    }

    [previousRow, currentRow] = [currentRow, previousRow];
  }

  return previousRow[rightLength] ?? 0;
}
