/**
 * @architect-bounded-context:pattern-relations
 */
/**
 * Builds the list of patterns that have no incoming or outgoing relationships in the current graph.
 *
 * Delegates orphan detection to the read-api kernel's `findOrphanPatterns`
 * (the single orphan predicate over all relation kinds), then applies the
 * projection's `projectionFilter` and name sort before wrapping the result as
 * an `OrphanPatternList` fragment.
 */

import { findOrphanPatterns } from '@libar-dev/architect-core';

import type { ProjectionContext } from '../../context/projection-context.js';
import type { OrphanPatternList } from '../../fragments/pattern-relations/index.js';

import { filterPatterns } from '../_shared/filter.js';
import { getPatternName } from '../_shared/pattern-helpers.internal.js';

export function buildOrphanPatternList(context: ProjectionContext): OrphanPatternList {
  const allowedNames = new Set(
    filterPatterns(context.graph.patterns, context.projectionFilter).map(getPatternName),
  );

  const items = findOrphanPatterns(context.graph)
    .filter((orphan) => allowedNames.has(orphan.pattern))
    .map((orphan) => ({
      pattern: orphan.pattern,
      ...(orphan.status !== undefined ? { status: orphan.status } : {}),
      file: orphan.file,
    }))
    .sort((left, right) => left.pattern.localeCompare(right.pattern));

  return {
    kind: 'OrphanPatternList',
    items,
  };
}
