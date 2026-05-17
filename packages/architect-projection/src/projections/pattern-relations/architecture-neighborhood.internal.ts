/**
 * @architect-bounded-context:pattern-relations
 */
/**
 * Builds the architectural neighborhood for one pattern, including relationships, peers, and implementation references.
 */

import type { ProjectionContext } from '../../context/projection-context.js';
import type { ImplementationRef } from '../../fragments/pattern-relations/supporting.js';

import {
  getPatternName,
  getRelationships,
  normalizeImplementationRef,
  requirePattern,
} from '../_shared/pattern-helpers.internal.js';

export function buildArchitectureNeighborhood(
  context: ProjectionContext,
  patternName: string
): {
  pattern: string;
  context: string | undefined;
  role: string | undefined;
  layer: string | undefined;
  uses: string[];
  usedBy: string[];
  dependsOn: string[];
  enables: string[];
  sameContext: string[];
  implements: string[];
  implementedBy: ImplementationRef[];
} {
  const pattern = requirePattern(context, patternName);
  const canonicalName = getPatternName(pattern);
  const relationships = getRelationships(context, canonicalName);

  const sameContext =
    pattern.boundedContext === undefined || context.graph.archIndex === undefined
      ? []
      : (context.graph.archIndex.byContext[pattern.boundedContext] ?? [])
          .map(getPatternName)
          .filter((name) => name !== canonicalName);

  return {
    pattern: canonicalName,
    context: pattern.boundedContext,
    role: pattern.role,
    layer: pattern.adrLayer,
    uses: [...(relationships?.uses ?? [])],
    usedBy: [...(relationships?.usedBy ?? [])],
    dependsOn: [...(relationships?.dependsOn ?? [])],
    enables: [...(relationships?.enables ?? [])],
    sameContext,
    implements: [...(relationships?.implementsPatterns ?? [])],
    implementedBy: (relationships?.implementedBy ?? []).map(normalizeImplementationRef),
  };
}
