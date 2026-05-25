/**
 * @architect-bounded-context:documentation-composition
 */
/**
 * Builds the architecture-diagram options schema and scope-filtered Mermaid
 * projection helpers.
 *
 * The context-neutral graph machinery (node/edge collection, grouping,
 * inter-group edge aggregation, `graph LR` emission) lives in
 * `../_shared/architecture-graph.internal.js` so the `overview` glimpse can
 * reuse it; this module keeps only the documentation-doc assembly (context map
 * + per-group detail sections, legend, scope validation).
 */

import { z } from 'zod';

import { heading, list, mermaid } from '../../blocks/schema.js';
import type { ProjectionContext } from '../../context/projection-context.js';
import { ProjectionError } from '../errors.js';
import type {
  ArchitectureDiagram,
  ArchitectureDiagramSection,
} from '../../fragments/documentation-composition/index.js';
import {
  ArchitectureDiagramScopeSchema,
  type ArchitectureDiagramScope,
} from '../../fragments/documentation-composition/supporting.js';
import {
  aggregateInterGroupEdges,
  buildGroups,
  buildMapMermaid,
  collectArchitectureEdges,
  collectArchitectureNodes,
  type EdgeShape,
  type NodeShape,
} from '../_shared/architecture-graph.internal.js';

import { hasText } from './documentation-composition-shared.internal.js';

const ARCHITECTURE_SCOPE_TITLES: Record<ArchitectureDiagramScope, string> = {
  component: 'Component View',
  layered: 'Layered View',
  'bounded-context': 'Bounded Context View',
  'product-area': 'Product Area View',
};

const ARCHITECTURE_MAP_TITLES: Record<ArchitectureDiagramScope, string> = {
  component: 'Context Map',
  layered: 'Layer Map',
  'bounded-context': 'Context Map',
  'product-area': 'Product-area Map',
};

export const ProjectArchitectureDiagramOptionsSchema = z
  .strictObject({
    scope: ArchitectureDiagramScopeSchema,
    scopeValue: z.string().optional(),
  })
  .readonly();

export type ProjectArchitectureDiagramOptions = z.infer<
  typeof ProjectArchitectureDiagramOptionsSchema
>;

export function buildArchitectureDiagram(
  context: ProjectionContext,
  options: ProjectArchitectureDiagramOptions,
): ArchitectureDiagram {
  const scope = options.scope;
  if ((scope === 'bounded-context' || scope === 'product-area') && !hasText(options.scopeValue)) {
    throw new ProjectionError(
      'MISSING_SCOPE_VALUE',
      `Architecture scope "${scope}" requires a scopeValue.`,
    );
  }

  const resolvedOptions = {
    ...options,
    scope,
  } satisfies Required<Pick<ProjectArchitectureDiagramOptions, 'scope'>> &
    Pick<ProjectArchitectureDiagramOptions, 'scopeValue'>;
  const nodes = collectArchitectureNodes(context, resolvedOptions);
  const patterns = nodes.map((node) => node.name);
  const edges = collectArchitectureEdges(context, nodes);

  return {
    kind: 'ArchitectureDiagram',
    scope,
    ...(hasText(options.scopeValue) ? { scopeValue: options.scopeValue.trim() } : {}),
    sections: buildArchitectureSections(nodes, edges, resolvedOptions),
    legend: [
      heading(3, 'Legend'),
      list([
        'Solid arrow = dependency',
        'Dashed arrow = usage',
        'Bold arrow = enablement',
        'Dotted line = reference',
      ]),
    ],
    patterns,
  };
}

/**
 * Splits the architecture view into many bounded diagram sections: an optional
 * context map (inter-group edges, only when there are ≥2 groups) followed by one
 * detail diagram per group (intra-group edges). This is what keeps every Mermaid
 * block renderable — no single block ever contains all patterns.
 */
function buildArchitectureSections(
  nodes: readonly NodeShape[],
  edges: readonly EdgeShape[],
  options: ProjectArchitectureDiagramOptions,
): ArchitectureDiagramSection[] {
  if (nodes.length === 0) {
    return [
      {
        title: ARCHITECTURE_SCOPE_TITLES[options.scope],
        diagram: mermaid(buildEmptyMermaid(options)),
        patterns: [],
      },
    ];
  }

  const groups = buildGroups(nodes, options.scope);
  const groupKeyByNodeId = new Map<string, string>();
  for (const group of groups) {
    for (const node of group.nodes) {
      groupKeyByNodeId.set(node.nodeId, group.key);
    }
  }

  const sections: ArchitectureDiagramSection[] = [];

  if (groups.length >= 2) {
    const mapEdges = aggregateInterGroupEdges(edges, groupKeyByNodeId);
    sections.push({
      title: ARCHITECTURE_MAP_TITLES[options.scope],
      description:
        'Each node is a group; each arrow is a cross-group dependency (`depends-on` / `uses`, pointing from dependant to dependency). Usage, enablement, and see-also relationships appear in the per-group diagrams below.',
      diagram: mermaid(buildMapMermaid(groups, mapEdges)),
      patterns: [],
    });
  }

  for (const group of groups) {
    const groupNodeIds = new Set(group.nodes.map((node) => node.nodeId));
    const intraEdges = edges.filter(
      (edge) => groupNodeIds.has(edge.from) && groupNodeIds.has(edge.to),
    );
    const patterns = group.nodes.map((node) => node.name);
    sections.push({
      title: `${group.title} (${String(patterns.length)} ${patterns.length === 1 ? 'pattern' : 'patterns'})`,
      diagram: mermaid(buildGroupMermaid(group.nodes, intraEdges)),
      patterns,
    });
  }

  return sections;
}

function buildEmptyMermaid(options: ProjectArchitectureDiagramOptions): string {
  return [
    'graph TD',
    `  empty["No patterns found for ${ARCHITECTURE_SCOPE_TITLES[options.scope]}${hasText(options.scopeValue) ? `: ${options.scopeValue.trim()}` : ''}"]`,
  ].join('\n');
}

function buildGroupMermaid(nodes: readonly NodeShape[], edges: readonly EdgeShape[]): string {
  const lines = ['graph TD'];
  for (const node of nodes) {
    lines.push(`  ${node.nodeId}["${node.label}"]`);
  }
  for (const edge of edges) {
    pushEdgeLine(lines, edge);
  }
  return lines.join('\n');
}

function pushEdgeLine(lines: string[], edge: EdgeShape): void {
  if (edge.operator === '-.-') {
    lines.push(`  ${edge.from} -. ${edge.label} .- ${edge.to}`);
    return;
  }
  lines.push(`  ${edge.from} ${edge.operator}|${edge.label}| ${edge.to}`);
}
