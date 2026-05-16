/**
 * @architect
 * @architect-pattern PatternClassification
 * @architect-status active
 * @architect-role:utility
 * @architect-bounded-context:read-api
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
import type { ExtractedPattern } from '../validation-schemas/extracted-pattern.js';
import type { PatternGraph } from '../validation-schemas/pattern-graph.js';
import * as relationshipResolver from '../generators/pipeline/relationship-resolver.js';
import type { DeclaredPatternTarget } from '../generators/pipeline/relationship-resolver.js';

/**
 * Classification of a single relationship edge from `sourcePattern` to `reference`.
 *
 * - `internal` — target resolves to a pattern declared in the same package as the source.
 * - `external` — target resolves to a pattern declared in a different package's `src/`.
 * - `dangling` — target does not resolve to any declared pattern.
 *
 * The underlying resolution rules live in `resolveUsesTarget`; this wrapper exposes
 * them as a stable read-api surface for cross-package edge classification.
 */
export type EdgeExternality = 'internal' | 'external' | 'dangling';

const declaredPatternIndexCache = new WeakMap<
  PatternGraph,
  ReadonlyMap<string, readonly DeclaredPatternTarget[]>
>();

function getDeclaredPatternIndex(
  graph: PatternGraph
): ReadonlyMap<string, readonly DeclaredPatternTarget[]> {
  const cached = declaredPatternIndexCache.get(graph);
  if (cached !== undefined) return cached;

  const index = relationshipResolver.buildDeclaredPatternIndex(graph.patterns);
  declaredPatternIndexCache.set(graph, index);
  return index;
}

/**
 * Classify a `@architect-uses` (or other reference-shaped) edge.
 *
 * Re-exposes the existing cross-package machinery from
 * `generators/pipeline/relationship-resolver.ts` as a stable read-api surface.
 * Internal vs external is decided by comparing the inferred package id of
 * `sourcePattern.source.file` against the inferred package id of the resolved
 * target pattern's source file.
 */
export function classifyEdgeExternality(
  graph: PatternGraph,
  sourcePattern: ExtractedPattern,
  reference: string
): EdgeExternality {
  const declaredTargetsByName = getDeclaredPatternIndex(graph);
  const resolved = relationshipResolver.resolveUsesTarget(
    sourcePattern,
    reference,
    declaredTargetsByName
  );
  if (resolved === undefined) return 'dangling';

  const sourcePackageId = relationshipResolver.inferPackageId(sourcePattern.source.file);
  const targetPattern = graph.patterns.find((p) => (p.patternName ?? p.name) === resolved);
  if (targetPattern === undefined) return 'dangling';

  const targetPackageId = relationshipResolver.inferPackageId(targetPattern.source.file);
  return targetPackageId === sourcePackageId ? 'internal' : 'external';
}

export const buildDeclaredPatternIndex = relationshipResolver.buildDeclaredPatternIndex;
export const inferPackageId = relationshipResolver.inferPackageId;
export const resolveUsesTarget = relationshipResolver.resolveUsesTarget;

export type { DeclaredPatternTarget };
