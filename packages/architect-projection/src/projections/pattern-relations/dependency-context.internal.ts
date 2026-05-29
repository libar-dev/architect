/**
 * @architect-bounded-context:pattern-relations
 */
/**
 * Builds the focal-rooted, bidirectional dependency context for one pattern by
 * delegating to the kernel's cycle-safe transitive-closure accessor.
 */

import {
  createPatternGraphAPI,
  findPatternByName,
  type DependencyContext as KernelDependencyContext,
  type DependencyContextNode as KernelDependencyContextNode,
  type ExtractedPattern,
} from '@libar-dev/architect-core';
import { z } from 'zod';

import type { ProjectionContext } from '../../context/projection-context.js';
import type { DependencyContextNode } from '../../fragments/pattern-relations/supporting.js';

import {
  requirePattern,
  getPatternName,
  getRelationships,
} from '../_shared/pattern-helpers.internal.js';

export const DepContextOptionsSchema = z
  .strictObject({
    pattern: z.string(),
    maxDepth: z.number().int(),
  })
  .readonly();

export type DepContextOptions = z.infer<typeof DepContextOptionsSchema>;

/**
 * The shaped fragment payload (everything except the discriminating `kind`),
 * built from the kernel dependency-context accessor.
 */
export interface DependencyContextPayload {
  focal: string;
  upstream: DependencyContextNode[];
  downstream: DependencyContextNode[];
  summary: KernelDependencyContext['summary'];
  options: { maxDepth: number };
}

function toFragmentNode(node: KernelDependencyContextNode): DependencyContextNode {
  return {
    name: node.name,
    ...(node.status !== undefined ? { status: node.status } : {}),
    ...(node.phase !== undefined ? { phase: node.phase } : {}),
    truncated: node.truncated,
    children: node.children.map(toFragmentNode),
  };
}

/** A decision pattern carries a non-empty `@architect-adr` tag. */
function isDecisionPattern(pattern: ExtractedPattern | undefined): boolean {
  return typeof pattern?.adr === 'string' && pattern.adr.trim().length > 0;
}

/**
 * Walks the see-also governance chain from a decision focal, following only
 * see-also edges that lead to other decision patterns. The kernel dependency
 * context deliberately ignores see-also (it carries no dependency implication),
 * so for ADRs — whose only structured cross-links are see-also — the chain is
 * grafted into the upstream forest as governance context. The walk is scoped to
 * adr→adr edges and bounded by `maxDepth`, keeping the traversal small enough to
 * stay clear of the perf gate; non-decision focals never enter this path.
 */
function walkGovernanceChain(
  context: ProjectionContext,
  focalName: string,
  maxDepth: number,
): { nodes: DependencyContextNode[]; direct: number; transitive: number } {
  if (maxDepth <= 0) {
    return { nodes: [], direct: 0, transitive: 0 };
  }

  const visited = new Set<string>([focalName]);
  let transitive = 0;

  function expand(name: string, depth: number): DependencyContextNode[] {
    const relationships = getRelationships(context, name);
    if (relationships === undefined) {
      return [];
    }

    const nodes: DependencyContextNode[] = [];
    for (const target of relationships.seeAlso) {
      if (visited.has(target)) {
        continue;
      }
      const targetPattern = findPatternByName(context.graph, target);
      if (!isDecisionPattern(targetPattern)) {
        continue;
      }
      visited.add(target);
      transitive += 1;

      const hasFurther = (getRelationships(context, target)?.seeAlso ?? []).some(
        (next) => !visited.has(next) && isDecisionPattern(findPatternByName(context.graph, next)),
      );
      const reachedCap = depth + 1 >= maxDepth;
      const children = reachedCap ? [] : expand(target, depth + 1);

      nodes.push({
        name: target,
        ...(targetPattern?.status !== undefined ? { status: targetPattern.status } : {}),
        ...(targetPattern?.phase !== undefined ? { phase: targetPattern.phase } : {}),
        truncated: reachedCap && hasFurther,
        children,
      });
    }
    return nodes;
  }

  const directEdges = (getRelationships(context, focalName)?.seeAlso ?? []).filter((target) =>
    isDecisionPattern(findPatternByName(context.graph, target)),
  );
  return { nodes: expand(focalName, 0), direct: directEdges.length, transitive };
}

export function buildDependencyContext(
  context: ProjectionContext,
  options: DepContextOptions,
): DependencyContextPayload {
  // Resolve the canonical focal name even when the pattern carries no
  // relationship entry, so an isolated pattern still roots an (empty) context.
  const focalPattern = requirePattern(context, options.pattern);
  const focalName = getPatternName(focalPattern);

  const api = createPatternGraphAPI(context.graph);
  const kernelContext = api.getDependencyContext(focalName, { maxDepth: options.maxDepth });

  if (kernelContext === undefined) {
    return {
      focal: focalName,
      upstream: [],
      downstream: [],
      summary: {
        upstreamDirect: 0,
        upstreamTransitive: 0,
        downstreamDirect: 0,
        downstreamTransitive: 0,
      },
      options: { maxDepth: options.maxDepth },
    };
  }

  const upstream = kernelContext.upstream.map(toFragmentNode);
  const downstream = kernelContext.downstream.map(toFragmentNode);

  // Decision patterns express their structured relations only as see-also
  // cross-links, which the kernel context (rightly) ignores. Graft the see-also
  // governance chain into the upstream forest so `dep-tree <ADR>` surfaces the
  // decision lineage instead of an isolated node. Scoped to adr→adr edges.
  if (isDecisionPattern(focalPattern)) {
    const existingUpstream = new Set(upstream.map((node) => node.name));
    const governance = walkGovernanceChain(
      context,
      kernelContext.focal,
      kernelContext.options.maxDepth,
    );
    const grafted = governance.nodes.filter((node) => !existingUpstream.has(node.name));
    if (grafted.length > 0) {
      upstream.push(...grafted);
      return {
        focal: kernelContext.focal,
        upstream,
        downstream,
        summary: {
          upstreamDirect: kernelContext.summary.upstreamDirect + governance.direct,
          upstreamTransitive: kernelContext.summary.upstreamTransitive + governance.transitive,
          downstreamDirect: kernelContext.summary.downstreamDirect,
          downstreamTransitive: kernelContext.summary.downstreamTransitive,
        },
        options: { maxDepth: kernelContext.options.maxDepth },
      };
    }
  }

  return {
    focal: kernelContext.focal,
    upstream,
    downstream,
    summary: kernelContext.summary,
    options: { maxDepth: kernelContext.options.maxDepth },
  };
}
