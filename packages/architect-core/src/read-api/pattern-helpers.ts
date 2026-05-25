/**
 * @architect
 * @architect-pattern PatternHelpers
 * @architect-status active
 * @architect-role:utility
 * @architect-bounded-context:read-api
 * @architect-uses ExtractedPattern, PatternGraph
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
import type { ExtractedPattern } from '../validation-schemas/extracted-pattern.js';
import type {
  PatternGraph,
  PatternParseFailure,
  RelationshipEntry,
} from '../validation-schemas/pattern-graph.js';
import { resolveCanonicalRole as resolveTagRegistryRole } from '../validation-schemas/tag-registry.js';
import { findBestMatch } from '../utils/fuzzy-match.js';

type RegistryRoleDefinition = NonNullable<PatternGraph['tagRegistry']['roles']>[number];

const lowercaseNameIndexCache = new WeakMap<PatternGraph, ReadonlyMap<string, ExtractedPattern>>();

function createMissingCanonicalRelationshipEntryError(patternName: string): Error {
  return new Error(
    `PatternGraphAPI invariant violated: canonical relationship entry missing for pattern ${patternName}`,
  );
}

function resolveIndexedEntry<T>(
  dataset: PatternGraph,
  index: Readonly<Record<string, T>>,
  name: string,
): T | undefined {
  const exact = index[name];
  if (exact !== undefined) return exact;

  const pattern = findPatternByName(dataset.patterns, name);
  if (pattern !== undefined) {
    const canonicalEntry = index[getPatternName(pattern)];
    if (canonicalEntry !== undefined) return canonicalEntry;
  }

  const lower = name.toLowerCase();
  for (const [key, value] of Object.entries(index)) {
    if (key.toLowerCase() === lower) return value;
  }

  return undefined;
}

function getLowercaseNameIndex(dataset: PatternGraph): ReadonlyMap<string, ExtractedPattern> {
  const cachedIndex = lowercaseNameIndexCache.get(dataset);
  if (cachedIndex !== undefined) return cachedIndex;

  const index = new Map<string, ExtractedPattern>();
  for (const pattern of dataset.patterns) {
    const key = getPatternName(pattern).toLowerCase();
    if (!index.has(key)) {
      index.set(key, pattern);
    }
  }

  lowercaseNameIndexCache.set(dataset, index);
  return index;
}

export function getPatternName(p: ExtractedPattern): string {
  return p.patternName ?? p.name;
}

function isPatternArray(
  source: PatternGraph | readonly ExtractedPattern[],
): source is readonly ExtractedPattern[] {
  return Array.isArray(source);
}

export function findPatternByName(
  source: PatternGraph | readonly ExtractedPattern[],
  name: string,
): ExtractedPattern | undefined {
  const lower = name.toLowerCase();
  if (isPatternArray(source)) {
    return source.find((p) => getPatternName(p).toLowerCase() === lower);
  }
  return getLowercaseNameIndex(source).get(lower);
}

export function findPatternParseFailure(
  dataset: PatternGraph,
  name: string,
): PatternParseFailure | undefined {
  const lower = name.toLowerCase();
  return dataset.featureParseFailures?.find(
    (failure) => failure.patternName.toLowerCase() === lower,
  );
}

export function getCanonicalRelationshipIndex(
  dataset: PatternGraph,
): Readonly<Record<string, RelationshipEntry>> {
  return dataset.relationshipIndex;
}

export function getRelationshipsForPattern(
  dataset: PatternGraph,
  pattern: ExtractedPattern,
): RelationshipEntry {
  const patternName = getPatternName(pattern);
  const entry = resolveIndexedEntry(dataset, getCanonicalRelationshipIndex(dataset), patternName);
  if (entry !== undefined) return entry;
  throw createMissingCanonicalRelationshipEntryError(patternName);
}

export function getRelationships(
  dataset: PatternGraph,
  name: string,
): RelationshipEntry | undefined {
  const pattern = findPatternByName(dataset.patterns, name);
  if (pattern === undefined) return undefined;
  return getRelationshipsForPattern(dataset, pattern);
}

export function allPatternNames(dataset: PatternGraph): readonly string[] {
  return dataset.patterns.map((p) => getPatternName(p));
}

export function resolveRoleDefinition(
  dataset: PatternGraph,
  role: string,
): RegistryRoleDefinition | undefined {
  const normalizedRole = role.toLowerCase();
  return dataset.tagRegistry.roles.find(
    (definition) =>
      definition.tag === normalizedRole || definition.aliases?.includes(normalizedRole) === true,
  );
}

export function resolveCanonicalRole(dataset: PatternGraph, role: string): string | undefined {
  return resolveTagRegistryRole(dataset.tagRegistry, role);
}

export function suggestPattern(query: string, candidates: readonly string[]): string {
  const best = findBestMatch(query, candidates);
  return best !== undefined ? ` Did you mean: ${best.patternName}?` : '';
}

export function firstImplements(pattern: ExtractedPattern): string | undefined {
  return pattern.implementsPatterns?.[0];
}
