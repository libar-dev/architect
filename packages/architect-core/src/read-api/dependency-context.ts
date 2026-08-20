import type { PatternGraph, RelationshipEntry } from '../validation-schemas/pattern-graph.js';
import { findPatternByName, getPatternName, getRelationships } from './pattern-helpers.js';

/**
 * One node in a {@link DependencyContext} forest. The focal pattern is the root
 * of both forests (named by {@link DependencyContext.focal}) and is never
 * represented as a node, so there is no per-node focal flag. `truncated` is set
 * when the node has further edges in its direction that were not expanded
 * because the depth cap was reached.
 */
export interface DependencyContextNode {
  name: string;
  status?: string;
  truncated: boolean;
  children: readonly DependencyContextNode[];
}

/**
 * Focal-rooted, bidirectional transitive dependency context for a single
 * pattern. `upstream` is the cycle-safe closure over `dependsOn`∪`uses` (the
 * prerequisites / what the focal needs); `downstream` is the closure over
 * `usedBy`∪`enables` (the blast radius / what needs the focal). The focal
 * pattern is the root of both forests. `summary` precomputes the direct and
 * transitive counts so a consumer can size blast radius without re-walking.
 */
export interface DependencyContext {
  focal: string;
  upstream: readonly DependencyContextNode[];
  downstream: readonly DependencyContextNode[];
  summary: {
    upstreamDirect: number;
    upstreamTransitive: number;
    downstreamDirect: number;
    downstreamTransitive: number;
  };
  options: {
    maxDepth: number;
  };
}

const DEFAULT_DEPENDENCY_CONTEXT_MAX_DEPTH = 10;

type DependencyDirection = 'upstream' | 'downstream';

function directionEdges(entry: RelationshipEntry, direction: DependencyDirection): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  const edges =
    direction === 'upstream'
      ? [...entry.dependsOn, ...entry.uses]
      : [...entry.usedBy, ...entry.enables];

  for (const target of edges) {
    if (!seen.has(target)) {
      seen.add(target);
      ordered.push(target);
    }
  }
  return ordered;
}

/**
 * Builds focal-rooted dependency forests from the canonical relationship index.
 * The upstream walk follows `dependsOn` and `uses`; the downstream walk follows
 * their derived reverse edges, `usedBy` and `enables`. Each direction has its
 * own visited set so cycles stop without suppressing nodes in the other forest.
 */
export function getDependencyContext(
  graph: PatternGraph,
  name: string,
  options?: { readonly maxDepth?: number },
): DependencyContext | undefined {
  const focalPattern = findPatternByName(graph, name);
  const entry = getRelationships(graph, name);
  if (entry === undefined) return undefined;

  const focal = focalPattern !== undefined ? getPatternName(focalPattern) : name;
  const requestedDepth = options?.maxDepth;
  const maxDepth =
    requestedDepth !== undefined && requestedDepth >= 0
      ? requestedDepth
      : DEFAULT_DEPENDENCY_CONTEXT_MAX_DEPTH;

  function buildDependencyForest(
    rootName: string,
    direction: DependencyDirection,
    depthLimit: number,
  ): {
    readonly nodes: readonly DependencyContextNode[];
    readonly direct: number;
    readonly transitive: number;
  } {
    const visited = new Set<string>([rootName]);
    let transitive = 0;

    function expand(currentName: string, depth: number): DependencyContextNode[] {
      const currentEntry = getRelationships(graph, currentName);
      if (currentEntry === undefined) return [];

      const nodes: DependencyContextNode[] = [];
      for (const target of directionEdges(currentEntry, direction)) {
        if (visited.has(target)) continue;
        visited.add(target);
        transitive += 1;

        const pattern = findPatternByName(graph, target);
        const childEntry = getRelationships(graph, target);
        const hasFurther =
          childEntry !== undefined &&
          directionEdges(childEntry, direction).some((next) => !visited.has(next));
        const reachedCap = depth + 1 >= depthLimit;
        const children = reachedCap ? [] : expand(target, depth + 1);

        nodes.push({
          name: target,
          ...(pattern?.status !== undefined ? { status: pattern.status } : {}),
          truncated: reachedCap && hasFurther,
          children,
        });
      }

      return nodes;
    }

    const rootEntry = getRelationships(graph, rootName);
    return {
      nodes: depthLimit <= 0 ? [] : expand(rootName, 0),
      direct: rootEntry === undefined ? 0 : directionEdges(rootEntry, direction).length,
      transitive,
    };
  }

  const upstream = buildDependencyForest(focal, 'upstream', maxDepth);
  const downstream = buildDependencyForest(focal, 'downstream', maxDepth);

  return {
    focal,
    upstream: upstream.nodes,
    downstream: downstream.nodes,
    summary: {
      upstreamDirect: upstream.direct,
      upstreamTransitive: upstream.transitive,
      downstreamDirect: downstream.direct,
      downstreamTransitive: downstream.transitive,
    },
    options: { maxDepth },
  };
}
