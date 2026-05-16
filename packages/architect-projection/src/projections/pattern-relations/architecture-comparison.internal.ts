/**
 * @architect-bounded-context:pattern-relations
 */
/**
 * Private helpers used exclusively by the architecture-comparison fragment.
 *
 * Part of the PatternRelationsProjectionSupport utility surface.
 */

import type { ProjectionContext } from '../../context/projection-context.js';
import { ProjectionError } from '../errors.js';
import type { ArchitectureComparison } from '../../fragments/pattern-relations/index.js';

import { getPatternName, getRelationships } from '../_shared/pattern-helpers.internal.js';

export function buildArchitectureComparison(
  context: ProjectionContext,
  leftContext: string,
  rightContext: string
): ArchitectureComparison {
  const archIndex = context.graph.archIndex;
  const leftPatterns = archIndex?.byContext[leftContext];
  const rightPatterns = archIndex?.byContext[rightContext];

  if (leftPatterns === undefined || rightPatterns === undefined) {
    throw new ProjectionError(
      'BOUNDED_CONTEXT_NOT_FOUND',
      `Bounded context not found: ${leftContext} or ${rightContext}`
    );
  }

  const leftNames = leftPatterns
    .map(getPatternName)
    .sort((left, right) => left.localeCompare(right));
  const rightNames = rightPatterns
    .map(getPatternName)
    .sort((left, right) => left.localeCompare(right));
  const leftNameSet = new Set(leftNames);
  const rightNameSet = new Set(rightNames);

  const leftDependencies = collectContextDependencies(context, leftNames);
  const rightDependencies = collectContextDependencies(context, rightNames);
  const sharedDependencies = [...leftDependencies].filter((name) => rightDependencies.has(name));
  const uniqueToContext1 = [...leftDependencies].filter((name) => !rightDependencies.has(name));
  const uniqueToContext2 = [...rightDependencies].filter((name) => !leftDependencies.has(name));

  return {
    kind: 'ArchitectureComparison',
    context1: {
      name: leftContext,
      patternCount: leftPatterns.length,
      patterns: leftNames,
      allDependencies: [...leftDependencies].sort((left, right) => left.localeCompare(right)),
    },
    context2: {
      name: rightContext,
      patternCount: rightPatterns.length,
      patterns: rightNames,
      allDependencies: [...rightDependencies].sort((left, right) => left.localeCompare(right)),
    },
    sharedDependencies: sharedDependencies.sort((left, right) => left.localeCompare(right)),
    uniqueToContext1: uniqueToContext1.sort((left, right) => left.localeCompare(right)),
    uniqueToContext2: uniqueToContext2.sort((left, right) => left.localeCompare(right)),
    integrationPoints: [
      ...collectIntegrationPoints(context, leftNames, leftContext, rightNameSet, rightContext),
      ...collectIntegrationPoints(context, rightNames, rightContext, leftNameSet, leftContext),
    ].sort((left, right) => {
      const fromCompare = left.from.localeCompare(right.from);
      if (fromCompare !== 0) {
        return fromCompare;
      }

      const toCompare = left.to.localeCompare(right.to);
      if (toCompare !== 0) {
        return toCompare;
      }

      return left.relationship.localeCompare(right.relationship);
    }),
  };
}

function collectContextDependencies(
  context: ProjectionContext,
  patternNames: readonly string[]
): Set<string> {
  const dependencies = new Set<string>();

  for (const patternName of patternNames) {
    const relationships = getRelationships(context, patternName);
    if (relationships === undefined) {
      continue;
    }

    for (const dependency of relationships.uses) {
      dependencies.add(dependency);
    }

    for (const dependency of relationships.dependsOn) {
      dependencies.add(dependency);
    }
  }

  return dependencies;
}

function collectIntegrationPoints(
  context: ProjectionContext,
  patternNames: readonly string[],
  fromContext: string,
  targetPatternNames: ReadonlySet<string>,
  toContext: string
): ArchitectureComparison['integrationPoints'] {
  const points: ArchitectureComparison['integrationPoints'] = [];

  for (const patternName of patternNames) {
    const relationships = getRelationships(context, patternName);
    if (relationships === undefined) {
      continue;
    }

    for (const target of relationships.uses) {
      if (targetPatternNames.has(target)) {
        points.push({
          from: patternName,
          fromContext,
          to: target,
          toContext,
          relationship: 'uses',
        });
      }
    }

    for (const target of relationships.dependsOn) {
      if (targetPatternNames.has(target)) {
        points.push({
          from: patternName,
          fromContext,
          to: target,
          toContext,
          relationship: 'dependsOn',
        });
      }
    }
  }

  return points;
}
