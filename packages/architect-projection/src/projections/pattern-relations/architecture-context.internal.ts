/**
 * @architect-bounded-context:pattern-relations
 */
/**
 * Builds bounded-context catalog entries with per-context pattern counts, layers, and roles.
 */

import type { ExtractedPattern } from '@libar-dev/architect-core';

import type { ProjectionContext } from '../../context/projection-context.js';
import { ProjectionError } from '../errors.js';
import type { BoundedContext } from '../../fragments/pattern-relations/index.js';

import {
  getPatternName,
  isDefined,
  uniqueSortedStrings,
} from '../_shared/pattern-helpers.internal.js';

export function buildBoundedContext(context: ProjectionContext, scope?: string): BoundedContext {
  const contexts = context.graph.archIndex?.byContext ?? {};
  const layersByPattern = buildLayersByPatternName(context.graph.archIndex?.byLayer ?? {});
  const entries = Object.entries(contexts)
    .map(([name, patterns]) => {
      const patternNames = patterns
        .map(getPatternName)
        .sort((left, right) => left.localeCompare(right));

      return {
        name,
        patternCount: patterns.length,
        patterns: patternNames,
        layers: uniqueSortedStrings(
          patternNames
            .flatMap((patternName) => layersByPattern.get(patternName) ?? [])
            .filter(isDefined)
        ),
        roles: uniqueSortedStrings(patterns.map((pattern) => pattern.role).filter(isDefined)),
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  if (scope !== undefined) {
    const scopedEntry = entries.find((entry) => entry.name.toLowerCase() === scope.toLowerCase());
    if (scopedEntry === undefined) {
      throw new ProjectionError('BOUNDED_CONTEXT_NOT_FOUND', `Bounded context not found: ${scope}`);
    }

    return {
      kind: 'BoundedContext',
      scope: scopedEntry.name,
      entries: [scopedEntry],
    };
  }

  return {
    kind: 'BoundedContext',
    entries,
  };
}

function buildLayersByPatternName(
  patternsByLayer: Record<string, readonly ExtractedPattern[]>
): Map<string, string[]> {
  const layersByPattern = new Map<string, Set<string>>();

  for (const [layer, layerPatterns] of Object.entries(patternsByLayer)) {
    for (const pattern of layerPatterns) {
      const patternName = getPatternName(pattern);
      const layers = layersByPattern.get(patternName) ?? new Set<string>();
      layers.add(layer);
      layersByPattern.set(patternName, layers);
    }
  }

  return new Map(
    [...layersByPattern.entries()].map(([patternName, layers]) => [
      patternName,
      uniqueSortedStrings([...layers]),
    ])
  );
}
