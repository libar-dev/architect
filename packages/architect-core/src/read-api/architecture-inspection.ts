/**
 * @architect
 * @architect-pattern ArchitectureInspection
 * @architect-status active
 * @architect-role:utility
 * @architect-bounded-context:read-api
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
import type { ExtractedPattern } from '../validation-schemas/extracted-pattern.js';
import type { ArchIndex, PatternGraph } from '../validation-schemas/pattern-graph.js';
import type { NeighborEntry } from './types.js';
import {
  getPatternName,
  findPatternByName,
  getRelationships,
  getRelationshipsForPattern,
} from './pattern-helpers.js';

function resolveNeighborEntry(patterns: readonly ExtractedPattern[], name: string): NeighborEntry {
  const pattern = findPatternByName(patterns, name);
  return {
    name,
    status: pattern?.status,
    role: pattern?.role,
    archContext: pattern?.boundedContext,
    file: pattern?.source.file,
  };
}

export interface NeighborhoodResult {
  readonly pattern: string;
  readonly context: string | undefined;
  readonly role: string | undefined;
  readonly layer: string | undefined;
  readonly uses: readonly NeighborEntry[];
  readonly usedBy: readonly NeighborEntry[];
  readonly dependsOn: readonly NeighborEntry[];
  readonly enables: readonly NeighborEntry[];
  readonly sameContext: readonly NeighborEntry[];
  readonly implements: readonly string[];
  readonly implementedBy: readonly string[];
}

export interface ContextSummary {
  readonly name: string;
  readonly patternCount: number;
  readonly patterns: readonly string[];
  readonly allDependencies: readonly string[];
}

export interface IntegrationPoint {
  readonly from: string;
  readonly fromContext: string;
  readonly to: string;
  readonly toContext: string;
  readonly relationship: string;
}

export interface ContextComparison {
  readonly context1: ContextSummary;
  readonly context2: ContextSummary;
  readonly sharedDependencies: readonly string[];
  readonly uniqueToContext1: readonly string[];
  readonly uniqueToContext2: readonly string[];
  readonly integrationPoints: readonly IntegrationPoint[];
}

export function computeNeighborhood(
  name: string,
  dataset: PatternGraph,
): NeighborhoodResult | undefined {
  const pattern = findPatternByName(dataset.patterns, name);
  if (pattern === undefined) {
    return undefined;
  }

  const patternName = getPatternName(pattern);
  const relationships = getRelationships(dataset, patternName);

  const uses = (relationships?.uses ?? []).map((entry) =>
    resolveNeighborEntry(dataset.patterns, entry),
  );
  const usedBy = (relationships?.usedBy ?? []).map((entry) =>
    resolveNeighborEntry(dataset.patterns, entry),
  );
  const dependsOn = (relationships?.dependsOn ?? []).map((entry) =>
    resolveNeighborEntry(dataset.patterns, entry),
  );
  const enables = (relationships?.enables ?? []).map((entry) =>
    resolveNeighborEntry(dataset.patterns, entry),
  );

  const sameContext: NeighborEntry[] = [];
  if (pattern.boundedContext !== undefined && dataset.archIndex !== undefined) {
    const contextPatterns = dataset.archIndex.byContext[pattern.boundedContext];
    if (contextPatterns !== undefined) {
      for (const sibling of contextPatterns) {
        if (getPatternName(sibling) !== patternName) {
          sameContext.push(resolveNeighborEntry(dataset.patterns, getPatternName(sibling)));
        }
      }
    }
  }

  return {
    pattern: patternName,
    context: pattern.boundedContext,
    role: pattern.role,
    layer: undefined,
    uses,
    usedBy,
    dependsOn,
    enables,
    sameContext,
    implements: relationships?.implementsPatterns ?? [],
    implementedBy: (relationships?.implementedBy ?? []).map((entry) => entry.name),
  };
}

function aggregateContextDependencies(
  patterns: readonly ExtractedPattern[],
  dataset: PatternGraph,
): Set<string> {
  const dependencies = new Set<string>();

  for (const pattern of patterns) {
    const relationships = getRelationshipsForPattern(dataset, pattern);

    for (const entry of relationships.uses) {
      dependencies.add(entry);
    }

    for (const entry of relationships.dependsOn) {
      dependencies.add(entry);
    }
  }

  return dependencies;
}

function findIntegrationPoints(
  patterns: readonly ExtractedPattern[],
  fromContext: string,
  targetPatternNames: ReadonlySet<string>,
  toContext: string,
  dataset: PatternGraph,
): IntegrationPoint[] {
  const points: IntegrationPoint[] = [];

  for (const pattern of patterns) {
    const name = getPatternName(pattern);
    const relationships = getRelationshipsForPattern(dataset, pattern);

    for (const target of relationships.uses) {
      if (targetPatternNames.has(target)) {
        points.push({
          from: name,
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
          from: name,
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

export function compareContexts(
  leftContext: string,
  rightContext: string,
  dataset: PatternGraph,
): ContextComparison | undefined {
  const archIndex: ArchIndex | undefined = dataset.archIndex;
  if (archIndex === undefined) {
    return undefined;
  }

  const leftPatterns = archIndex.byContext[leftContext];
  const rightPatterns = archIndex.byContext[rightContext];
  if (leftPatterns === undefined || rightPatterns === undefined) {
    return undefined;
  }

  const leftNames = leftPatterns.map(getPatternName);
  const rightNames = rightPatterns.map(getPatternName);
  const leftNameSet = new Set(leftNames);
  const rightNameSet = new Set(rightNames);
  const leftDependencies = aggregateContextDependencies(leftPatterns, dataset);
  const rightDependencies = aggregateContextDependencies(rightPatterns, dataset);

  const sharedDependencies: string[] = [];
  const uniqueToContext1: string[] = [];
  for (const dependency of leftDependencies) {
    if (rightDependencies.has(dependency)) {
      sharedDependencies.push(dependency);
    } else {
      uniqueToContext1.push(dependency);
    }
  }

  const uniqueToContext2: string[] = [];
  for (const dependency of rightDependencies) {
    if (!leftDependencies.has(dependency)) {
      uniqueToContext2.push(dependency);
    }
  }

  return {
    context1: {
      name: leftContext,
      patternCount: leftPatterns.length,
      patterns: leftNames,
      allDependencies: [...leftDependencies],
    },
    context2: {
      name: rightContext,
      patternCount: rightPatterns.length,
      patterns: rightNames,
      allDependencies: [...rightDependencies],
    },
    sharedDependencies,
    uniqueToContext1,
    uniqueToContext2,
    integrationPoints: [
      ...findIntegrationPoints(leftPatterns, leftContext, rightNameSet, rightContext, dataset),
      ...findIntegrationPoints(rightPatterns, rightContext, leftNameSet, leftContext, dataset),
    ],
  };
}
