/**
 * @architect
 * @architect-pattern ArchitectureGraphProjection
 * @architect-status active
 * @architect-role:projection
 * @architect-bounded-context:projection
 *
 * ## Whole-graph architecture dump
 *
 * **Value:** Emits the entire production architecture — every node (with role,
 * bounded-context, layer, and workspace package) and every typed edge — in ONE
 * structured call. Lets a consumer (Studio, `architect_arch_neighborhood`
 * loops, a graph-explorer UI) obtain the whole graph in one payload.
 *
 * **Invariant:** Reuses the exact node/edge collection behind
 * `docs-live/ARCHITECTURE.md` and the `overview` glimpse (component scope,
 * production patterns — test features and working-state excluded), so the dump is
 * consistent with the rendered architecture doc. Ordering is deterministic
 * (the underlying collection sorts).
 *
 * ### When to Use
 *
 * - Projects the whole component-scope architecture graph as structured nodes and typed edges for the `arch graph` verb and graph-explorer surfaces.
 */
import { z } from 'zod';

import type { ProjectionContext } from '../../context/projection-context.js';
import {
  collectArchitectureEdges,
  collectArchitectureNodes,
} from '../_shared/architecture-graph.internal.js';

export const ArchitectureGraphNodeSchema = z.strictObject({
  name: z.string(),
  role: z.string().optional(),
  boundedContext: z.string().optional(),
  layer: z.string().optional(),
  package: z.string(),
});

export const ArchitectureGraphEdgeSchema = z.strictObject({
  from: z.string(),
  to: z.string(),
  kind: z.enum(['depends-on', 'uses', 'enables', 'see-also']),
});

export const ArchitectureGraphSchema = z.strictObject({
  kind: z.literal('ArchitectureGraph'),
  scope: z.literal('component'),
  nodeCount: z.number().int().nonnegative(),
  edgeCount: z.number().int().nonnegative(),
  nodes: z.array(ArchitectureGraphNodeSchema),
  edges: z.array(ArchitectureGraphEdgeSchema),
});

export type ArchitectureGraphNode = z.infer<typeof ArchitectureGraphNodeSchema>;
export type ArchitectureGraphEdge = z.infer<typeof ArchitectureGraphEdgeSchema>;
export type ArchitectureGraph = z.infer<typeof ArchitectureGraphSchema>;

/**
 * Build the whole component-scope architecture graph as structured nodes + typed
 * edges. Edge endpoints are pattern names (the collection's internal node ids are
 * translated back), so the output is self-describing without a separate id map.
 */
export function projectArchitectureGraph(context: ProjectionContext): ArchitectureGraph {
  const nodes = collectArchitectureNodes(context, { scope: 'component' });
  const edges = collectArchitectureEdges(context, nodes);
  const nameByNodeId = new Map(nodes.map((node) => [node.nodeId, node.name] as const));

  const graphNodes: ArchitectureGraphNode[] = nodes.map((node) => ({
    name: node.name,
    ...(node.role !== undefined ? { role: node.role } : {}),
    ...(node.archContext !== undefined ? { boundedContext: node.archContext } : {}),
    ...(node.archLayer !== undefined ? { layer: node.archLayer } : {}),
    package: node.packageLabel,
  }));

  const graphEdges: ArchitectureGraphEdge[] = edges.map((edge) => ({
    from: nameByNodeId.get(edge.from) ?? edge.from,
    to: nameByNodeId.get(edge.to) ?? edge.to,
    kind: edge.label as ArchitectureGraphEdge['kind'],
  }));

  return {
    kind: 'ArchitectureGraph',
    scope: 'component',
    nodeCount: graphNodes.length,
    edgeCount: graphEdges.length,
    nodes: graphNodes,
    edges: graphEdges,
  };
}
