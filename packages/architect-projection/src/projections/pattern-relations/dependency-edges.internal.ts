/**
 * @architect-bounded-context:pattern-relations
 */
/**
 * Private helpers used exclusively by the dependency-edges fragment.
 *
 * Part of the PatternRelationsProjectionSupport utility surface.
 */

import type { ProjectionContext } from '../../context/projection-context.js';
import type { DependencyRelationKind } from '../../fragments/pattern-relations/supporting.js';

import {
  getPatternName,
  normalizePatternRelationships,
  requirePattern,
} from '../_shared/pattern-helpers.internal.js';

export function projectOutgoingEdges(
  context: ProjectionContext,
  from: string
): {
  from: string;
  to: string;
  relationKind: DependencyRelationKind;
}[] {
  const patternName = getPatternName(requirePattern(context, from));
  const relationships = normalizePatternRelationships(context, patternName);
  const edges: { from: string; to: string; relationKind: DependencyRelationKind }[] = [];

  appendEdges(edges, patternName, relationships.dependsOn, 'depends-on');
  appendEdges(edges, patternName, relationships.uses, 'uses');
  appendEdges(edges, patternName, relationships.enables, 'enables');
  appendEdges(edges, patternName, relationships.implementsPatterns, 'implements');
  appendEdges(edges, patternName, relationships.seeAlso, 'see-also');
  appendEdges(edges, patternName, relationships.apiRef, 'api-ref');

  if (relationships.extendsPattern !== undefined) {
    edges.push({
      from: patternName,
      to: relationships.extendsPattern,
      relationKind: 'extends',
    });
  }

  return edges;
}

function appendEdges(
  edges: { from: string; to: string; relationKind: DependencyRelationKind }[],
  from: string,
  targets: readonly string[],
  relationKind: DependencyRelationKind
): void {
  for (const to of targets) {
    edges.push({ from, to, relationKind });
  }
}
