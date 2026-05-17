/**
 * @architect-bounded-context:pattern-relations
 */
/**
 * Builds the list of patterns that have no incoming or outgoing relationships in the current graph.
 */

import type { ProjectionContext } from '../../context/projection-context.js';
import type { OrphanPatternList } from '../../fragments/pattern-relations/index.js';

import { filterPatterns } from '../_shared/filter.js';
import {
  getPatternName,
  getRelationships,
  isDefined,
} from '../_shared/pattern-helpers.internal.js';

export function buildOrphanPatternList(context: ProjectionContext): OrphanPatternList {
  const items = filterPatterns(context.graph.patterns, context.projectionFilter)
    .map((pattern) => {
      const name = getPatternName(pattern);
      const relationships = getRelationships(context, name);
      const hasRelationships =
        relationships !== undefined &&
        (relationships.uses.length > 0 ||
          relationships.usedBy.length > 0 ||
          relationships.dependsOn.length > 0 ||
          relationships.enables.length > 0 ||
          relationships.implementsPatterns.length > 0 ||
          relationships.implementedBy.length > 0 ||
          relationships.extendedBy.length > 0 ||
          relationships.seeAlso.length > 0 ||
          relationships.extendsPattern !== undefined);

      if (hasRelationships) {
        return undefined;
      }

      return {
        pattern: name,
        status: pattern.status,
        file: pattern.source.file,
      };
    })
    .filter(isDefined)
    .sort((left, right) => left.pattern.localeCompare(right.pattern));

  return {
    kind: 'OrphanPatternList',
    items,
  };
}
