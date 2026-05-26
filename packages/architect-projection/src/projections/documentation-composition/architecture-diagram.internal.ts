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
  CrossPackageContextEntry,
  FanInEntry,
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
  escapeMermaidLabel,
  type EdgeShape,
  type NodeShape,
} from '../_shared/architecture-graph.internal.js';
import { getRelationships } from '../_shared/pattern-helpers.internal.js';

import { hasText } from './documentation-composition-shared.internal.js';

const ARCHITECTURE_SCOPE_TITLES: Record<ArchitectureDiagramScope, string> = {
  component: 'Component View',
  layered: 'Layered View',
  'bounded-context': 'Bounded Context View',
  'product-area': 'Product Area View',
  package: 'Package View',
};

const ARCHITECTURE_MAP_TITLES: Record<ArchitectureDiagramScope, string> = {
  component: 'Context Map',
  layered: 'Layer Map',
  'bounded-context': 'Context Map',
  'product-area': 'Product-area Map',
  package: 'Package Map',
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
  const fanIn = buildFanIn(context, nodes);
  const crossPackageContexts = buildCrossPackageContexts(nodes);

  return {
    kind: 'ArchitectureDiagram',
    scope,
    ...(hasText(options.scopeValue) ? { scopeValue: options.scopeValue.trim() } : {}),
    sections: buildArchitectureSections(nodes, edges, resolvedOptions),
    legend: [
      heading(3, 'Legend'),
      list(['Solid arrow = dependency (depends-on / uses)', 'Dotted line = reference (see-also)']),
    ],
    ...(fanIn.length > 0 ? { fanIn } : {}),
    ...(crossPackageContexts.length > 0 ? { crossPackageContexts } : {}),
    patterns,
  };
}

/**
 * Detect bounded contexts whose in-view patterns resolve to more than one workspace
 * package — seams where a single context is implemented across package boundaries.
 * Sorted by descending package spread then context name for deterministic output.
 */
function buildCrossPackageContexts(nodes: readonly NodeShape[]): CrossPackageContextEntry[] {
  const byContext = new Map<string, { readonly packages: Set<string>; count: number }>();
  for (const node of nodes) {
    if (node.archContext === undefined) {
      continue;
    }
    const entry = byContext.get(node.archContext) ?? { packages: new Set<string>(), count: 0 };
    entry.packages.add(node.packageLabel);
    entry.count += 1;
    byContext.set(node.archContext, entry);
  }
  return [...byContext.entries()]
    .filter(([, value]) => value.packages.size >= 2)
    .map(([context, value]) => ({
      context,
      packages: [...value.packages].sort((left, right) => left.localeCompare(right)),
      patternCount: value.count,
    }))
    .sort(
      (left, right) =>
        right.packages.length - left.packages.length || left.context.localeCompare(right.context),
    );
}

const FAN_IN_LIMIT = 10;
const FAN_IN_TOP_CONSUMERS = 5;

/**
 * Rank in-view patterns by how many in-view peers depend on them (`usedBy`), so the
 * doc surfaces hub patterns that render as edgeless leaves in the per-group detail
 * diagrams (their dependants sit in other groups). Consumers are restricted to nodes
 * already in the view so the table never dangles, and both the rows and each row's
 * consumer list are sorted for deterministic output.
 */
function buildFanIn(context: ProjectionContext, nodes: readonly NodeShape[]): FanInEntry[] {
  const inView = new Set(nodes.map((node) => node.name));
  return nodes
    .map((node) => {
      const consumers = (getRelationships(context, node.name)?.usedBy ?? [])
        .filter((consumer) => inView.has(consumer))
        .sort((left, right) => left.localeCompare(right));
      return {
        pattern: node.name,
        usedByCount: consumers.length,
        topConsumers: consumers.slice(0, FAN_IN_TOP_CONSUMERS),
      } satisfies FanInEntry;
    })
    .filter((entry) => entry.usedByCount > 0)
    .sort(
      (left, right) =>
        right.usedByCount - left.usedByCount || left.pattern.localeCompare(right.pattern),
    )
    .slice(0, FAN_IN_LIMIT);
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
        'Each node is a group; each arrow is a cross-group dependency (`depends-on` / `uses`, pointing from dependant to dependency). The per-group diagrams below detail each group’s internal dependencies and any see-also references.',
      diagram: mermaid(buildMapMermaid(groups, mapEdges)),
      patterns: [],
    });
  }

  for (const group of groups) {
    const groupNodeIds = new Set(group.nodes.map((node) => node.nodeId));
    const intraEdges = normalizeDetailEdges(
      edges.filter((edge) => groupNodeIds.has(edge.from) && groupNodeIds.has(edge.to)),
    );
    const patterns = group.nodes.map((node) => node.name);
    sections.push({
      // Raw sourced group title (bounded-context / package / role / layer name). The
      // renderer owns markdown escaping (ADR-009) and composes the "(N patterns)" suffix
      // from `patterns` — never trust sourced text as raw markdown by pre-baking it here.
      title: group.title,
      diagram: mermaid(buildGroupMermaid(group.nodes, intraEdges)),
      patterns,
    });
  }

  return sections;
}

function buildEmptyMermaid(options: ProjectArchitectureDiagramOptions): string {
  return [
    'graph TD',
    `  empty["No patterns found for ${ARCHITECTURE_SCOPE_TITLES[options.scope]}${hasText(options.scopeValue) ? `: ${escapeMermaidLabel(options.scopeValue.trim())}` : ''}"]`,
  ].join('\n');
}

/**
 * Collapses a group's intra-group edges to the legible forward-dependency shape
 * for a detail diagram (generalizes D-15's context-map rule to the per-group
 * diagrams):
 *
 * - `enables` is a derived REVERSE edge (B enables A ⇔ A depends-on / uses B).
 *   Within a group its forward counterpart is already present, so a forward
 *   `enables` arrow is a contradictory back-arrow — dropped.
 * - `depends-on` and `uses` share the same forward direction (a single
 *   `@architect-uses` edge yields both), so they collapse to ONE solid
 *   dependency arrow per ordered pair. A genuine mutual dependency survives as
 *   two arrows (one each way), since each direction is its own ordered pair.
 * - `see-also` is a distinct non-directional reference and is preserved.
 */
function normalizeDetailEdges(edges: readonly EdgeShape[]): EdgeShape[] {
  const dependency = new Map<string, EdgeShape>();
  const seeAlso = new Map<string, EdgeShape>();

  for (const edge of edges) {
    const key = `${edge.from}->${edge.to}`;
    if (edge.label === 'depends-on' || edge.label === 'uses') {
      if (!dependency.has(key)) {
        dependency.set(key, { from: edge.from, to: edge.to, label: 'depends-on', operator: '-->' });
      }
    } else if (edge.label === 'see-also' && !seeAlso.has(key)) {
      seeAlso.set(key, edge);
    }
    // `enables` (derived reverse) is intentionally dropped.
  }

  return [...dependency.values(), ...seeAlso.values()].sort(
    (left, right) =>
      left.from.localeCompare(right.from) ||
      left.to.localeCompare(right.to) ||
      left.label.localeCompare(right.label),
  );
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
